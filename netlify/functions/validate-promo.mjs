import { getServiceClient } from './admin-shared.mjs';
import { jsonResponse, handleOptions, parseBody } from './stripe-shared.mjs';
import { loadAndValidatePromo } from './visa-payment-calc.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return jsonResponse(401, { error: 'Sign in to apply a promo code.' });
    }

    const supabase = getServiceClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return jsonResponse(401, { error: 'Invalid session' });
    }

    const { code } = parseBody(event);
    const result = await loadAndValidatePromo(supabase, code, userData.user.id);

    if (!result.ok) {
      return jsonResponse(200, { valid: false, error: result.error });
    }

    return jsonResponse(200, {
      valid: true,
      promo: result.promo,
    });
  } catch (error) {
    console.error('validate-promo error:', error);
    return jsonResponse(500, { error: error.message || 'Failed to validate promo code' });
  }
};
