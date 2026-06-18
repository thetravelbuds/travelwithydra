import { useCallback, useEffect, useState } from 'react';
import siteSettingsService, { SITE_SETTINGS_CHANGED_EVENT } from '../lib/api/siteSettings';
import { DEFAULT_SITE_SETTINGS, SiteSettings } from '../types/siteSettings';

export function useSiteSettings(): {
  settings: SiteSettings;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { settings: next } = await siteSettingsService.getSettings();
    setSettings(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();

    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<SiteSettings>).detail;
      if (detail) {
        setSettings(detail);
      } else {
        void refresh();
      }
    };

    window.addEventListener(SITE_SETTINGS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(SITE_SETTINGS_CHANGED_EVENT, onChanged);
  }, [refresh]);

  return { settings, loading, refresh };
}

export default useSiteSettings;
