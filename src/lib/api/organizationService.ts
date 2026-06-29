import { supabase } from '../supabase/client';
import authService from './auth';
import {
  getOrganizationTravelerLimit,
  hasSubscriptionFeature,
} from '../../config/subscriptionFeatures';

export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface OrganizationTraveler {
  id: string;
  organization_id: string;
  full_name: string;
  email?: string | null;
  nationality_code?: string | null;
  passport_number_last4?: string | null;
  notes?: string | null;
  created_at: string;
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? '';
  return error.code === 'PGRST205' || error.code === '42P01' || message.includes('organization');
}

async function requireEnterpriseAccess(): Promise<
  { userId: string; tier: string } | { error: Error }
> {
  const { user, error } = await authService.getCurrentUser();
  if (error || !user) return { error: error || new Error('Not authenticated') };

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle();

  const tier = profile?.subscription_tier || 'free';
  if (!hasSubscriptionFeature(tier, 'organizationTravelers')) {
    return {
      error: new Error('Traveler management requires an Enterprise subscription.'),
    };
  }

  return { userId: user.id, tier };
}

export const organizationService = {
  async getOrCreateOrganization(name?: string): Promise<{
    organization: Organization | null;
    error: Error | null;
  }> {
    const access = await requireEnterpriseAccess();
    if ('error' in access) return { organization: null, error: access.error };

    const { data: existing } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', access.userId)
      .maybeSingle();

    if (existing) return { organization: existing as Organization, error: null };

    const orgName = name?.trim() || 'My Travel Business';
    const { data, error } = await supabase
      .from('organizations')
      .insert({ name: orgName, owner_id: access.userId })
      .select()
      .single();

    if (error) {
      if (isMissingTable(error)) {
        return {
          organization: null,
          error: new Error('Organization features are not configured yet. Run the latest Supabase migration.'),
        };
      }
      return { organization: null, error };
    }

    await supabase.from('organization_members').insert({
      organization_id: data.id,
      user_id: access.userId,
      role: 'admin',
    });

    return { organization: data as Organization, error: null };
  },

  async listTravelers(organizationId: string): Promise<{
    travelers: OrganizationTraveler[];
    error: Error | null;
  }> {
    const access = await requireEnterpriseAccess();
    if ('error' in access) return { travelers: [], error: access.error };

    const { data, error } = await supabase
      .from('organization_travelers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('full_name', { ascending: true });

    if (error) {
      if (isMissingTable(error)) return { travelers: [], error: null };
      return { travelers: [], error };
    }

    return { travelers: (data ?? []) as OrganizationTraveler[], error: null };
  },

  async addTraveler(
    organizationId: string,
    input: {
      fullName: string;
      email?: string;
      nationalityCode?: string;
      passportLast4?: string;
      notes?: string;
    }
  ): Promise<{ traveler: OrganizationTraveler | null; error: Error | null }> {
    const access = await requireEnterpriseAccess();
    if ('error' in access) return { traveler: null, error: access.error };

    const limit = getOrganizationTravelerLimit(access.tier);
    const { count } = await supabase
      .from('organization_travelers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if ((count ?? 0) >= limit) {
      return {
        traveler: null,
        error: new Error(`Traveler limit reached (${limit}). Contact support to increase capacity.`),
      };
    }

    const { data, error } = await supabase
      .from('organization_travelers')
      .insert({
        organization_id: organizationId,
        full_name: input.fullName.trim(),
        email: input.email?.trim() || null,
        nationality_code: input.nationalityCode?.toLowerCase() || null,
        passport_number_last4: input.passportLast4 || null,
        notes: input.notes || null,
        created_by: access.userId,
      })
      .select()
      .single();

    if (error) return { traveler: null, error };
    return { traveler: data as OrganizationTraveler, error: null };
  },

  async updateTraveler(
    travelerId: string,
    input: Partial<{
      fullName: string;
      email: string;
      nationalityCode: string;
      passportLast4: string;
      notes: string;
    }>
  ): Promise<{ success: boolean; error: Error | null }> {
    const access = await requireEnterpriseAccess();
    if ('error' in access) return { success: false, error: access.error };

    const updates: Record<string, string | null> = {};
    if (input.fullName !== undefined) updates.full_name = input.fullName.trim();
    if (input.email !== undefined) updates.email = input.email.trim() || null;
    if (input.nationalityCode !== undefined) {
      updates.nationality_code = input.nationalityCode.toLowerCase() || null;
    }
    if (input.passportLast4 !== undefined) updates.passport_number_last4 = input.passportLast4 || null;
    if (input.notes !== undefined) updates.notes = input.notes || null;

    const { error } = await supabase
      .from('organization_travelers')
      .update(updates)
      .eq('id', travelerId);

    return { success: !error, error: error ?? null };
  },

  async deleteTraveler(travelerId: string): Promise<{ success: boolean; error: Error | null }> {
    const access = await requireEnterpriseAccess();
    if ('error' in access) return { success: false, error: access.error };

    const { error } = await supabase
      .from('organization_travelers')
      .delete()
      .eq('id', travelerId);

    return { success: !error, error: error ?? null };
  },
};

export default organizationService;
