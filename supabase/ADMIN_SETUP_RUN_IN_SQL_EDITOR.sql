-- =============================================================================
-- RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR (Dashboard → SQL → New query)
-- Fixes: promo_codes, evisa_country_fees, email preferences
-- Project: pfnmtnluxziacxkhckly
-- =============================================================================

-- ── 1. Promo codes ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    description TEXT,
    discount_percent INTEGER NOT NULL DEFAULT 0
        CHECK (discount_percent >= 0 AND discount_percent <= 100),
    waive_all_fees BOOLEAN NOT NULL DEFAULT false,
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT promo_codes_code_unique UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS promo_codes_code_lower_idx ON public.promo_codes (lower(code));

CREATE TABLE IF NOT EXISTS public.promo_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.visa_applications(id) ON DELETE SET NULL,
    amount_saved_gbp NUMERIC(10, 2) NOT NULL DEFAULT 0,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS promo_redemptions_promo_idx ON public.promo_redemptions (promo_code_id);
CREATE INDEX IF NOT EXISTS promo_redemptions_user_idx ON public.promo_redemptions (user_id);

DROP TRIGGER IF EXISTS set_promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER set_promo_codes_updated_at
    BEFORE UPDATE ON public.promo_codes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promo_codes_admin_all ON public.promo_codes;
CREATE POLICY promo_codes_admin_all
    ON public.promo_codes FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS promo_codes_authenticated_read ON public.promo_codes;
CREATE POLICY promo_codes_authenticated_read
    ON public.promo_codes FOR SELECT
    USING (auth.uid() IS NOT NULL AND active = true);

DROP POLICY IF EXISTS promo_redemptions_admin_read ON public.promo_redemptions;
CREATE POLICY promo_redemptions_admin_read
    ON public.promo_redemptions FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS promo_redemptions_user_read ON public.promo_redemptions;
CREATE POLICY promo_redemptions_user_read
    ON public.promo_redemptions FOR SELECT
    USING (auth.uid() = user_id);

-- ── 2. eVisa country fees ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.evisa_country_fees (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  visa_fee_gbp NUMERIC(10, 2) NOT NULL CHECK (visa_fee_gbp >= 0),
  service_fee_gbp NUMERIC(10, 2) NOT NULL CHECK (service_fee_gbp >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS evisa_country_fees_updated_at_idx
  ON public.evisa_country_fees (updated_at DESC);

ALTER TABLE public.evisa_country_fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read evisa country fees" ON public.evisa_country_fees;
CREATE POLICY "Public read evisa country fees"
  ON public.evisa_country_fees FOR SELECT USING (true);

DROP POLICY IF EXISTS evisa_country_fees_admin_all ON public.evisa_country_fees;
CREATE POLICY evisa_country_fees_admin_all
  ON public.evisa_country_fees FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 3. Email preferences on profiles ────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS application_emails_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS promotional_emails_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_unsubscribe_token UUID DEFAULT gen_random_uuid();

UPDATE public.profiles SET email_unsubscribe_token = gen_random_uuid()
WHERE email_unsubscribe_token IS NULL;

ALTER TABLE public.profiles ALTER COLUMN email_unsubscribe_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unsubscribe_token_idx
  ON public.profiles (email_unsubscribe_token);

-- ── 4. Email templates ──────────────────────────────────────────────────────

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
  'Admin promotional broadcast template.'
)
ON CONFLICT (slug) DO NOTHING;

-- ── 4. Premium & Enterprise features ─────────────────────────────────────────
-- Run supabase/migrations/20260621120000_premium_enterprise_features.sql
-- Or paste that file here if tables are missing (travel_alerts, user_documents, organizations).

-- Done! Refresh Admin → Promo Codes and eVisa Fees pages.
