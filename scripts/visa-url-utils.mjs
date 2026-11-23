/**
 * Shared build-time visa URL helpers (mirrors src/config/visaSlugs.ts).
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

export const SITE_URL = 'https://travelwithydra.com';

export const VISA_SLUG_BY_CODE = {
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
  nl: 'netherlands-schengen-visa',
  pt: 'portugal-schengen-visa',
  at: 'austria-schengen-visa',
  be: 'belgium-schengen-visa',
  ch: 'switzerland-schengen-visa',
  ie: 'ireland-visa',
  in: 'india-visa',
  pk: 'pakistan-evisa',
  th: 'thailand-visa',
  sg: 'singapore-visa',
  jp: 'japan-visa',
  kr: 'south-korea-visa',
  br: 'brazil-visa',
  mx: 'mexico-visa',
  za: 'south-africa-visa',
  ng: 'nigeria-visa',
  gh: 'ghana-visa',
  tz: 'tanzania-evisa',
  ug: 'uganda-evisa',
  rw: 'rwanda-evisa',
  et: 'ethiopia-evisa',
  jo: 'jordan-evisa',
  kh: 'cambodia-evisa',
};

export function slugifyCountryName(name) {
  return String(name)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function loadCountries() {
  const source = readFileSync(join(root, 'src/utils/countries.ts'), 'utf8');
  return [...source.matchAll(/\{\s*code:\s*'([a-z]{2})',\s*name:\s*'([^']+)'\s*\}/g)].map(
    (m) => ({ code: m[1], name: m[2] })
  );
}

export function getVisaSlug(code, name) {
  const explicit = VISA_SLUG_BY_CODE[code];
  if (explicit) return explicit;
  return `${slugifyCountryName(name)}-evisa`;
}

export function getVisaProductPath(code, name) {
  return `/visa/${getVisaSlug(code, name)}`;
}

/** Routes that must never be treated as country codes. */
export const RESERVED_VISA_SEGMENTS = new Set([
  'browse',
  'apply',
  'confirmation',
  'payment',
]);
