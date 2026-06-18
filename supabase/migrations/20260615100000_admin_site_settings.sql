-- Admin helpers, site-wide settings, and admin read policies

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND subscription_tier = 'admin'
  );
$$;

-- Profiles: admins can read all rows for statistics
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin() OR auth.uid() = id);

-- Visa applications: admins can read and update all applications
DROP POLICY IF EXISTS visa_applications_admin_select ON public.visa_applications;
CREATE POLICY visa_applications_admin_select
    ON public.visa_applications FOR SELECT
    USING (public.is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS visa_applications_admin_update ON public.visa_applications;
CREATE POLICY visa_applications_admin_update
    ON public.visa_applications FOR UPDATE
    USING (public.is_admin() OR auth.uid() = user_id);

-- Site-wide settings (logo, nationality access, custom blogs)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    logo_url TEXT,
    nationality_application_mode TEXT NOT NULL DEFAULT 'all'
        CHECK (nationality_application_mode IN ('all', 'allowlist', 'blocklist')),
    nationality_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_blogs JSONB NOT NULL DEFAULT '[]'::jsonb,
    hidden_blog_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.site_settings (id)
VALUES ('global')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
CREATE POLICY site_settings_public_read
    ON public.site_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS site_settings_admin_write ON public.site_settings;
CREATE POLICY site_settings_admin_write
    ON public.site_settings FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS site_settings_admin_insert ON public.site_settings;
CREATE POLICY site_settings_admin_insert
    ON public.site_settings FOR INSERT
    WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS handle_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER handle_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
