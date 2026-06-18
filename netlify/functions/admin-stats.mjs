import { createClient } from '@supabase/supabase-js';
import { jsonResponse, handleOptions } from './stripe-shared.mjs';

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase service role is not configured');
  }
  return createClient(url, key);
}

async function verifyAdmin(accessToken) {
  const supabase = getServiceClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return { ok: false, status: 401, message: 'Invalid session' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError || profile?.subscription_tier !== 'admin') {
    return { ok: false, status: 403, message: 'Admin access required' };
  }

  return { ok: true };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return jsonResponse(401, { error: 'Missing authorization token' });
    }

    const adminCheck = await verifyAdmin(token);
    if (!adminCheck.ok) {
      return jsonResponse(adminCheck.status, { error: adminCheck.message });
    }

    const supabase = getServiceClient();

    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      throw usersError;
    }

    const { count: premiumUsers, error: premiumError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('subscription_tier', ['premium', 'enterprise']);

    if (premiumError) {
      throw premiumError;
    }

    const { data: applications, error: appsError } = await supabase
      .from('visa_applications')
      .select('application_data');

    if (appsError && appsError.code !== '42P01') {
      throw appsError;
    }

    const apps = applications ?? [];
    const incompleteApplications = apps.filter((app) => {
      const data = app.application_data;
      return Boolean(data && (data.draft === true || data.currentStep));
    }).length;

    return jsonResponse(200, {
      totalUsers: totalUsers ?? 0,
      premiumUsers: premiumUsers ?? 0,
      totalApplications: apps.length,
      incompleteApplications,
    });
  } catch (error) {
    console.error('admin-stats error:', error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Failed to load admin stats',
    });
  }
}
