/** Promo code types and discount helpers for visa checkout. */

export type PromoAppliesTo = 'service_fee' | 'all';

export interface PromoCodeRecord {
  id: string;
  code: string;
  description?: string | null;
  discount_percent: number;
  waive_all_fees: boolean;
  max_uses?: number | null;
  used_count: number;
  active: boolean;
  expires_at?: string | null;
  created_at?: string;
}

export interface PromoDiscount {
  code: string;
  promoId: string;
  discountPercent: number;
  waiveAllFees: boolean;
  description?: string | null;
}

export function normalizePromoCodeInput(code: string): string {
  return code.trim().toUpperCase();
}

/** Additional % off the service-fee line (after membership discount). */
export function applyPromoToServiceFeeGbp(
  serviceFeeGbp: number,
  promo: Pick<PromoDiscount, 'discountPercent' | 'waiveAllFees'> | null | undefined
): number {
  if (!promo) return serviceFeeGbp;
  if (promo.waiveAllFees) return 0;
  if (promo.discountPercent <= 0) return serviceFeeGbp;
  return Number((serviceFeeGbp * (1 - promo.discountPercent / 100)).toFixed(2));
}

export function isPromoExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export function isPromoExhausted(usedCount: number, maxUses?: number | null): boolean {
  if (maxUses == null) return false;
  return usedCount >= maxUses;
}
