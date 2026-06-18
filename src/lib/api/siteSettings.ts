import supabase from '../supabase/client';
import {
  AdminBlogRecord,
  DEFAULT_SITE_SETTINGS,
  NationalityApplicationMode,
  SiteSettings,
} from '../../types/siteSettings';

const STORAGE_KEY = 'travelwithydra_site_settings';
export const SITE_SETTINGS_CHANGED_EVENT = 'travelwithydra:site-settings-changed';

type SiteSettingsRow = {
  logo_url: string | null;
  nationality_application_mode: NationalityApplicationMode;
  nationality_codes: string[] | null;
  custom_blogs: AdminBlogRecord[] | null;
  hidden_blog_ids: string[] | null;
};

function readLocalSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SITE_SETTINGS };
    return { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SITE_SETTINGS };
  }
}

function writeLocalSettings(settings: SiteSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function mapRow(row: SiteSettingsRow): SiteSettings {
  return {
    logoUrl: row.logo_url ?? null,
    nationalityApplicationMode: row.nationality_application_mode ?? 'all',
    nationalityCodes: Array.isArray(row.nationality_codes) ? row.nationality_codes : [],
    customBlogs: Array.isArray(row.custom_blogs) ? row.custom_blogs : [],
    hiddenBlogIds: Array.isArray(row.hidden_blog_ids) ? row.hidden_blog_ids : [],
  };
}

function mapToRow(settings: SiteSettings): SiteSettingsRow {
  return {
    logo_url: settings.logoUrl,
    nationality_application_mode: settings.nationalityApplicationMode,
    nationality_codes: settings.nationalityCodes,
    custom_blogs: settings.customBlogs,
    hidden_blog_ids: settings.hiddenBlogIds,
  };
}

function notifyChange(settings: SiteSettings): void {
  window.dispatchEvent(
    new CustomEvent(SITE_SETTINGS_CHANGED_EVENT, { detail: settings })
  );
}

function isMissingTableError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = (error.message ?? '').toLowerCase();
  return (
    error.code === '42P01' ||
    message.includes('site_settings') ||
    message.includes('does not exist')
  );
}

export const siteSettingsService = {
  async getSettings(): Promise<{ settings: SiteSettings; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (error) {
        if (isMissingTableError(error)) {
          return { settings: readLocalSettings(), error: null };
        }
        return { settings: readLocalSettings(), error: error as Error };
      }

      if (!data) {
        return { settings: readLocalSettings(), error: null };
      }

      const settings = mapRow(data as SiteSettingsRow);
      writeLocalSettings(settings);
      return { settings, error: null };
    } catch (error) {
      return { settings: readLocalSettings(), error: error as Error };
    }
  },

  async updateSettings(
    partial: Partial<SiteSettings>
  ): Promise<{ settings: SiteSettings | null; error: Error | null }> {
    const current = readLocalSettings();
    const next: SiteSettings = { ...current, ...partial };

    try {
      const row = mapToRow(next);
      const { data, error } = await supabase
        .from('site_settings')
        .upsert({ id: 'global', ...row, updated_at: new Date().toISOString() })
        .select('*')
        .single();

      if (error) {
        if (isMissingTableError(error)) {
          writeLocalSettings(next);
          notifyChange(next);
          return { settings: next, error: null };
        }
        return { settings: null, error: error as Error };
      }

      const settings = mapRow(data as SiteSettingsRow);
      writeLocalSettings(settings);
      notifyChange(settings);
      return { settings, error: null };
    } catch (error) {
      writeLocalSettings(next);
      notifyChange(next);
      return { settings: next, error: error as Error };
    }
  },
};

export default siteSettingsService;
