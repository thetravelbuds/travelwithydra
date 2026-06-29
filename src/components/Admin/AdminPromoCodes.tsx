import React, { useState, useEffect } from 'react';
import promoCodesService from '../../lib/api/promoCodes';
import type { PromoCodeRecord } from '../../config/promoCodes';
import { formatGbp } from '../../config/visaServiceFee';

const AdminPromoCodes: React.FC = () => {
  const [codes, setCodes] = useState<PromoCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState(15);
  const [waiveAllFees, setWaiveAllFees] = useState(false);
  const [maxUses, setMaxUses] = useState<string>('');

  const loadCodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { codes: rows } = await promoCodesService.listCodes();
      setCodes(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCodes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await promoCodesService.createCode({
        code,
        description: description || undefined,
        discountPercent: waiveAllFees ? 100 : discountPercent,
        waiveAllFees,
        maxUses: maxUses ? Number(maxUses) : null,
      });
      setMessage(`Created code ${code.trim().toUpperCase()}`);
      setCode('');
      setDescription('');
      setDiscountPercent(15);
      setWaiveAllFees(false);
      setMaxUses('');
      await loadCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create code');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: PromoCodeRecord) => {
    try {
      await promoCodesService.updateCode(row.id, { active: !row.active });
      await loadCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update code');
    }
  };

  const removeCode = async (id: string) => {
    if (!window.confirm('Delete this promo code?')) return;
    try {
      await promoCodesService.deleteCode(id);
      await loadCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete code');
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-2 text-xl font-semibold">Discount codes</h2>
      <p className="mb-6 text-sm text-gray-600">
        Create codes users can paste at visa checkout. Discounts apply to the platform service fee only,
        unless you enable &quot;Waive all fees&quot; for internal testing (entire checkout becomes £0).
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

      <form onSubmit={handleCreate} className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-4 font-medium text-gray-900">New promo code</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SAVE15"
              className="w-full rounded-md border border-gray-300 px-3 py-2 uppercase"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="15% off service fee"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Service fee discount (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              disabled={waiveAllFees}
              className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Max uses (optional)</label>
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={waiveAllFees}
            onChange={(e) => setWaiveAllFees(e.target.checked)}
            className="rounded border-gray-300"
          />
          Waive all fees (£0 checkout — for testing the application flow)
        </label>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {saving ? 'Creating…' : 'Create code'}
        </button>
      </form>

      <h3 className="mb-3 font-medium text-gray-900">Active codes</h3>
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : codes.length === 0 ? (
        <p className="text-sm text-gray-500">No promo codes yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-600">
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Discount</th>
                <th className="py-2 pr-4">Uses</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-mono font-semibold">{row.code}</td>
                  <td className="py-3 pr-4">
                    {row.waive_all_fees
                      ? 'All fees waived (test)'
                      : `${row.discount_percent}% off service fee`}
                  </td>
                  <td className="py-3 pr-4">
                    {row.used_count}
                    {row.max_uses != null ? ` / ${row.max_uses}` : ''}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {row.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 space-x-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(row)}
                      className="text-teal-600 hover:underline"
                    >
                      {row.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCode(row.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPromoCodes;
