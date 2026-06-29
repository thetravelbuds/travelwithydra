import authService from './auth';

export type TransactionalEmailType =
  | 'welcome'
  | 'application_submitted'
  | 'application_in_review'
  | 'application_approved'
  | 'application_rejected'
  | 'payment_confirmed'
  | 'membership_upgraded'
  | 'contact_acknowledgement';

export interface TransactionalEmailVariables {
  name?: string;
  email?: string;
  destination?: string;
  nationality?: string;
  application_id?: string;
  status?: string;
  subscription_tier?: string;
  [key: string]: string | undefined;
}

async function sendTransactionalEmail(
  type: TransactionalEmailType,
  variables: TransactionalEmailVariables = {},
  recipientEmail?: string
): Promise<void> {
  const { session } = await authService.getSession();
  const token = session?.access_token;

  const response = await fetch('/.netlify/functions/transactional-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ type, variables, recipientEmail }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to send email');
  }
}

export const transactionalEmailService = {
  sendWelcome(name: string, email?: string) {
    return sendTransactionalEmail('welcome', { name, email }, email);
  },

  sendApplicationSubmitted(payload: {
    name: string;
    email?: string;
    destination: string;
    nationality: string;
    application_id: string;
  }) {
    return sendTransactionalEmail(
      'application_submitted',
      {
        name: payload.name,
        email: payload.email,
        destination: payload.destination,
        nationality: payload.nationality,
        application_id: payload.application_id,
        status: 'submitted',
      },
      payload.email
    );
  },

  sendApplicationStatusUpdate(payload: {
    status: 'in_review' | 'approved' | 'rejected';
    name: string;
    email?: string;
    destination: string;
    application_id: string;
  }) {
    const typeMap = {
      in_review: 'application_in_review',
      approved: 'application_approved',
      rejected: 'application_rejected',
    } as const;

    return sendTransactionalEmail(
      typeMap[payload.status],
      {
        name: payload.name,
        email: payload.email,
        destination: payload.destination,
        application_id: payload.application_id,
        status: payload.status,
      },
      payload.email
    );
  },

  sendPaymentConfirmed(payload: {
    name: string;
    email?: string;
    destination: string;
    application_id: string;
  }) {
    return sendTransactionalEmail(
      'payment_confirmed',
      {
        name: payload.name,
        email: payload.email,
        destination: payload.destination,
        application_id: payload.application_id,
        status: 'paid',
      },
      payload.email
    );
  },

  sendMembershipUpgraded(name: string, subscriptionTier: string, email?: string) {
    return sendTransactionalEmail(
      'membership_upgraded',
      { name, subscription_tier: subscriptionTier, email },
      email
    );
  },
};

export default transactionalEmailService;
