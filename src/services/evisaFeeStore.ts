/** Runtime cache of admin-managed eVisa country fees (loaded from API). */

export interface EvisaCountryFeeRow {
  country_code: string;
  country_name: string;
  visa_fee_gbp: number;
  service_fee_gbp: number;
  updated_at?: string;
}

let feeByCode = new Map<string, EvisaCountryFeeRow>();
let loadPromise: Promise<void> | null = null;
let loadedAt = 0;

const CACHE_TTL_MS = 5 * 60 * 1000;

export function getCachedEvisaFee(countryCode: string): EvisaCountryFeeRow | null {
  const code = countryCode.toLowerCase().trim();
  return feeByCode.get(code) ?? null;
}

export function setEvisaFeeCache(rows: EvisaCountryFeeRow[]): void {
  feeByCode = new Map(rows.map((row) => [row.country_code.toLowerCase(), row]));
  loadedAt = Date.now();
}

export function clearEvisaFeeCache(): void {
  feeByCode = new Map();
  loadedAt = 0;
  loadPromise = null;
}

export async function ensureEvisaFeesLoaded(force = false): Promise<void> {
  if (!force && feeByCode.size > 0 && Date.now() - loadedAt < CACHE_TTL_MS) {
    return;
  }

  if (!force && loadPromise) {
    await loadPromise;
    return;
  }

  loadPromise = (async () => {
    try {
      const response = await fetch('/.netlify/functions/evisa-fees');
      if (!response.ok) return;
      const data = (await response.json()) as { fees?: EvisaCountryFeeRow[] };
      if (Array.isArray(data.fees)) {
        setEvisaFeeCache(data.fees);
      }
    } catch {
      // Keep static fallbacks when API is unavailable.
    } finally {
      loadPromise = null;
    }
  })();

  await loadPromise;
}
