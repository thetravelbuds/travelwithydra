import authService from './auth';
import supabase from '../supabase/client';
import visaApplicationsService from './visaApplications';

export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  totalApplications: number;
  incompleteApplications: number;
}

async function fetchFromNetlify(accessToken: string): Promise<AdminStats | null> {
  try {
    const response = await fetch('/.netlify/functions/admin-stats', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      totalUsers: data.totalUsers ?? 0,
      premiumUsers: data.premiumUsers ?? 0,
      totalApplications: data.totalApplications ?? 0,
      incompleteApplications: data.incompleteApplications ?? 0,
    };
  } catch {
    return null;
  }
}

function countIncomplete(applications: { application_data?: Record<string, unknown> }[]): number {
  return applications.filter((app) => {
    const data = app.application_data;
    return Boolean(data && (data.draft === true || data.currentStep));
  }).length;
}

export const adminStatsService = {
  async getStats(): Promise<{ stats: AdminStats; error: Error | null }> {
    try {
      const { session } = await authService.getSession();
      const token = session?.access_token;

      if (token) {
        const fromFunction = await fetchFromNetlify(token);
        if (fromFunction) {
          return { stats: fromFunction, error: null };
        }
      }

      const { count: profileCount, error: profileError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: premiumCount, error: premiumError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('subscription_tier', ['premium', 'enterprise']);

      const { applications, error: appsError } =
        await visaApplicationsService.getAllApplicationsForAdmin();

      const stats: AdminStats = {
        totalUsers: profileCount ?? 0,
        premiumUsers: premiumCount ?? 0,
        totalApplications: applications?.length ?? 0,
        incompleteApplications: countIncomplete(applications ?? []),
      };

      const error = profileError || premiumError || appsError;
      return { stats, error: error ? (error as Error) : null };
    } catch (error) {
      return {
        stats: {
          totalUsers: 0,
          premiumUsers: 0,
          totalApplications: 0,
          incompleteApplications: 0,
        },
        error: error as Error,
      };
    }
  },
};

export default adminStatsService;
