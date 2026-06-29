import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { jsonResponse, handleOptions } from './stripe-shared.mjs';

export function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase service role is not configured');
  }
  return createClient(url, key);
}

export async function verifyAdmin(accessToken) {
  const supabase = getServiceClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return { ok: false, status: 401, message: 'Invalid session', user: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, subscription_tier, email, full_name')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError || profile?.subscription_tier !== 'admin') {
    return { ok: false, status: 403, message: 'Admin access required', user: null };
  }

  return { ok: true, user: profile };
}

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

export function getFromEmail() {
  return (
    process.env.EMAIL_FROM_EMAIL ||
    process.env.VITE_EMAIL_FROM_EMAIL ||
    process.env.CONTACT_EMAIL ||
    'info@travelwithydra.com'
  );
}

export function getCompanyEmail() {
  return (
    process.env.CONTACT_EMAIL ||
    process.env.VITE_CONTACT_EMAIL ||
    process.env.EMAIL_FROM_EMAIL ||
    'info@travelwithydra.com'
  );
}

export function getSiteUrl() {
  return (
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.VITE_SITE_URL ||
    'https://travelwithydra.com'
  );
}

/** application | promotional | transactional */
export function buildEmailFooter(unsubscribeToken, { promotional = false } = {}) {
  const siteUrl = getSiteUrl();
  const companyEmail = getCompanyEmail();
  const prefsUrl = unsubscribeToken
    ? `${siteUrl}/email-preferences?token=${unsubscribeToken}`
    : `${siteUrl}/dashboard`;

  const promoUnsub =
    promotional && unsubscribeToken
      ? ` · <a href="${siteUrl}/email-preferences?token=${unsubscribeToken}&optout=promotional" style="color:#0d9488">Unsubscribe from promotions</a>`
      : '';

  return `<div style="margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.6">
    <p style="margin:0 0 8px">Hydra · <a href="mailto:${companyEmail}" style="color:#0d9488">${companyEmail}</a></p>
    <p style="margin:0"><a href="${prefsUrl}" style="color:#0d9488">Manage email preferences</a>${promoUnsub}</p>
  </div>`;
}

export async function getRecipientEmailPrefs(supabase, recipientUserId) {
  if (!recipientUserId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'application_emails_enabled, promotional_emails_enabled, email_unsubscribe_token'
    )
    .eq('id', recipientUserId)
    .maybeSingle();

  if (error && error.code === '42703') return null;
  if (error) throw error;
  return data;
}

export async function shouldSendEmail(supabase, recipientUserId, category) {
  if (!recipientUserId) {
    return { send: true, token: null };
  }

  const prefs = await getRecipientEmailPrefs(supabase, recipientUserId);
  if (!prefs) {
    return { send: true, token: null };
  }

  if (category === 'promotional' && prefs.promotional_emails_enabled === false) {
    return { send: false, token: prefs.email_unsubscribe_token };
  }

  if (category === 'application' && prefs.application_emails_enabled === false) {
    return { send: false, token: prefs.email_unsubscribe_token };
  }

  return { send: true, token: prefs.email_unsubscribe_token };
}

export function renderTemplate(template, variables = {}) {
  const replace = (text) =>
    String(text ?? '').replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = variables[key];
      return value === undefined || value === null ? '' : String(value);
    });

  return {
    subject: replace(template.subject),
    html: replace(template.html_body),
  };
}

export async function getTemplate(supabase, slug) {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error && error.code !== '42P01') {
    throw error;
  }

  return data;
}

export async function sendRenderedEmail({
  supabase,
  to,
  subject,
  html,
  templateSlug = null,
  recipientUserId = null,
  sentBy = 'system',
  adminId = null,
  emailCategory = 'transactional',
}) {
  const { send, token } = await shouldSendEmail(supabase, recipientUserId, emailCategory);
  if (!send) {
    return { skipped: true, reason: 'recipient_opted_out' };
  }

  const footer = buildEmailFooter(token, { promotional: emailCategory === 'promotional' });
  const htmlWithFooter = `${html}${footer}`;

  const resend = getResend();
  const fromEmail = getFromEmail();

  const result = await resend.emails.send({
    from: `Hydra <${fromEmail}>`,
    reply_to: getCompanyEmail(),
    to,
    subject,
    html: htmlWithFooter,
  });

  if (supabase) {
    await supabase.from('email_log').insert({
      recipient_email: to,
      recipient_user_id: recipientUserId,
      subject,
      template_slug: templateSlug,
      sent_by: sentBy,
      admin_id: adminId,
      status: 'sent',
    });
  }

  return result;
}

export async function sendTemplateEmail({
  supabase,
  slug,
  to,
  variables = {},
  recipientUserId = null,
  sentBy = 'system',
  adminId = null,
  emailCategory = 'transactional',
}) {
  const template = await getTemplate(supabase, slug);
  if (!template) {
    throw new Error(`Email template not found: ${slug}`);
  }

  const rendered = renderTemplate(template, variables);
  return sendRenderedEmail({
    supabase,
    to,
    subject: rendered.subject,
    html: rendered.html,
    templateSlug: slug,
    recipientUserId,
    sentBy,
    adminId,
    emailCategory,
  });
}

export { jsonResponse, handleOptions };
