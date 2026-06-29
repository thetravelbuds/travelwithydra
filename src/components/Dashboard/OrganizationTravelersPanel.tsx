import React, { useEffect, useState } from 'react';
import organizationService, {
  type Organization,
  type OrganizationTraveler,
} from '../../lib/api/organizationService';
import { ALL_COUNTRIES } from '../../utils/countries';
import { getOrganizationTravelerLimit } from '../../config/subscriptionFeatures';

interface OrganizationTravelersPanelProps {
  subscriptionTier?: string | null;
}

const OrganizationTravelersPanel: React.FC<OrganizationTravelersPanelProps> = ({
  subscriptionTier,
}) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [travelers, setTravelers] = useState<OrganizationTraveler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [nationalityCode, setNationalityCode] = useState('');
  const [notes, setNotes] = useState('');

  const limit = getOrganizationTravelerLimit(subscriptionTier);

  const load = async () => {
    setLoading(true);
    setError('');
    const { organization: org, error: orgError } =
      await organizationService.getOrCreateOrganization();
    if (orgError) {
      setError(orgError.message);
      setLoading(false);
      return;
    }
    setOrganization(org);
    if (org) {
      const { travelers: list, error: listError } = await organizationService.listTravelers(org.id);
      if (listError) setError(listError.message);
      setTravelers(list);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleAdd = async () => {
    if (!organization || !fullName.trim()) return;
    setError('');
    const { error: addError } = await organizationService.addTraveler(organization.id, {
      fullName,
      email,
      nationalityCode,
      notes,
    });
    if (addError) {
      setError(addError.message);
      return;
    }
    setFullName('');
    setEmail('');
    setNationalityCode('');
    setNotes('');
    void load();
  };

  const handleDelete = async (id: string) => {
    await organizationService.deleteTraveler(id);
    void load();
  };

  if (loading) {
    return <p className="text-sm text-gray-500 p-6">Loading traveler roster...</p>;
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Traveler Roster</h3>
        <p className="text-sm text-gray-500 mt-1">
          Manage travelers for your travel business. Store profiles and link documents for repeat
          applications.
        </p>
        {organization && (
          <p className="text-sm text-gray-600 mt-2">
            Organization: <span className="font-medium">{organization.name}</span> ·{' '}
            {travelers.length} / {limit} travelers
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Add traveler</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="input"
            placeholder="Full name *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="input"
            value={nationalityCode}
            onChange={(e) => setNationalityCode(e.target.value)}
          >
            <option value="">Nationality</option>
            {ALL_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn-primary mt-3"
          onClick={() => void handleAdd()}
          disabled={!fullName.trim() || travelers.length >= limit}
        >
          Add traveler
        </button>
      </div>

      {travelers.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No travelers yet. Add your first client or employee above.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Nationality</th>
                <th className="py-2 pr-4">Notes</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {travelers.map((t) => (
                <tr key={t.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">{t.full_name}</td>
                  <td className="py-3 pr-4 text-gray-600">{t.email || '—'}</td>
                  <td className="py-3 pr-4 text-gray-600">
                    {t.nationality_code?.toUpperCase() || '—'}
                  </td>
                  <td className="py-3 pr-4 text-gray-600 max-w-xs truncate">{t.notes || '—'}</td>
                  <td className="py-3">
                    <button
                      type="button"
                      className="text-red-600 hover:underline text-xs"
                      onClick={() => void handleDelete(t.id)}
                    >
                      Remove
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

export default OrganizationTravelersPanel;
