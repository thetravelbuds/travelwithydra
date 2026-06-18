import React, { useEffect, useMemo, useState } from 'react';
import adminMembersService, { AdminMember, MemberFilters } from '../../lib/api/adminMembers';
import { ALL_COUNTRIES } from '../../utils/countries';

const AdminMembers: React.FC = () => {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MemberFilters>({
    subscription_tier: 'all',
    nationality: '',
    residency: '',
    search: '',
  });

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    const { members: rows, error: loadError } = await adminMembersService.listMembers({
      nationality: filters.nationality || undefined,
      residency: filters.residency || undefined,
      subscription_tier: filters.subscription_tier === 'all' ? undefined : filters.subscription_tier,
    });

    if (loadError) {
      setError(loadError.message);
      setMembers([]);
    } else {
      setMembers(rows);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadMembers();
  }, [filters.nationality, filters.residency, filters.subscription_tier]);

  const filteredMembers = useMemo(() => {
    const search = filters.search?.trim().toLowerCase();
    if (!search) return members;
    return members.filter(
      (member) =>
        member.email?.toLowerCase().includes(search) ||
        member.full_name?.toLowerCase().includes(search)
    );
  }, [members, filters.search]);

  const tierBadge = (tier: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-gray-800 text-white',
      enterprise: 'bg-purple-100 text-purple-800',
      premium: 'bg-blue-100 text-blue-800',
      free: 'bg-gray-100 text-gray-700',
    };
    return styles[tier] || styles.free;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Members</h2>
            <p className="text-sm text-gray-600">
              Every user who signs up or receives a membership appears here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadMembers()}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
          >
            Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <input
            type="search"
            placeholder="Search name or email..."
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={filters.subscription_tier}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, subscription_tier: event.target.value }))
            }
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All tiers</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={filters.nationality}
            onChange={(event) => setFilters((prev) => ({ ...prev, nationality: event.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All nationalities</option>
            {ALL_COUNTRIES.map((country) => (
              <option key={country.code} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
          <select
            value={filters.residency}
            onChange={(event) => setFilters((prev) => ({ ...prev, residency: event.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All residences</option>
            {ALL_COUNTRIES.map((country) => (
              <option key={`res-${country.code}`} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading members...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nationality</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Residence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{member.full_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{member.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${tierBadge(member.subscription_tier)}`}>
                        {member.subscription_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{member.nationality || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{member.residency || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMembers.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">No members match your filters.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMembers;
