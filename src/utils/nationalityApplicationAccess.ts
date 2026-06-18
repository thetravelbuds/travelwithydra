import {
  DEFAULT_SITE_SETTINGS,
  NATIONALITY_UNAVAILABLE_MESSAGE,
  SiteSettings,
} from '../types/siteSettings';

export function normalizeCountryCode(code: string | undefined | null): string {
  return (code ?? '').trim().toLowerCase();
}

export function canNationalityApplyForVisa(
  nationalityCode: string | undefined | null,
  settings: SiteSettings = DEFAULT_SITE_SETTINGS
): boolean {
  const code = normalizeCountryCode(nationalityCode);
  if (!code) return true;

  const list = settings.nationalityCodes.map(normalizeCountryCode);

  if (settings.nationalityApplicationMode === 'all') {
    return true;
  }

  if (settings.nationalityApplicationMode === 'allowlist') {
    return list.includes(code);
  }

  return !list.includes(code);
}

export function getNationalityUnavailableMessage(): string {
  return NATIONALITY_UNAVAILABLE_MESSAGE;
}
