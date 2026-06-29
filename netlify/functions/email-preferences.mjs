import { getServiceClient, jsonResponse, handleOptions } from './admin-shared.mjs';

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();

  try {
    const supabase = getServiceClient();
    const token =
      event.queryStringParameters?.token ||
      parseBody(event).token;

    if (!token) {
      return jsonResponse(400, { error: 'Missing token' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(
        'id, email, full_name, application_emails_enabled, promotional_emails_enabled'
      )
      .eq('email_unsubscribe_token', token)
      .maybeSingle();

    if (error) {
      if (error.code === '42703') {
        return jsonResponse(503, {
          error: 'Email preferences are not set up yet. Run the database migration.',
        });
      }
      throw error;
    }

    if (!profile) {
      return jsonResponse(404, { error: 'Invalid or expired link' });
    }

    if (event.httpMethod === 'GET') {
      return jsonResponse(200, {
        email: profile.email,
        name: profile.full_name,
        application_emails_enabled: profile.application_emails_enabled !== false,
        promotional_emails_enabled: profile.promotional_emails_enabled !== false,
      });
    }

    if (event.httpMethod !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' });
    }

    const body = parseBody(event);
    const optout = event.queryStringParameters?.optout || body.optout;

    const updates = {};
    if (optout === 'promotional') {
      updates.promotional_emails_enabled = false;
    } else if (optout === 'application') {
      updates.application_emails_enabled = false;
    } else {
      if (typeof body.application_emails_enabled === 'boolean') {
        updates.application_emails_enabled = body.application_emails_enabled;
      }
      if (typeof body.promotional_emails_enabled === 'boolean') {
        updates.promotional_emails_enabled = body.promotional_emails_enabled;
      }
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse(400, { error: 'No preference updates provided' });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (updateError) throw updateError;

    return jsonResponse(200, {
      success: true,
      application_emails_enabled:
        updates.application_emails_enabled ?? profile.application_emails_enabled !== false,
      promotional_emails_enabled:
        updates.promotional_emails_enabled ?? profile.promotional_emails_enabled !== false,
    });
  } catch (err) {
    console.error('email-preferences error:', err);
    return jsonResponse(500, {
      error: err instanceof Error ? err.message : 'Server error',
    });
  }
};
