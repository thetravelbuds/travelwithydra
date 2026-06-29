import { supabase } from '../supabase/client';
import authService from './auth';
import { hasSubscriptionFeature } from '../../config/subscriptionFeatures';

export type TravelAlertType =
  | 'destination_watch'
  | 'application_updates'
  | 'document_expiry'
  | 'trip_reminder'
  | 'system';

export interface TravelAlert {
  id: string;
  user_id: string;
  alert_type: string;
  title: string;
  message?: string | null;
  destination_code?: string | null;
  application_id?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface TravelAlertSubscription {
  id: string;
  user_id: string;
  destination_code?: string | null;
  alert_type: TravelAlertType;
  enabled: boolean;
  created_at: string;
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? '';
  return error.code === 'PGRST205' || error.code === '42P01' || message.includes('travel_alert');
}

async function requireAlertAccess(): Promise<{ userId: string } | { error: Error }> {
  const { user, error } = await authService.getCurrentUser();
  if (error || !user) return { error: error || new Error('Not authenticated') };

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle();

  if (!hasSubscriptionFeature(profile?.subscription_tier, 'travelAlerts')) {
    return { error: new Error('Travel alerts require a Premium or Enterprise subscription.') };
  }

  return { userId: user.id };
}

export const travelAlertsService = {
  async listAlerts(limit = 50): Promise<{ alerts: TravelAlert[]; error: Error | null }> {
    const access = await requireAlertAccess();
    if ('error' in access) return { alerts: [], error: access.error };

    const { data, error } = await supabase
      .from('travel_alerts')
      .select('*')
      .eq('user_id', access.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTable(error)) return { alerts: [], error: null };
      return { alerts: [], error };
    }

    return { alerts: (data ?? []) as TravelAlert[], error: null };
  },

  async markRead(alertId: string): Promise<{ success: boolean; error: Error | null }> {
    const access = await requireAlertAccess();
    if ('error' in access) return { success: false, error: access.error };

    const { error } = await supabase
      .from('travel_alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('id', alertId)
      .eq('user_id', access.userId);

    return { success: !error, error: error ?? null };
  },

  async markAllRead(): Promise<{ success: boolean; error: Error | null }> {
    const access = await requireAlertAccess();
    if ('error' in access) return { success: false, error: access.error };

    const { error } = await supabase
      .from('travel_alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', access.userId)
      .is('read_at', null);

    return { success: !error, error: error ?? null };
  },

  async listSubscriptions(): Promise<{ subscriptions: TravelAlertSubscription[]; error: Error | null }> {
    const access = await requireAlertAccess();
    if ('error' in access) return { subscriptions: [], error: access.error };

    const { data, error } = await supabase
      .from('travel_alert_subscriptions')
      .select('*')
      .eq('user_id', access.userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingTable(error)) return { subscriptions: [], error: null };
      return { subscriptions: [], error };
    }

    return { subscriptions: (data ?? []) as TravelAlertSubscription[], error: null };
  },

  async upsertSubscription(input: {
    destinationCode?: string;
    alertType: TravelAlertType;
    enabled: boolean;
  }): Promise<{ subscription: TravelAlertSubscription | null; error: Error | null }> {
    const access = await requireAlertAccess();
    if ('error' in access) return { subscription: null, error: access.error };

    const { data, error } = await supabase
      .from('travel_alert_subscriptions')
      .upsert(
        {
          user_id: access.userId,
          destination_code: input.destinationCode?.toLowerCase() || null,
          alert_type: input.alertType,
          enabled: input.enabled,
        },
        { onConflict: 'user_id,destination_code,alert_type' }
      )
      .select()
      .single();

    if (error) return { subscription: null, error };
    return { subscription: data as TravelAlertSubscription, error: null };
  },

  async createAlert(input: {
    alertType: TravelAlertType;
    title: string;
    message?: string;
    destinationCode?: string;
    applicationId?: string;
  }): Promise<{ alert: TravelAlert | null; error: Error | null }> {
    const { user, error: authError } = await authService.getCurrentUser();
    if (authError || !user) return { alert: null, error: authError || new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('travel_alerts')
      .insert({
        user_id: user.id,
        alert_type: input.alertType,
        title: input.title,
        message: input.message ?? null,
        destination_code: input.destinationCode?.toLowerCase() ?? null,
        application_id: input.applicationId ?? null,
      })
      .select()
      .single();

    if (error) {
      if (isMissingTable(error)) return { alert: null, error: null };
      return { alert: null, error };
    }

    return { alert: data as TravelAlert, error: null };
  },

  async notifyApplicationStatusChange(
    userId: string,
    applicationId: string,
    destinationName: string,
    status: string
  ) {
    const { data: subs } = await supabase
      .from('travel_alert_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('alert_type', 'application_updates')
      .eq('enabled', true)
      .limit(1);

    if (!subs?.length) return;

    await supabase.from('travel_alerts').insert({
      user_id: userId,
      alert_type: 'application_updates',
      title: `Application update: ${destinationName}`,
      message: `Your visa application status is now "${status}".`,
      application_id: applicationId,
    });
  },
};

export default travelAlertsService;
