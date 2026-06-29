export const VISA_PROMO_CODE_STORAGE_KEY = 'visa_application_promo_code';

export function saveCheckoutPromoCode(code: string): void {
  const trimmed = code.trim().toUpperCase();
  if (trimmed) {
    sessionStorage.setItem(VISA_PROMO_CODE_STORAGE_KEY, trimmed);
  } else {
    sessionStorage.removeItem(VISA_PROMO_CODE_STORAGE_KEY);
  }
}

export function readCheckoutPromoCode(): string {
  return sessionStorage.getItem(VISA_PROMO_CODE_STORAGE_KEY)?.trim().toUpperCase() ?? '';
}

export function clearCheckoutPromoCode(): void {
  sessionStorage.removeItem(VISA_PROMO_CODE_STORAGE_KEY);
}
