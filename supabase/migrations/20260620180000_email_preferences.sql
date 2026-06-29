-- Email notification preferences + payment confirmation template

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS application_emails_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS promotional_emails_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_unsubscribe_token UUID DEFAULT gen_random_uuid();

UPDATE public.profiles
SET email_unsubscribe_token = gen_random_uuid()
WHERE email_unsubscribe_token IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN email_unsubscribe_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unsubscribe_token_idx
  ON public.profiles (email_unsubscribe_token);

-- Admin write access for eVisa fee table (service role already bypasses RLS; this helps direct API reads)
DROP POLICY IF EXISTS evisa_country_fees_admin_all ON public.evisa_country_fees;
CREATE POLICY evisa_country_fees_admin_all
  ON public.evisa_country_fees FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.email_templates (slug, name, subject, html_body, description) VALUES
(
  'payment_confirmed',
  'Payment Confirmed',
  'Payment received for your {{destination}} visa application',
  '<h2>Payment Confirmed</h2><p>Hello {{name}},</p><p>We have received your payment for your visa application to {{destination}}.</p><p><strong>Application ID:</strong> {{application_id}}</p><p>Our team will now process your application. You will receive email updates as your application progresses.</p><p><strong>— travelwithydra Application Team</strong></p>',
  'Sent when visa application payment succeeds.'
),
(
  'promotional',
  'Promotional Email',
  '{{subject_line}}',
  '<div>{{body_html}}</div><p>— The travelwithydra Team</p>',
  'Admin promotional broadcast template. Use {{subject_line}} and {{body_html}} in compose.'
)
ON CONFLICT (slug) DO NOTHING;
