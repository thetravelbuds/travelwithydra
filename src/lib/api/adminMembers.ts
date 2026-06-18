import authService from './auth';

async function getAccessToken(): Promise<string | null> {
  const { session } = await authService.getSession();
  return session?.access_token ?? null;
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

export interface AdminMember {
  id: string;
  email: string;
  full_name: string | null;
  nationality: string | null;
  residency: string | null;
  subscription_tier: string;
  created_at: string;
  questionnaire_completed: boolean;
}

export interface MemberFilters {
  nationality?: string;
  residency?: string;
  subscription_tier?: string;
  search?: string;
}

export const adminMembersService = {
  async listMembers(filters: MemberFilters = {}): Promise<{ members: AdminMember[]; error: Error | null }> {
    try {
      const params = new URLSearchParams({ action: 'list_members' });
      if (filters.nationality) params.set('nationality', filters.nationality);
      if (filters.residency) params.set('residency', filters.residency);
      if (filters.subscription_tier) params.set('subscription_tier', filters.subscription_tier);
      if (filters.search) params.set('search', filters.search);

      const data = await adminFetch(`/.netlify/functions/admin-email-center?${params.toString()}`);
      return { members: data.members ?? [], error: null };
    } catch (error) {
      return { members: [], error: error as Error };
    }
  },
};

export default adminMembersService;
