-- Promo / discount codes for visa application checkout (service fee discounts)

CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    description TEXT,
  -- Percent off the platform service fee line only (not government visa fees)
    discount_percent INTEGER NOT NULL DEFAULT 0
        CHECK (discount_percent >= 0 AND discount_percent <= 100),
  -- When true, entire checkout is £0 (for internal testing)
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

-- Admins manage codes
DROP POLICY IF EXISTS promo_codes_admin_all ON public.promo_codes;
CREATE POLICY promo_codes_admin_all
    ON public.promo_codes FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Authenticated users can read active codes for validation (code lookup only)
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
