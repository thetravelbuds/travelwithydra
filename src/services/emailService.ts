import { getCompanyEmail } from '../config/companyContact';

export interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface VisaApplicationNotificationPayload {
  applicationId: string;
  nationalityCode: string;
  destinationCode: string;
  userEmail?: string | null;
  userName?: string | null;
  entryDate?: string;
  exitDate?: string;
  paymentStatus?: string;
}

/** Submit contact form via secure server function (stores inbound + sends emails). */
export async function sendContactFormToCompany(payload: ContactFormPayload) {
  const response = await fetch('/.netlify/functions/contact-submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to submit contact form');
  }

  return response.json();
}

/** @deprecated Use transactionalEmailService.sendApplicationSubmitted instead */
export async function sendApplicationEmail(_to: string, _name: string = '', _applicationType: string = 'visa') {
  console.warn('sendApplicationEmail is deprecated; use transactionalEmailService.sendApplicationSubmitted');
}

/** @deprecated Handled by contact-submit function */
export async function sendAcknowledgementEmail(_to: string, _name: string = '') {
  console.warn('sendAcknowledgementEmail is deprecated; contact-submit sends acknowledgement automatically');
}

/** @deprecated Use transactionalEmailService.sendWelcome instead */
export async function sendWelcomeEmail(_to: string, _name: string = '') {
  console.warn('sendWelcomeEmail is deprecated; use transactionalEmailService.sendWelcome');
}

/** Company notification for visa applications — still sent server-side via contact flow pattern */
export async function sendVisaApplicationToCompany(payload: VisaApplicationNotificationPayload) {
  const companyEmail = getCompanyEmail();
  const response = await fetch('/.netlify/functions/contact-submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: payload.userName || 'Visa Applicant',
      email: payload.userEmail || companyEmail,
      subject: `Visa Application: ${payload.nationalityCode.toUpperCase()} → ${payload.destinationCode.toUpperCase()}`,
      message: [
        `Application ID: ${payload.applicationId}`,
        `Nationality: ${payload.nationalityCode.toUpperCase()}`,
        `Destination: ${payload.destinationCode.toUpperCase()}`,
        `Applicant: ${payload.userName || 'N/A'} (${payload.userEmail || 'N/A'})`,
        `Entry: ${payload.entryDate || 'N/A'}`,
        `Exit: ${payload.exitDate || 'N/A'}`,
        `Payment: ${payload.paymentStatus || 'pending'}`,
      ].join('\n'),
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to notify company about application');
  }
}

export { getCompanyEmail };
