/**
 * Keyword-rich public URLs for eVisa product pages.
 * Canonical form: /visa/{country-name}-evisa (e.g. /visa/morocco-evisa).
 * ISO codes (/visa/ma) still resolve and should 301 to the slug.
 */

import { ALL_COUNTRIES } from '../utils/countries';

/** Explicit high-intent slugs (override auto-generated names). */
export const VISA_SLUG_BY_CODE: Record<string, string> = {
  ma: 'morocco-evisa',
  tr: 'turkey-evisa',
  my: 'malaysia-evisa',
  id: 'indonesia-evisa',
  eg: 'egypt-evisa',
  ae: 'uae-evisa',
  vn: 'vietnam-evisa',
  ke: 'kenya-evisa',
  lk: 'sri-lanka-eta',
  sa: 'saudi-arabia-evisa',
  gb: 'uk-visitor-visa',
  us: 'us-visitor-visa',
  ca: 'canada-visitor-visa',
  au: 'australia-visa',
  nz: 'new-zealand-visa',
  fr: 'france-schengen-visa',
  gr: 'greece-schengen-visa',
  it: 'italy-schengen-visa',
  es: 'spain-schengen-visa',
  de: 'germany-schengen-visa',
};

function slugifyCountryName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Public path for a destination product page. */
export function getVisaProductPath(countryCode: string): string {
  const code = countryCode.toLowerCase().trim();
  const explicit = VISA_SLUG_BY_CODE[code];
  if (explicit) return `/visa/${explicit}`;

  const country = ALL_COUNTRIES.find((c) => c.code.toLowerCase() === code);
  if (country?.name) {
    return `/visa/${slugifyCountryName(country.name)}-evisa`;
  }
  return `/visa/${code}`;
}

export function getVisaSlug(countryCode: string): string {
  return getVisaProductPath(countryCode).replace(/^\/visa\//, '');
}

/** Resolve /visa/:param → ISO country code (accepts slug or ISO code). */
export function resolveVisaCountryCode(param: string | undefined | null): string | null {
  if (!param) return null;
  const raw = param.toLowerCase().trim();
  if (!raw) return null;

  // Direct ISO code
  if (/^[a-z]{2}$/.test(raw) && ALL_COUNTRIES.some((c) => c.code.toLowerCase() === raw)) {
    return raw;
  }

  // Explicit slug map
  const fromMap = Object.entries(VISA_SLUG_BY_CODE).find(([, slug]) => slug === raw);
  if (fromMap) return fromMap[0];

  // Auto slug: "{country-name}-evisa" or "{country-name}-visa" / "-eta"
  const withoutSuffix = raw
    .replace(/-evisa$/, '')
    .replace(/-eta$/, '')
    .replace(/-visa$/, '')
    .replace(/-schengen-visa$/, '')
    .replace(/-visitor-visa$/, '');

  const byName = ALL_COUNTRIES.find(
    (c) => slugifyCountryName(c.name) === withoutSuffix || slugifyCountryName(c.name) === raw
  );
  if (byName) return byName.code.toLowerCase();

  // UAE aliases
  if (raw === 'dubai-evisa' || raw === 'united-arab-emirates-evisa') return 'ae';

  return null;
}

export function isCanonicalVisaSlug(param: string, countryCode: string): boolean {
  return getVisaSlug(countryCode) === param.toLowerCase().trim();
}
