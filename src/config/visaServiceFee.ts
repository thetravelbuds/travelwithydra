/** Visa application service fees (GBP). Subscription + additional-applicant discounts. */

import { getCachedEvisaFee } from '../services/evisaFeeStore';

export const BASE_SERVICE_FEE_GBP = 50;

/** Membership discount on the first applicant's service fee. */
export const SERVICE_FEE_DISCOUNT_PERCENT: Record<string, number> = {
  free: 0,
  none: 0,
  basic: 0,
  premium: 10,
  monthly: 10,
  enterprise: 20,
  business: 20,
  lifetime: 10,
};

/** Discount on service fee for each additional applicant (2nd traveller onward). */
export const ADDITIONAL_APPLICANT_SERVICE_FEE_DISCOUNT_PERCENT: Record<string, number> = {
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

export interface ServiceFeeBreakdown {
  baseFeeGbp: number;
  firstApplicantFee: number;
  additionalApplicantFee: number;
  additionalApplicantCount: number;
  additionalApplicantDiscountPercent: number;
  subscriptionDiscountPercent: number;
  undiscountedTotal: number;
  total: number;
}

export function getServiceFeeDiscountPercent(tier?: string | null): number {
  if (!tier) return 0;
  return SERVICE_FEE_DISCOUNT_PERCENT[tier.toLowerCase()] ?? 0;
}

export function getAdditionalApplicantServiceFeeDiscountPercent(tier?: string | null): number {
  if (!tier) return ADDITIONAL_APPLICANT_SERVICE_FEE_DISCOUNT_PERCENT.free;
  const key = tier.toLowerCase();
  if (key === 'enterprise' || key === 'business') return 50;
  if (key === 'premium' || key === 'monthly' || key === 'lifetime') return 30;
  return ADDITIONAL_APPLICANT_SERVICE_FEE_DISCOUNT_PERCENT[key] ?? 20;
}

export function getBaseServiceFeeGbp(destinationCode?: string | null): number {
  if (destinationCode) {
    const cached = getCachedEvisaFee(destinationCode.toLowerCase().trim());
    if (cached) return Number(cached.service_fee_gbp);
  }
  return BASE_SERVICE_FEE_GBP;
}

export function getDiscountedServiceFeeGbp(
  discountPercent: number,
  destinationCode?: string | null,
  baseServiceFeeGbp?: number
): number {
  const base = baseServiceFeeGbp ?? getBaseServiceFeeGbp(destinationCode);
  return Number((base * (1 - discountPercent / 100)).toFixed(2));
}

export function calculateTotalServiceFeeGbp(options: {
  travelerCount: number;
  subscriptionDiscountPercent: number;
  subscriptionTier?: string | null;
  destinationCode?: string | null;
  baseServiceFeeGbp?: number;
}): ServiceFeeBreakdown {
  const count = Math.max(options.travelerCount, 1);
  const base = options.baseServiceFeeGbp ?? getBaseServiceFeeGbp(options.destinationCode);
  const subscriptionDiscountPercent = options.subscriptionDiscountPercent ?? 0;
  const additionalApplicantDiscountPercent = getAdditionalApplicantServiceFeeDiscountPercent(
    options.subscriptionTier
  );

  const firstApplicantFee = getDiscountedServiceFeeGbp(
    subscriptionDiscountPercent,
    options.destinationCode,
    base
  );
  const additionalApplicantFee = Number(
    (base * (1 - additionalApplicantDiscountPercent / 100)).toFixed(2)
  );
  const additionalApplicantCount = Math.max(0, count - 1);
  const total = Number(
    (firstApplicantFee + additionalApplicantFee * additionalApplicantCount).toFixed(2)
  );
  const undiscountedTotal = Number((base * count).toFixed(2));

  return {
    baseFeeGbp: base,
    firstApplicantFee,
    additionalApplicantFee,
    additionalApplicantCount,
    additionalApplicantDiscountPercent,
    subscriptionDiscountPercent,
    undiscountedTotal,
    total,
  };
}

export function formatGbp(amount: number): string {
  return `£${amount.toFixed(2)}`;
}
