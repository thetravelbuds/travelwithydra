import React, { useEffect, useMemo, useState } from 'react';
import evisaFeesService from '../../lib/api/evisaFees';
import { clearEvisaFeeCache, setEvisaFeeCache, type EvisaCountryFeeRow } from '../../services/evisaFeeStore';
import { formatGbp } from '../../config/visaServiceFee';

const AdminEvisaFees: React.FC = () => {
  const [fees, setFees] = useState<EvisaCountryFeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadFees = async () => {
    setLoading(true);
    setError(null);
    try {
      const { fees: rows } = await evisaFeesService.listFees();
      setFees(rows);
      setEvisaFeeCache(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load eVisa fees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFees();
  }, []);

  const filteredFees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return fees;
    return fees.filter(
      (row) =>
        row.country_name.toLowerCase().includes(query) ||
        row.country_code.toLowerCase().includes(query)
    );
  }, [fees, search]);

  const updateRow = (countryCode: string, field: 'visa_fee_gbp' | 'service_fee_gbp', value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return;
    setFees((prev) =>
      prev.map((row) =>
        row.country_code === countryCode ? { ...row, [field]: parsed } : row
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const { fees: saved } = await evisaFeesService.saveFees(fees);
      setFees(saved);
      setEvisaFeeCache(saved);
      clearEvisaFeeCache();
      setEvisaFeeCache(saved);
      setMessage('eVisa fees saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save fees');
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('Load default fee table into the database? Existing rows will be updated.')) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { fees: seeded } = await evisaFeesService.seedFees();
      setFees(seeded);
      setEvisaFeeCache(seeded);
      setMessage('Default eVisa fee table loaded.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed fees');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">eVisa country fees</h2>
          <p className="mt-1 text-sm text-gray-600">
            Set the government visa fee and Hydra service fee for each supported eVisa destination.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleSeed()}
            disabled={saving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Load defaults
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || loading}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save all changes'}
          </button>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search country…"
        className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2"
      />

      {loading ? (
        <p className="text-gray-600">Loading fees…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Country</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Visa fee (GBP)</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Service fee (GBP)</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFees.map((row) => (
                <tr key={row.country_code}>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.country_name}</td>
                  <td className="px-4 py-3 uppercase text-gray-500">{row.country_code}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.visa_fee_gbp}
                      onChange={(e) => updateRow(row.country_code, 'visa_fee_gbp', e.target.value)}
                      className="w-28 rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.service_fee_gbp}
                      onChange={(e) => updateRow(row.country_code, 'service_fee_gbp', e.target.value)}
                      className="w-28 rounded border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatGbp(Number(row.visa_fee_gbp) + Number(row.service_fee_gbp))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Run the Supabase migration for <code>evisa_country_fees</code> if the table does not exist yet.
        Click “Load defaults” once to populate the database from the built-in fee schedule.
      </p>
    </div>
  );
};

export default AdminEvisaFees;
