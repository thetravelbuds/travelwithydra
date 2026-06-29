import { loadStripe, Stripe } from '@stripe/stripe-js';
import authService from './auth';
import { SubscriptionType, BillingCycle } from '../../config/stripePricing';
import { getStripePublishableKey } from '../../config/stripeEnv';
import type { CreatePaymentIntentResult } from './promoCodes';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripePromise(): Promise<Stripe | null> {
  const stripePublishableKey = getStripePublishableKey();
  if (!stripePublishableKey) {
    console.warn('VITE_STRIPE_PUBLIC_KEY is not configured');
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
}

const API_BASE = '/.netlify/functions';

async function postJson<T>(path: string, body: Record<string, unknown>, auth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const { session } = await authService.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('You must be signed in.');
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data as T;
}

async function getJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/${path}?${query}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data as T;
}

class StripeService {
  async createCheckoutSession(
    subscriptionType: SubscriptionType,
    billingCycle: BillingCycle
  ): Promise<{ sessionId: string; url: string }> {
    const { user } = await authService.getCurrentUser();

    return postJson('create-checkout-session', {
      subscriptionType,
      billingCycle,
      successUrl: `${window.location.origin}/subscription-success`,
      cancelUrl: `${window.location.origin}/pricing`,
      customerEmail: user?.email,
    });
  }

  async redirectToCheckout(sessionUrl: string): Promise<void> {
    window.location.href = sessionUrl;
  }

  async createPaymentIntent(
    applicationId: string,
    promoCode?: string
  ): Promise<CreatePaymentIntentResult> {
    return postJson('create-payment-intent', {
      applicationId,
      promoCode: promoCode?.trim() || undefined,
      currency: 'gbp',
    }, true);
  }

  async verifyCheckoutSession(sessionId: string): Promise<{
    paid: boolean;
    subscriptionType: string | null;
    billingCycle: string | null;
    customerEmail: string | null;
  }> {
    return getJson('get-checkout-session', { session_id: sessionId });
  }

  async syncSubscriptionByEmail(email: string): Promise<{
    active: boolean;
    tier: string | null;
    billingCycle: string | null;
    customerId?: string | null;
    subscriptionId?: string | null;
    periodEnd?: number | null;
    cancelAtPeriodEnd?: boolean;
    isLifetime?: boolean;
  }> {
    return postJson('sync-subscription', { email });
  }

  async cancelSubscription(email: string): Promise<{
    success: boolean;
    message: string;
    periodEnd?: number | null;
    cancelAtPeriodEnd?: boolean;
  }> {
    return postJson('cancel-subscription', { email });
  }

  async createBillingPortalSession(
    email: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    return postJson('create-billing-portal', { email, returnUrl });
  }

  isConfigured(): boolean {
    return Boolean(getStripePublishableKey());
  }
}

export const stripeService = new StripeService();
