import React, { useMemo, useState } from 'react';
import { ALL_COUNTRIES } from '../../utils/countries';
import siteSettingsService from '../../lib/api/siteSettings';
import { NationalityApplicationMode } from '../../types/siteSettings';

interface AdminCountryAccessProps {
  onSaved?: () => void;
}

const AdminCountryAccess: React.FC<AdminCountryAccessProps> = ({ onSaved }) => {
  const [mode, setMode] = useState<NationalityApplicationMode>('all');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { settings } = await siteSettingsService.getSettings();
      setMode(settings.nationalityApplicationMode);
      setSelectedCodes(settings.nationalityCodes.map((code) => code.toLowerCase()));
      setLoading(false);
    };
    void load();
  }, []);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query)
    );
  }, [search]);

  const toggleCountry = (code: string) => {
    const normalized = code.toLowerCase();
    setSelectedCodes((prev) =>
      prev.includes(normalized)
        ? prev.filter((item) => item !== normalized)
        : [...prev, normalized]
    );
  };

  const selectAllVisible = () => {
    const visibleCodes = filteredCountries.map((country) => country.code.toLowerCase());
    setSelectedCodes((prev) => Array.from(new Set([...prev, ...visibleCodes])));
  };

  const clearSelection = () => setSelectedCodes([]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    const { error: saveError } = await siteSettingsService.updateSettings({
      nationalityApplicationMode: mode,
      nationalityCodes: selectedCodes,
    });

    setSaving(false);
    if (saveError) {
      setError('Failed to save nationality access rules.');
      return;
    }

    setMessage('Nationality access rules saved.');
    onSaved?.();
  };

  if (loading) {
    return <p className="text-gray-500">Loading country access settings...</p>;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded border border-green-300 bg-green-50 px-4 py-3 text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      )}

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-2 text-xl font-semibold">Nationality application access</h2>
        <p className="mb-4 text-sm text-gray-600">
          Control which passport nationalities can start visa applications on destination product pages.
          Blocked users can still use dashboard, travel score, and subscription features.
        </p>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <label className={`cursor-pointer rounded-lg border p-4 ${mode === 'all' ? 'border-teal-600 bg-teal-50' : 'border-gray-200'}`}>
            <input
              type="radio"
              name="nationality-mode"
              className="mr-2"
              checked={mode === 'all'}
              onChange={() => setMode('all')}
            />
            <span className="font-medium">Allow all nationalities</span>
            <p className="mt-1 text-xs text-gray-500">Everyone can apply unless individually blocked below.</p>
          </label>

          <label className={`cursor-pointer rounded-lg border p-4 ${mode === 'blocklist' ? 'border-teal-600 bg-teal-50' : 'border-gray-200'}`}>
            <input
              type="radio"
              name="nationality-mode"
              className="mr-2"
              checked={mode === 'blocklist'}
              onChange={() => setMode('blocklist')}
            />
            <span className="font-medium">Block selected nationalities</span>
            <p className="mt-1 text-xs text-gray-500">Selected countries cannot start applications.</p>
          </label>

          <label className={`cursor-pointer rounded-lg border p-4 ${mode === 'allowlist' ? 'border-teal-600 bg-teal-50' : 'border-gray-200'}`}>
            <input
              type="radio"
              name="nationality-mode"
              className="mr-2"
              checked={mode === 'allowlist'}
              onChange={() => setMode('allowlist')}
            />
            <span className="font-medium">Allow only selected nationalities</span>
            <p className="mt-1 text-xs text-gray-500">Only selected countries can apply; all others are blocked.</p>
          </label>
        </div>

        {mode !== 'all' && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search countries..."
                className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 md:flex-1"
              />
              <button
                type="button"
                onClick={selectAllVisible}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
              >
                Select visible
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
              >
                Clear all
              </button>
              <span className="text-sm text-gray-500">{selectedCodes.length} selected</span>
            </div>

            <div className="max-h-[420px] overflow-y-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Country
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Code
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      {mode === 'allowlist' ? 'Allowed' : 'Blocked'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredCountries.map((country) => {
                    const checked = selectedCodes.includes(country.code.toLowerCase());
                    return (
                      <tr key={country.code} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{country.name}</td>
                        <td className="px-4 py-3 text-sm uppercase text-gray-500">{country.code}</td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCountry(country.code)}
                            className="h-4 w-4 text-teal-600"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save nationality rules'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCountryAccess;
