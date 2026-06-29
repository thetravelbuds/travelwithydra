import { createClient } from '@supabase/supabase-js';
import {
  getServiceClient,
  sendTemplateEmail,
  jsonResponse,
  handleOptions,
} from './admin-shared.mjs';

function getAnonClient(token) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase anon key is not configured');
  }
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const body = JSON.parse(event.body || '{}');
    const { type, variables = {}, recipientEmail } = body;

    if (!type) {
      return jsonResponse(400, { error: 'Email type is required' });
    }

    const supabase = getServiceClient();
    let to = recipientEmail;
    let userId = null;
    let userProfile = null;

    if (token) {
      const anon = getAnonClient(token);
      const { data: userData } = await anon.auth.getUser();
      if (userData?.user) {
        userId = userData.user.id;
        to = to || userData.user.email;
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name, subscription_tier')
          .eq('id', userId)
          .maybeSingle();
        userProfile = profile;
      }
    }

    if (!to) {
      return jsonResponse(400, { error: 'Recipient email is required' });
    }

    const mergedVars = {
      name: variables.name || userProfile?.full_name || 'there',
      email: variables.email || to,
      destination: variables.destination || '',
      nationality: variables.nationality || '',
      application_id: variables.application_id || '',
      status: variables.status || '',
      subscription_tier: variables.subscription_tier || userProfile?.subscription_tier || '',
      ...variables,
    };

    const allowedTypes = [
      'welcome',
      'application_submitted',
      'application_in_review',
      'application_approved',
      'application_rejected',
      'payment_confirmed',
      'membership_upgraded',
      'contact_acknowledgement',
    ];

    if (!allowedTypes.includes(type)) {
      return jsonResponse(400, { error: 'Invalid email type' });
    }

    if (type === 'welcome' && !token) {
      return jsonResponse(401, { error: 'Authentication required for welcome email' });
    }

    if (type.startsWith('application_') && variables.application_id && token) {
      const { data: application } = await supabase
        .from('visa_applications')
        .select('user_id')
        .eq('id', variables.application_id)
        .maybeSingle();

      if (application && application.user_id !== userId) {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', userId)
          .maybeSingle();

        if (adminProfile?.subscription_tier !== 'admin') {
          return jsonResponse(403, { error: 'Not authorized for this application email' });
        }
      }
    }

    const emailCategory = type.startsWith('application_') || type === 'payment_confirmed'
      ? 'application'
      : 'transactional';

    await sendTemplateEmail({
      supabase,
      slug: type,
      to,
      variables: mergedVars,
      recipientUserId: userId,
      sentBy: 'system',
      emailCategory,
    });

    return jsonResponse(200, { success: true });
  } catch (error) {
    console.error('transactional-email error:', error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Failed to send email',
    });
  }
}
