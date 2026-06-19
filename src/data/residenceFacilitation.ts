/** Extra destinations accessible with Pakistani passport + valid UK multiple-entry visa / UK residence */

export type FacilitationEntryType = 'visa-free' | 'visa-on-arrival' | 'evisa' | 'eta';

export interface ResidenceFacilitationEntry {
  countryCode: string;
  countryName: string;
  region: string;
  entryType: FacilitationEntryType;
  allowedStay: string;
  notes: string;
}

export const PAKISTAN_UK_FACILITATION: ResidenceFacilitationEntry[] = [
  { countryCode: 'AL', countryName: 'Albania', region: 'Europe', entryType: 'visa-free', allowedStay: '90 days', notes: 'Must hold a multiple-entry UK visa.' },
  { countryCode: 'BA', countryName: 'Bosnia and Herzegovina', region: 'Europe', entryType: 'visa-free', allowedStay: '30 days', notes: 'Must have used the UK visa to enter the UK first.' },
  { countryCode: 'GE', countryName: 'Georgia', region: 'Europe', entryType: 'visa-free', allowedStay: '90 days', notes: 'UK visa must be active and valid on arrival.' },
  { countryCode: 'ME', countryName: 'Montenegro', region: 'Europe', entryType: 'visa-free', allowedStay: '30 days', notes: 'Valid for multiple-entry UK visa holders.' },
  { countryCode: 'MK', countryName: 'North Macedonia', region: 'Europe', entryType: 'visa-free', allowedStay: '15 days', notes: 'UK visa must be valid at least 5 days beyond stay.' },
  { countryCode: 'RS', countryName: 'Serbia', region: 'Europe', entryType: 'visa-free', allowedStay: '90 days', notes: 'Must hold a valid multiple-entry UK visa.' },
  { countryCode: 'SA', countryName: 'Saudi Arabia', region: 'Middle East', entryType: 'visa-on-arrival', allowedStay: '90 days', notes: 'UK visa must be used at least once; fly a national carrier.' },
  { countryCode: 'TR', countryName: 'Turkey', region: 'Middle East', entryType: 'evisa', allowedStay: '30 days', notes: 'Instant online e-Visa (bypasses standard sticker visa).' },
  { countryCode: 'QA', countryName: 'Qatar', region: 'Middle East', entryType: 'visa-on-arrival', allowedStay: '30 days', notes: 'Simplified entry via Hayya platform / on arrival.' },
  { countryCode: 'OM', countryName: 'Oman', region: 'Middle East', entryType: 'evisa', allowedStay: '30 days', notes: 'Conditional e-Visa based on valid UK visa.' },
  { countryCode: 'AE', countryName: 'United Arab Emirates', region: 'Middle East', entryType: 'evisa', allowedStay: '30 days', notes: 'Pre-arrival e-Visa using UK visa credentials.' },
  { countryCode: 'BH', countryName: 'Bahrain', region: 'Middle East', entryType: 'evisa', allowedStay: '14 days', notes: 'Apply online without a local sponsor.' },
  { countryCode: 'MX', countryName: 'Mexico', region: 'Americas', entryType: 'visa-free', allowedStay: '180 days', notes: 'Tourism and business stays.' },
  { countryCode: 'PA', countryName: 'Panama', region: 'Americas', entryType: 'visa-free', allowedStay: '30 days', notes: 'UK visa needs at least 6 months validity remaining.' },
  { countryCode: 'CR', countryName: 'Costa Rica', region: 'Americas', entryType: 'visa-free', allowedStay: '30 days', notes: 'UK visa must be valid for at least 6 months.' },
  { countryCode: 'DO', countryName: 'Dominican Republic', region: 'Caribbean', entryType: 'visa-free', allowedStay: '30–60 days', notes: 'Entry without separate tourist visa.' },
  { countryCode: 'BS', countryName: 'Bahamas', region: 'Caribbean', entryType: 'visa-free', allowedStay: '90 days', notes: 'Valid for tourism purposes.' },
  { countryCode: 'AG', countryName: 'Antigua and Barbuda', region: 'Caribbean', entryType: 'visa-on-arrival', allowedStay: '30 days', notes: 'Visa on arrival available.' },
  { countryCode: 'AW', countryName: 'Aruba', region: 'Caribbean', entryType: 'visa-free', allowedStay: '30 days', notes: 'Dutch Caribbean territory.' },
  { countryCode: 'CW', countryName: 'Curaçao', region: 'Caribbean', entryType: 'visa-free', allowedStay: '30 days', notes: 'Dutch Caribbean territory.' },
  { countryCode: 'SX', countryName: 'Sint Maarten', region: 'Caribbean', entryType: 'visa-free', allowedStay: '30 days', notes: 'Dutch Caribbean territory.' },
  { countryCode: 'BM', countryName: 'Bermuda', region: 'Caribbean', entryType: 'visa-free', allowedStay: '90 days', notes: 'British Overseas Territory rules apply.' },
  { countryCode: 'EG', countryName: 'Egypt', region: 'Africa', entryType: 'visa-on-arrival', allowedStay: '30 days', notes: 'Bypasses embassy processing when eligible.' },
  { countryCode: 'MA', countryName: 'Morocco', region: 'Africa', entryType: 'evisa', allowedStay: '30 days', notes: 'Streamlined online process.' },
  { countryCode: 'PH', countryName: 'Philippines', region: 'Asia', entryType: 'visa-free', allowedStay: '14 days', notes: 'Passport valid 6 months beyond stay.' },
  { countryCode: 'SG', countryName: 'Singapore', region: 'Asia', entryType: 'visa-free', allowedStay: '96 hours', notes: 'Visa-Free Transit Facility (VFTF) — transit only.' },
];

export function isPakistanUkFacilitationProfile(nationalityCode: string, residenceCode: string): boolean {
  const nat = nationalityCode.trim().toLowerCase();
  const res = residenceCode.trim().toLowerCase();
  return (nat === 'pk' || nat === 'pakistan') && (res === 'gb' || res === 'uk' || res === 'united kingdom');
}
