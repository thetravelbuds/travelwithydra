import React, { useEffect, useState } from 'react';
import siteSettingsService from '../../lib/api/siteSettings';

interface AdminSiteSettingsProps {
  onSaved?: () => void;
}

const AdminSiteSettings: React.FC<AdminSiteSettingsProps> = ({ onSaved }) => {
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { settings } = await siteSettingsService.getSettings();
      setLogoUrl(settings.logoUrl ?? '');
      setLoading(false);
    };
    void load();
  }, []);

  const saveLogo = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    const trimmed = logoUrl.trim();
    const { error: saveError } = await siteSettingsService.updateSettings({
      logoUrl: trimmed || null,
    });

    setSaving(false);
    if (saveError) {
      setError('Failed to save logo settings.');
      return;
    }

    setMessage(trimmed ? 'Logo updated across the site.' : 'Logo reset to default travelwithydra text.');
    onSaved?.();
  };

  if (loading) {
    return <p className="text-gray-500">Loading site settings...</p>;
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-2 text-xl font-semibold">Website logo</h2>
      <p className="mb-4 text-sm text-gray-600">
        Paste an image URL for your site logo. Leave empty to use the default travelwithydra wordmark.
      </p>

      {message && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 px-4 py-3 text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">Logo image URL</label>
        <input
          type="url"
          value={logoUrl}
          onChange={(event) => setLogoUrl(event.target.value)}
          placeholder="https://example.com/logo.png"
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="mb-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
        <p className="mb-2 text-sm text-gray-600">Preview</p>
        {logoUrl.trim() ? (
          <img src={logoUrl.trim()} alt="Site logo preview" className="h-12 max-w-xs object-contain" />
        ) : (
          <span className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-10 w-10" aria-hidden="true" />
            <span className="text-2xl font-bold text-gray-900">
              travel<span className="text-primary-600">withydra</span>
            </span>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={saveLogo}
        disabled={saving}
        className="rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save logo'}
      </button>
    </div>
  );
};

export default AdminSiteSettings;
