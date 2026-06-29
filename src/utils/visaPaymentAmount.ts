/** Visa application payment calculation (amounts in GBP). */

import { getVisaFeeForCountryCode, DEFAULT_VISA_FEE_GBP, VISA_FEES } from '../data/visaFees';
import {
  calculateTotalServiceFeeGbp,
  getDiscountedServiceFeeGbp,
  getServiceFeeDiscountPercent,
  BASE_SERVICE_FEE_GBP,
  type ServiceFeeBreakdown,
} from '../config/visaServiceFee';
import { isSchengenCountry } from '../utils/schengenCountries';
import {
  calculateSchengenServiceTotalGbp,
  countTravelDays,
  getSchengenServiceFeeGbp,
  isUkResident,
  SCHENGEN_APPOINTMENT_BOOKING_FEE_GBP,
} from '../config/schengenPricing';
import { EVISA_EXPRESS_PROCESSING_FEE_GBP } from '../config/evisaPricing';
import { parseEligibilityFromSearchParams } from '../engine/visaRoutingEngine';
import { isUnitedStates } from '../utils/unitedStatesVisa';
import { applyPromoToServiceFeeGbp, type PromoDiscount } from '../config/promoCodes';

export interface VisaPaymentBreakdown {
  visaFees: number;
  serviceFee: number;
  serviceFeeBeforePromo: number;
  serviceFeeBreakdown: ServiceFeeBreakdown;
  appointmentFee: number;
  travelInsurance: number;
  expressFee: number;
  promoSavings: number;
  total: number;
  travelerCount: number;
}

/** Main applicant + additional travelers from application stepper data. */
export function getTravelerCount(applicationData?: Record<string, unknown> | null): number {
  const travelers = applicationData?.travelers;
  if (Array.isArray(travelers)) {
    return travelers.length + 1;
  }
  return 1;
}

function getEvisaAddons(applicationData?: Record<string, unknown> | null) {
  const addons = applicationData?.evisaAddons as { expressProcessing?: boolean } | undefined;
  return { expressProcessing: Boolean(addons?.expressProcessing) };
}

function getSchengenAddons(applicationData?: Record<string, unknown> | null) {
  const addons = applicationData?.schengenAddons as
    | { travelInsurance?: boolean }
    | undefined;
  return {
    addTravelInsurance: Boolean(addons?.travelInsurance),
  };
}

function isEvisaDestinationCode(destinationCode?: string | null): boolean {
  if (!destinationCode) return false;
  const code = destinationCode.toLowerCase();
  if (isSchengenCountry(code) || isUnitedStates(code)) return false;
  return VISA_FEES.some((entry) => entry.countryCode === code);
}

function getTravelDaysFromApplication(applicationData?: Record<string, unknown> | null): number {
  const travelDates = applicationData?.travelDates as
    | { arrival?: string; departure?: string }
    | undefined;
  if (!travelDates?.arrival || !travelDates?.departure) return 1;
  return countTravelDays(travelDates.arrival, travelDates.departure) || 1;
}

function resolveUkResidentFromApplication(
  applicationData?: Record<string, unknown> | null,
  nationalityCode?: string | null
): boolean {
  const eligibility = applicationData?.eligibility as
    | {
        residenceCountry?: string | null;
        residenceMode?: 'home' | 'abroad';
        passportNationality?: string;
      }
    | undefined;

  if (eligibility) {
    return isUkResident(
      eligibility.residenceCountry ?? null,
      eligibility.residenceMode ?? 'home',
      eligibility.passportNationality || nationalityCode || ''
    );
  }

  if (nationalityCode) {
    return isUkResident(null, 'home', nationalityCode);
  }

  return false;
}

export function getVisaApplicationBreakdownGbp(
  destinationCode?: string | null,
  applicationData?: Record<string, unknown> | null,
  subscriptionTier?: string | null,
  nationalityCode?: string | null,
  promo?: PromoDiscount | null
): VisaPaymentBreakdown {
  const travelerCount = getTravelerCount(applicationData);
  const subscriptionDiscount = getServiceFeeDiscountPercent(subscriptionTier);

  if (promo?.waiveAllFees) {
    const emptyBreakdown = calculateTotalServiceFeeGbp({
      travelerCount,
      subscriptionDiscountPercent: 0,
      subscriptionTier: subscriptionTier ?? null,
      destinationCode,
    });
    return {
      visaFees: 0,
      serviceFee: 0,
      serviceFeeBeforePromo: 0,
      serviceFeeBreakdown: { ...emptyBreakdown, total: 0, undiscountedTotal: 0 },
      appointmentFee: 0,
      travelInsurance: 0,
      expressFee: 0,
      promoSavings: 0,
      total: 0,
      travelerCount,
    };
  }

  if (destinationCode && isSchengenCountry(destinationCode)) {
    const { addTravelInsurance } = getSchengenAddons(applicationData);
    const travelDays = getTravelDaysFromApplication(applicationData);
    const ukResident = resolveUkResidentFromApplication(applicationData, nationalityCode);

    const schengen = calculateSchengenServiceTotalGbp({
      travelerCount,
      discountPercent: subscriptionDiscount,
      subscriptionTier: subscriptionTier ?? null,
      addTravelInsurance,
      travelDays,
      isUkResident: ukResident,
    });

    const serviceFeeBeforePromo = schengen.serviceFee;
    const serviceFee = applyPromoToServiceFeeGbp(serviceFeeBeforePromo, promo);
    const promoSavings = Number((serviceFeeBeforePromo - serviceFee).toFixed(2));
    const total = Number(
      (schengen.appointmentFee + serviceFee + schengen.travelInsurance).toFixed(2)
    );

    return {
      visaFees: 0,
      serviceFee,
      serviceFeeBeforePromo,
      serviceFeeBreakdown: schengen.serviceFeeBreakdown,
      appointmentFee: schengen.appointmentFee,
      travelInsurance: schengen.travelInsurance,
      expressFee: 0,
      promoSavings,
      total,
      travelerCount,
    };
  }

  const visaFeePerTraveler = destinationCode
    ? getVisaFeeForCountryCode(destinationCode)
    : DEFAULT_VISA_FEE_GBP;
  const visaFees = visaFeePerTraveler * travelerCount;
  const serviceFeeBreakdown = calculateTotalServiceFeeGbp({
    travelerCount,
    subscriptionDiscountPercent: subscriptionDiscount,
    subscriptionTier: subscriptionTier ?? null,
    destinationCode,
  });
  const serviceFeeBeforePromo = serviceFeeBreakdown.total;
  const serviceFee = applyPromoToServiceFeeGbp(serviceFeeBeforePromo, promo);
  const promoSavings = Number((serviceFeeBeforePromo - serviceFee).toFixed(2));

  let expressFee = 0;
  const { expressProcessing } = getEvisaAddons(applicationData);
  if (expressProcessing && isEvisaDestinationCode(destinationCode)) {
    expressFee = EVISA_EXPRESS_PROCESSING_FEE_GBP;
  }

  const total = Number((visaFees + serviceFee + expressFee).toFixed(2));

  return {
    visaFees,
    serviceFee,
    serviceFeeBeforePromo,
    serviceFeeBreakdown,
    appointmentFee: 0,
    travelInsurance: 0,
    expressFee,
    promoSavings,
    total,
    travelerCount,
  };
}

export function getVisaApplicationTotalGbp(
  destinationCode?: string | null,
  applicationData?: Record<string, unknown> | null,
  subscriptionTier?: string | null,
  nationalityCode?: string | null,
  promo?: PromoDiscount | null
): number {
  return getVisaApplicationBreakdownGbp(
    destinationCode,
    applicationData,
    subscriptionTier,
    nationalityCode,
    promo
  ).total;
}

/** Total visa application charge in pence (Stripe smallest currency unit). */
export function getVisaApplicationAmountPence(
  destinationCode?: string | null,
  applicationData?: Record<string, unknown> | null,
  subscriptionTier?: string | null,
  nationalityCode?: string | null,
  promo?: PromoDiscount | null
): number {
  return Math.round(
    getVisaApplicationTotalGbp(
      destinationCode,
      applicationData,
      subscriptionTier,
      nationalityCode,
      promo
    ) * 100
  );
}

export function getVisaApplicationAmountGbp(
  destinationCode?: string | null,
  applicationData?: Record<string, unknown> | null,
  subscriptionTier?: string | null,
  nationalityCode?: string | null,
  promo?: PromoDiscount | null
): number {
  return (
    getVisaApplicationAmountPence(
      destinationCode,
      applicationData,
      subscriptionTier,
      nationalityCode,
      promo
    ) / 100
  );
}

export function buildApplicationPaymentContext(
  nationalityCode: string,
  searchParams: string,
  schengenAddons?: { travelInsurance?: boolean }
) {
  const eligibility = parseEligibilityFromSearchParams(nationalityCode, searchParams);
  return {
    eligibility,
    schengenAddons: schengenAddons ?? {},
  };
}

/** Exported for display labels in checkout UI */
export { BASE_SERVICE_FEE_GBP, getSchengenServiceFeeGbp, SCHENGEN_APPOINTMENT_BOOKING_FEE_GBP };
