import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import visaApplicationsService from '../lib/api/visaApplications';
import authService from '../lib/api/auth';
import { sendVisaApplicationToCompany } from '../services/emailService';
import { stripeService, getStripePromise } from '../lib/api/stripeService';
import { formatGbp } from '../config/stripePricing';
import type { CreatePaymentIntentResult } from '../lib/api/promoCodes';
import { readCheckoutPromoCode } from '../utils/checkoutPromoCode';
import transactionalEmailService from '../lib/api/transactionalEmail';
import { getCountryName } from '../data/countryCodes';

interface PaymentFormProps {
  applicationId: string;
  amountGbp: number;
}

const PaymentForm = ({ applicationId, amountGbp }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const finalizePromo = async (paymentIntentId?: string) => {
    const { session } = await authService.getSession();
    const token = session?.access_token;
    if (!token) return;

    await fetch('/.netlify/functions/finalize-visa-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ applicationId, paymentIntentId }),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/visa/confirmation/${applicationId}`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
      }

      if (paymentIntent?.status !== 'succeeded') {
        throw new Error('Payment was not completed. Please try again.');
      }

      const { success, error: saveError } = await visaApplicationsService.markPaymentPaid(
        applicationId,
        paymentIntent.id
      );

      if (!success || saveError) {
        throw saveError ?? new Error('Payment succeeded but failed to update application');
      }

      await finalizePromo(paymentIntent.id);

      try {
        const [{ user }, { application }] = await Promise.all([
          authService.getCurrentUser(),
          visaApplicationsService.getApplicationById(applicationId),
        ]);

        if (application) {
          await sendVisaApplicationToCompany({
            applicationId: application.id,
            nationalityCode: application.nationality_code || 'unknown',
            destinationCode: application.destination_code || application.destination_id,
            userEmail: user?.email,
            userName: user?.full_name,
            entryDate: application.entry_date,
            exitDate: application.exit_date,
            paymentStatus: 'paid',
          });

          if (user?.email) {
            const destination =
              application.destination_name ||
              getCountryName(application.destination_code || application.destination_id || '') ||
              'your destination';
            await transactionalEmailService.sendPaymentConfirmed({
              name: user.full_name || 'there',
              email: user.email,
              destination,
              application_id: application.id,
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send payment notification email:', emailError);
      }

      navigate(`/visa/confirmation/${applicationId}`);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred processing your payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full px-4 py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing…' : `Pay ${formatGbp(amountGbp)}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Payments are processed securely by Stripe. See our{' '}
        <Link to="/refunds" className="text-primary-600 hover:underline">
          Refund Policy
        </Link>
        .
      </p>
    </form>
  );
};

const PaymentPage = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountGbp, setAmountGbp] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<CreatePaymentIntentResult['breakdown'] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | undefined>(undefined);
  const [promoMessage, setPromoMessage] = useState('');
  const [waived, setWaived] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const initPayment = useCallback(
    async (promoCode?: string) => {
      if (!applicationId) return;

      setLoading(true);
      setLoadError('');
      setClientSecret(null);
      setWaived(false);

      try {
        const { application, error } =
          await visaApplicationsService.getApplicationById(applicationId);

        if (error || !application) {
          throw new Error('Application not found');
        }

        if (application.payment_status === 'paid') {
          navigate(`/visa/confirmation/${applicationId}`);
          return;
        }

        const result = await stripeService.createPaymentIntent(applicationId, promoCode);

        setAmountGbp(result.amountGbp);
        setBreakdown(result.breakdown ?? null);
        setAppliedPromo(promoCode?.trim().toUpperCase());

        if (result.waived) {
          setWaived(true);
          setPromoMessage('All fees waived — no payment required.');
          return;
        }

        if (!result.clientSecret) {
          throw new Error('Unable to start payment');
        }

        setClientSecret(result.clientSecret);
        if (result.breakdown?.promoSavings) {
          setPromoMessage(
            `Promo applied — you save ${formatGbp(result.breakdown.promoSavings)} on the service fee.`
          );
        } else if (promoCode) {
          setPromoMessage('Promo code applied.');
        }
      } catch (err) {
        console.error('Payment init error:', err);
        setLoadError(err instanceof Error ? err.message : 'Unable to load payment form');
      } finally {
        setLoading(false);
      }
    },
    [applicationId, navigate]
  );

  useEffect(() => {
    if (!applicationId) {
      setLoadError('Missing application ID');
      setLoading(false);
      return;
    }

    if (!stripeService.isConfigured()) {
      setLoadError(
        'Stripe is not configured. Add VITE_STRIPE_PUBLIC_KEY and STRIPE_SECRET_KEY to your environment.'
      );
      setLoading(false);
      return;
    }

    const savedPromo = readCheckoutPromoCode();
    if (savedPromo) {
      setPromoInput(savedPromo);
      void initPayment(savedPromo);
      return;
    }

    void initPayment();
  }, [applicationId, initPayment]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setApplyingPromo(true);
    setPromoMessage('');
    await initPayment(promoInput.trim());
    setApplyingPromo(false);
  };

  const handleWaivedComplete = async () => {
    if (!applicationId) return;
    navigate(`/visa/confirmation/${applicationId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h1>
        <p className="text-gray-600 mb-6">
          Visa application {applicationId ? `#${applicationId.slice(0, 8)}…` : ''}
        </p>

        <div className="mb-6">
          <label htmlFor="promo-code" className="block text-sm font-medium text-gray-700 mb-1">
            Discount code
          </label>
          <div className="flex gap-2">
            <input
              id="promo-code"
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 uppercase"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={applyingPromo || loading || !promoInput.trim()}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {applyingPromo ? 'Applying…' : 'Apply'}
            </button>
          </div>
          {promoMessage && (
            <p className="mt-2 text-sm text-green-700">{promoMessage}</p>
          )}
          {appliedPromo && !loadError && (
            <p className="mt-1 text-xs text-gray-500">Code: {appliedPromo}</p>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600" />
          </div>
        )}

        {loadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
            {loadError}
          </div>
        )}

        {!loading && !loadError && breakdown && (
          <div className="mb-6 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
            {breakdown.visaFees > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Visa fees</span>
                <span>{formatGbp(breakdown.visaFees)}</span>
              </div>
            )}
            {breakdown.appointmentFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Appointment booking</span>
                <span>{formatGbp(breakdown.appointmentFee)}</span>
              </div>
            )}
            {breakdown.serviceFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Service fee</span>
                <span>{formatGbp(breakdown.serviceFee)}</span>
              </div>
            )}
            {breakdown.travelInsurance > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Travel insurance</span>
                <span>{formatGbp(breakdown.travelInsurance)}</span>
              </div>
            )}
            {breakdown.expressFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Express processing</span>
                <span>{formatGbp(breakdown.expressFee)}</span>
              </div>
            )}
            {breakdown.promoSavings > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Promo savings</span>
                <span>-{formatGbp(breakdown.promoSavings)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900">
              <span>Total due</span>
              <span>{formatGbp(amountGbp ?? 0)}</span>
            </div>
          </div>
        )}

        {!loading && !loadError && waived && (
          <button
            type="button"
            onClick={handleWaivedComplete}
            className="w-full px-4 py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700"
          >
            Continue — no payment required
          </button>
        )}

        {!loading && !loadError && clientSecret && amountGbp !== null && applicationId && !waived && (
          <Elements
            stripe={getStripePromise()}
            options={{
              clientSecret,
              appearance: { theme: 'stripe' },
            }}
          >
            <PaymentForm applicationId={applicationId} amountGbp={amountGbp} />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
