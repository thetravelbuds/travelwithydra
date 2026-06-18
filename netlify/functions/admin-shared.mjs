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
}) {
  const resend = getResend();
  const fromEmail = getFromEmail();

  const result = await resend.emails.send({
    from: `travelwithydra <${fromEmail}>`,
    to,
    subject,
    html,
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
  });
}

export { jsonResponse, handleOptions };
