import { getStripe, jsonResponse, handleOptions, parseBody } from './stripe-shared.mjs';
import { getServiceClient } from './admin-shared.mjs';
import { recordPromoRedemption } from './visa-payment-calc.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return jsonResponse(401, { error: 'Sign in required' });
    }

    const supabase = getServiceClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return jsonResponse(401, { error: 'Invalid session' });
    }

    const { applicationId, paymentIntentId } = parseBody(event);
    if (!applicationId) {
      return jsonResponse(400, { error: 'Application ID is required' });
    }

    const { data: application, error: appError } = await supabase
      .from('visa_applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle();

    if (appError) throw appError;
    if (!application || application.user_id !== userData.user.id) {
      return jsonResponse(403, { error: 'Not authorized' });
    }

    if (paymentIntentId) {
      const stripe = getStripe();
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== 'succeeded') {
        return jsonResponse(400, { error: 'Payment not completed' });
      }
      if (intent.metadata?.applicationId !== applicationId) {
        return jsonResponse(400, { error: 'Payment does not match application' });
      }
    }

    const promo = application.application_data?.promo;
    if (!promo?.promoId) {
      return jsonResponse(200, { success: true, redeemed: false });
    }

    const { data: existing } = await supabase
      .from('promo_redemptions')
      .select('id')
      .eq('application_id', applicationId)
      .eq('promo_code_id', promo.promoId)
      .maybeSingle();

    if (!existing) {
      await recordPromoRedemption(supabase, {
        promoId: promo.promoId,
        userId: userData.user.id,
        applicationId,
        amountSavedGbp: promo.savingsGbp || 0,
      });
    }

    return jsonResponse(200, { success: true, redeemed: true });
  } catch (error) {
    console.error('finalize-visa-payment error:', error);
    return jsonResponse(500, { error: error.message || 'Failed to finalize payment' });
  }
};
