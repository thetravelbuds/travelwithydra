export const PASSPORT_VALIDITY_MONTHS = 6;

export const PASSPORT_APPLICATION_BLOCK_MESSAGE =
  'Your passport must be valid for at least 6 months from today to submit this application. Please renew your passport before continuing.';

export const PASSPORT_TRAVEL_BLOCK_MESSAGE =
  'Your passport must be valid for at least 6 months on the date your trip begins. Please renew your passport or adjust your travel dates.';

function parseDateOnly(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function isPassportValidForApplication(expiryDate: string): boolean {
  const expiry = parseDateOnly(expiryDate);
  if (!expiry) return false;
  const minimum = addMonths(startOfToday(), PASSPORT_VALIDITY_MONTHS);
  return expiry >= minimum;
}

export function isPassportValidForTravel(expiryDate: string, travelStartDate: string): boolean {
  const expiry = parseDateOnly(expiryDate);
  const travelStart = parseDateOnly(travelStartDate);
  if (!expiry || !travelStart) return false;
  const minimum = addMonths(travelStart, PASSPORT_VALIDITY_MONTHS);
  return expiry >= minimum;
}

export function getPassportValidityMessages(
  expiryDate: string | null | undefined,
  travelStartDate?: string | null
): { applicationError: string | null; travelError: string | null } {
  if (!expiryDate) {
    return { applicationError: null, travelError: null };
  }

  const applicationError = isPassportValidForApplication(expiryDate)
    ? null
    : PASSPORT_APPLICATION_BLOCK_MESSAGE;

  const travelError =
    travelStartDate && !isPassportValidForTravel(expiryDate, travelStartDate)
      ? PASSPORT_TRAVEL_BLOCK_MESSAGE
      : null;

  return { applicationError, travelError };
}
