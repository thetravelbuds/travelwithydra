import { getStripe, jsonResponse, handleOptions, parseBody } from './stripe-shared.mjs';
import { getServiceClient } from './admin-shared.mjs';
import {
  calculateVisaPaymentBreakdown,
  loadAndValidatePromo,
  loadDynamicEvisaFees,
  recordPromoRedemption,
} from './visa-payment-calc.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return jsonResponse(401, { error: 'Sign in to complete payment.' });
    }

    const supabase = getServiceClient();
    await loadDynamicEvisaFees(supabase);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return jsonResponse(401, { error: 'Invalid session' });
    }

    const { applicationId, promoCode, currency = 'gbp' } = parseBody(event);

    if (!applicationId) {
      return jsonResponse(400, { error: 'Application ID is required' });
    }

    const { data: application, error: appError } = await supabase
      .from('visa_applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle();

    if (appError) throw appError;
    if (!application) {
      return jsonResponse(404, { error: 'Application not found' });
    }

    if (application.user_id !== userData.user.id) {
      return jsonResponse(403, { error: 'Not authorized for this application' });
    }

    if (application.payment_status === 'paid') {
      return jsonResponse(400, { error: 'This application is already paid' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userData.user.id)
      .maybeSingle();

    let promo = null;
    let promoRow = null;
    if (promoCode) {
      const promoResult = await loadAndValidatePromo(supabase, promoCode, userData.user.id);
      if (!promoResult.ok) {
        return jsonResponse(400, { error: promoResult.error });
      }
      promo = promoResult.promo;
      promoRow = promoResult.row;
    }

    const destinationCode = application.destination_code || application.destination_id;
    const breakdown = calculateVisaPaymentBreakdown({
      destinationCode,
      applicationData: application.application_data,
      subscriptionTier: profile?.subscription_tier || 'free',
      nationalityCode: application.nationality_code,
      promo,
    });

    const amountPence = Math.round(breakdown.total * 100);
    const amountGbp = breakdown.total;

    const applicationData = {
      ...(application.application_data || {}),
      promo: promo
        ? {
            code: promo.code,
            promoId: promo.promoId,
            discountPercent: promo.discountPercent,
            waiveAllFees: promo.waiveAllFees,
            savingsGbp: breakdown.promoSavings,
          }
        : undefined,
      paymentBreakdown: breakdown,
    };

    if (amountPence <= 0) {
      await supabase
        .from('visa_applications')
        .update({
          payment_status: 'paid',
          status: 'processing',
          transaction_id: `promo-${promo?.code || 'waived'}-${applicationId}`,
          application_data: applicationData,
        })
        .eq('id', applicationId);

      if (promoRow) {
        const originalBreakdown = calculateVisaPaymentBreakdown({
          destinationCode,
          applicationData: application.application_data,
          subscriptionTier: profile?.subscription_tier || 'free',
          nationalityCode: application.nationality_code,
          promo: null,
        });
        await recordPromoRedemption(supabase, {
          promoId: promoRow.id,
          userId: userData.user.id,
          applicationId,
          amountSavedGbp: originalBreakdown.total,
        });
      }

      return jsonResponse(200, {
        waived: true,
        amountPence: 0,
        amountGbp: 0,
        breakdown,
      });
    }

    if (amountPence < 50) {
      return jsonResponse(400, {
        error: 'Payment amount is below the minimum charge. Adjust the promo code.',
      });
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountPence,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        applicationId,
        type: 'visa_application',
        promoCode: promo?.code || '',
      },
      description: `Hydra visa application ${applicationId}`,
    });

    await supabase
      .from('visa_applications')
      .update({ application_data: applicationData })
      .eq('id', applicationId);

    return jsonResponse(200, {
      clientSecret: paymentIntent.client_secret,
      amountPence,
      amountGbp,
      breakdown,
    });
  } catch (error) {
    console.error('create-payment-intent error:', error);
    return jsonResponse(500, {
      error: error.message || 'Failed to create payment intent',
    });
  }
};
