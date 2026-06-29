/** Server-side visa payment calculation (mirrors src/utils/visaPaymentAmount.ts). */

const BASE_SERVICE_FEE_GBP = 50;
const SCHENGEN_APPOINTMENT_BOOKING_FEE_GBP = 35;
const SCHENGEN_SERVICE_FEE_GBP = 90;
const SCHENGEN_TRAVEL_INSURANCE_BASE_GBP = 20;
const SCHENGEN_TRAVEL_INSURANCE_EXTRA_PER_DAY_GBP = 10;
const EVISA_EXPRESS_PROCESSING_FEE_GBP = 100;
const DEFAULT_VISA_FEE_GBP = 61.5;

const SCHENGEN_CODES = new Set([
  'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu',
  'is', 'it', 'lv', 'li', 'lt', 'lu', 'mt', 'nl', 'no', 'pl', 'pt', 'ro', 'sk',
  'si', 'es', 'se', 'ch',
]);

const ADDITIONAL_APPLICANT_SERVICE_FEE_DISCOUNT_PERCENT = {
  free: 20,
  none: 20,
  basic: 20,
  premium: 30,
  monthly: 30,
  enterprise: 50,
  business: 50,
  lifetime: 30,
  admin: 0,
};

const SERVICE_FEE_DISCOUNT_PERCENT = {
  free: 0,
  none: 0,
  basic: 0,
  premium: 10,
  monthly: 10,
  enterprise: 20,
  business: 20,
  lifetime: 10,
};

const VISA_FEES = [
  { countryCode: 'tr', fee: 35 },
  { countryCode: 'ae', fee: 95 },
  { countryCode: 'ma', fee: 22 },
  { countryCode: 'eg', fee: 25 },
  { countryCode: 'in', fee: 25 },
  { countryCode: 'au', fee: 20 },
  { countryCode: 'nz', fee: 35 },
  { countryCode: 'ke', fee: 51 },
  { countryCode: 'tz', fee: 50 },
  { countryCode: 'vn', fee: 25 },
  { countryCode: 'lk', fee: 35 },
];

function isSchengenCountry(code) {
  return code && SCHENGEN_CODES.has(String(code).toLowerCase());
}

function getServiceFeeDiscountPercent(tier) {
  if (!tier) return 0;
  return SERVICE_FEE_DISCOUNT_PERCENT[String(tier).toLowerCase()] ?? 0;
}

function getAdditionalApplicantServiceFeeDiscountPercent(tier) {
  if (!tier) return 20;
  const key = String(tier).toLowerCase();
  if (key === 'enterprise' || key === 'business') return 50;
  if (key === 'premium' || key === 'monthly' || key === 'lifetime') return 30;
  return ADDITIONAL_APPLICANT_SERVICE_FEE_DISCOUNT_PERCENT[key] ?? 20;
}

function calculateTotalServiceFeeGbp({
  travelerCount,
  subscriptionDiscountPercent,
  subscriptionTier,
  destinationCode,
  baseServiceFeeGbp,
}) {
  const count = Math.max(travelerCount, 1);
  const base = baseServiceFeeGbp ?? getBaseServiceFeeGbp(destinationCode);
  const firstApplicantFee = getDiscountedServiceFeeGbp(subscriptionDiscountPercent, destinationCode, base);
  const additionalDiscount = getAdditionalApplicantServiceFeeDiscountPercent(subscriptionTier);
  const additionalApplicantFee = Number((base * (1 - additionalDiscount / 100)).toFixed(2));
  const additionalApplicantCount = Math.max(0, count - 1);
  const total = Number((firstApplicantFee + additionalApplicantFee * additionalApplicantCount).toFixed(2));
  const undiscountedTotal = Number((base * count).toFixed(2));
  return {
    baseFeeGbp: base,
    firstApplicantFee,
    additionalApplicantFee,
    additionalApplicantCount,
    additionalApplicantDiscountPercent: additionalDiscount,
    subscriptionDiscountPercent: subscriptionDiscountPercent ?? 0,
    undiscountedTotal,
    total,
  };
}

function getDiscountedServiceFeeGbp(discountPercent, destinationCode, baseOverride) {
  const base = baseOverride ?? (destinationCode
    ? getBaseServiceFeeGbp(destinationCode)
    : BASE_SERVICE_FEE_GBP);
  return Number((base * (1 - discountPercent / 100)).toFixed(2));
}

function getSchengenServiceFeeGbp(discountPercent = 0) {
  return Number((SCHENGEN_SERVICE_FEE_GBP * (1 - discountPercent / 100)).toFixed(2));
}

function applyPromoToServiceFeeGbp(serviceFeeGbp, promo) {
  if (!promo) return serviceFeeGbp;
  if (promo.waiveAllFees) return 0;
  if (!promo.discountPercent) return serviceFeeGbp;
  return Number((serviceFeeGbp * (1 - promo.discountPercent / 100)).toFixed(2));
}

function getTravelerCount(applicationData) {
  const travelers = applicationData?.travelers;
  if (Array.isArray(travelers)) return travelers.length + 1;
  return 1;
}

function countTravelDays(arrival, departure) {
  if (!arrival || !departure) return 0;
  const start = new Date(arrival);
  const end = new Date(departure);
  const diffMs = end.getTime() - start.getTime();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || diffMs < 0) return 0;
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function isUkResident(residenceCountry, residenceMode, passportNationality) {
  const residence =
    residenceMode === 'abroad' && residenceCountry
      ? String(residenceCountry).toLowerCase()
      : String(passportNationality || '').toLowerCase();
  return residence === 'gb';
}

function calculateSchengenTravelInsuranceGbp(travelDays) {
  const days = Math.max(travelDays, 1);
  if (days < 5) return SCHENGEN_TRAVEL_INSURANCE_BASE_GBP;
  return SCHENGEN_TRAVEL_INSURANCE_BASE_GBP + (days - 4) * SCHENGEN_TRAVEL_INSURANCE_EXTRA_PER_DAY_GBP;
}

let dynamicFeeByCode = null;

export async function loadDynamicEvisaFees(supabase) {
  try {
    const { data, error } = await supabase
      .from('evisa_country_fees')
      .select('country_code, visa_fee_gbp, service_fee_gbp');

    if (error) {
      if (error.code === '42P01') return;
      throw error;
    }

    if (data?.length) {
      dynamicFeeByCode = new Map(
        data.map((row) => [String(row.country_code).toLowerCase(), row])
      );
    }
  } catch (err) {
    console.error('loadDynamicEvisaFees failed:', err);
  }
}

function getBaseServiceFeeGbp(destinationCode) {
  const dynamic = dynamicFeeByCode?.get(String(destinationCode).toLowerCase());
  if (dynamic) return Number(dynamic.service_fee_gbp);
  return BASE_SERVICE_FEE_GBP;
}

function getVisaFeeForCountryCode(code) {
  const normalized = String(code).toLowerCase();
  const dynamic = dynamicFeeByCode?.get(normalized);
  if (dynamic) return Number(dynamic.visa_fee_gbp);
  const entry = VISA_FEES.find((e) => e.countryCode === normalized);
  return entry ? entry.fee : DEFAULT_VISA_FEE_GBP;
}

function isEvisaDestinationCode(destinationCode) {
  if (!destinationCode) return false;
  const code = String(destinationCode).toLowerCase();
  if (isSchengenCountry(code) || code === 'us') return false;
  return VISA_FEES.some((entry) => entry.countryCode === code);
}

export function calculateVisaPaymentBreakdown({
  destinationCode,
  applicationData,
  subscriptionTier,
  nationalityCode,
  promo,
}) {
  const travelerCount = getTravelerCount(applicationData);
  const subscriptionDiscount = getServiceFeeDiscountPercent(subscriptionTier);

  if (promo?.waiveAllFees) {
    return {
      visaFees: 0,
      serviceFee: 0,
      serviceFeeBeforePromo: 0,
      appointmentFee: 0,
      travelInsurance: 0,
      expressFee: 0,
      promoSavings: 0,
      total: 0,
      travelerCount,
    };
  }

  if (destinationCode && isSchengenCountry(destinationCode)) {
    const addons = applicationData?.schengenAddons || {};
    const travelDates = applicationData?.travelDates || {};
    const travelDays = countTravelDays(travelDates.arrival, travelDates.departure) || 1;
    const eligibility = applicationData?.eligibility || {};
    const ukResident = isUkResident(
      eligibility.residenceCountry,
      eligibility.residenceMode || 'home',
      eligibility.passportNationality || nationalityCode || ''
    );

    const appointmentFee = SCHENGEN_APPOINTMENT_BOOKING_FEE_GBP * Math.max(travelerCount, 1);
    const serviceFeeBreakdown = calculateTotalServiceFeeGbp({
      travelerCount,
      subscriptionDiscountPercent: subscriptionDiscount,
      subscriptionTier,
      baseServiceFeeGbp: SCHENGEN_SERVICE_FEE_GBP,
    });
    const serviceFeeBeforePromo = serviceFeeBreakdown.total;
    const serviceFee = applyPromoToServiceFeeGbp(serviceFeeBeforePromo, promo);
    const promoSavings = Number((serviceFeeBeforePromo - serviceFee).toFixed(2));
    const travelInsurancePerTraveler =
      addons.travelInsurance && ukResident
        ? calculateSchengenTravelInsuranceGbp(travelDays)
        : 0;
    const travelInsurance = travelInsurancePerTraveler * Math.max(travelerCount, 1);
    const total = Number((appointmentFee + serviceFee + travelInsurance).toFixed(2));

    return {
      visaFees: 0,
      serviceFee,
      serviceFeeBeforePromo,
      serviceFeeBreakdown,
      appointmentFee,
      travelInsurance,
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
    subscriptionTier,
    destinationCode,
  });
  const serviceFeeBeforePromo = serviceFeeBreakdown.total;
  const serviceFee = applyPromoToServiceFeeGbp(serviceFeeBeforePromo, promo);
  const promoSavings = Number((serviceFeeBeforePromo - serviceFee).toFixed(2));

  let expressFee = 0;
  const evisaAddons = applicationData?.evisaAddons || {};
  if (evisaAddons.expressProcessing && isEvisaDestinationCode(destinationCode)) {
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

export function normalizePromoCode(code) {
  return String(code || '').trim().toUpperCase();
}

export async function loadAndValidatePromo(supabase, code, userId) {
  const normalized = normalizePromoCode(code);
  if (!normalized) {
    return { ok: false, error: 'Enter a promo code.' };
  }

  const { data: row, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', normalized)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01') {
      return { ok: false, error: 'Promo codes are not available yet. Run database migrations.' };
    }
    throw error;
  }

  if (!row || !row.active) {
    return { ok: false, error: 'Invalid or inactive promo code.' };
  }

  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: 'This promo code has expired.' };
  }

  if (row.max_uses != null && row.used_count >= row.max_uses) {
    return { ok: false, error: 'This promo code has reached its usage limit.' };
  }

  const { data: prior } = await supabase
    .from('promo_redemptions')
    .select('id')
    .eq('promo_code_id', row.id)
    .eq('user_id', userId)
    .limit(1);

  if (prior?.length) {
    return { ok: false, error: 'You have already used this promo code.' };
  }

  return {
    ok: true,
    promo: {
      code: row.code,
      promoId: row.id,
      discountPercent: row.discount_percent,
      waiveAllFees: row.waive_all_fees,
      description: row.description,
    },
    row,
  };
}

export async function recordPromoRedemption(supabase, {
  promoId,
  userId,
  applicationId,
  amountSavedGbp,
}) {
  await supabase.from('promo_redemptions').insert({
    promo_code_id: promoId,
    user_id: userId,
    application_id: applicationId,
    amount_saved_gbp: amountSavedGbp,
  });

  const { data: current } = await supabase
    .from('promo_codes')
    .select('used_count')
    .eq('id', promoId)
    .maybeSingle();

  if (current) {
    await supabase
      .from('promo_codes')
      .update({ used_count: (current.used_count || 0) + 1 })
      .eq('id', promoId);
  }
}
