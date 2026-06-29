-- Premium & Enterprise feature infrastructure
-- travel alerts, document vault, organizations, AI usage tracking

-- ── Organizations (Enterprise) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS organizations_owner_idx ON public.organizations (owner_id);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'agent', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS organization_members_user_idx ON public.organization_members (user_id);

CREATE TABLE IF NOT EXISTS public.organization_travelers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    nationality_code TEXT,
    passport_number_last4 TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS organization_travelers_org_idx ON public.organization_travelers (organization_id);

-- ── User documents (Premium+) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    organization_traveler_id UUID REFERENCES public.organization_travelers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS user_documents_user_idx ON public.user_documents (user_id);
CREATE INDEX IF NOT EXISTS user_documents_org_idx ON public.user_documents (organization_id);

CREATE TABLE IF NOT EXISTS public.trip_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS trip_documents_trip_idx ON public.trip_documents (trip_id);
CREATE INDEX IF NOT EXISTS trip_documents_user_idx ON public.trip_documents (user_id);

-- ── Travel alerts (Premium+) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.travel_alert_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    destination_code TEXT,
    alert_type TEXT NOT NULL DEFAULT 'destination_watch'
        CHECK (alert_type IN ('destination_watch', 'application_updates', 'document_expiry', 'trip_reminder')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, destination_code, alert_type)
);

CREATE INDEX IF NOT EXISTS travel_alert_subscriptions_user_idx ON public.travel_alert_subscriptions (user_id);

CREATE TABLE IF NOT EXISTS public.travel_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    destination_code TEXT,
    application_id UUID REFERENCES public.visa_applications(id) ON DELETE SET NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS travel_alerts_user_idx ON public.travel_alerts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS travel_alerts_unread_idx ON public.travel_alerts (user_id) WHERE read_at IS NULL;

-- ── Server-side AI usage ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_daily_usage (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    message_count INTEGER NOT NULL DEFAULT 0 CHECK (message_count >= 0),
    PRIMARY KEY (user_id, usage_date)
);

-- ── Triggers ─────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_organization_travelers_updated_at ON public.organization_travelers;
CREATE TRIGGER set_organization_travelers_updated_at
    BEFORE UPDATE ON public.organization_travelers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_user_documents_updated_at ON public.user_documents;
CREATE TRIGGER set_user_documents_updated_at
    BEFORE UPDATE ON public.user_documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;

-- Organizations: owner or member can read; owner can manage
DROP POLICY IF EXISTS organizations_member_select ON public.organizations;
CREATE POLICY organizations_member_select ON public.organizations FOR SELECT
    USING (
        owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.organization_members m
            WHERE m.organization_id = id AND m.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS organizations_owner_insert ON public.organizations;
CREATE POLICY organizations_owner_insert ON public.organizations FOR INSERT
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS organizations_owner_update ON public.organizations;
CREATE POLICY organizations_owner_update ON public.organizations FOR UPDATE
    USING (owner_id = auth.uid());

DROP POLICY IF EXISTS organizations_owner_delete ON public.organizations;
CREATE POLICY organizations_owner_delete ON public.organizations FOR DELETE
    USING (owner_id = auth.uid());

-- Organization members
DROP POLICY IF EXISTS org_members_select ON public.organization_members;
CREATE POLICY org_members_select ON public.organization_members FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = organization_id AND o.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS org_members_owner_manage ON public.organization_members;
CREATE POLICY org_members_owner_manage ON public.organization_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = organization_id AND o.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = organization_id AND o.owner_id = auth.uid()
        )
    );

-- Organization travelers: org members with admin/agent role
DROP POLICY IF EXISTS org_travelers_select ON public.organization_travelers;
CREATE POLICY org_travelers_select ON public.organization_travelers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members m
            WHERE m.organization_id = organization_travelers.organization_id
              AND m.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = organization_travelers.organization_id AND o.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS org_travelers_manage ON public.organization_travelers;
CREATE POLICY org_travelers_manage ON public.organization_travelers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members m
            WHERE m.organization_id = organization_travelers.organization_id
              AND m.user_id = auth.uid()
              AND m.role IN ('admin', 'agent')
        )
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = organization_travelers.organization_id AND o.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members m
            WHERE m.organization_id = organization_travelers.organization_id
              AND m.user_id = auth.uid()
              AND m.role IN ('admin', 'agent')
        )
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = organization_travelers.organization_id AND o.owner_id = auth.uid()
        )
    );

-- User documents
DROP POLICY IF EXISTS user_documents_own ON public.user_documents;
CREATE POLICY user_documents_own ON public.user_documents FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Trip documents
DROP POLICY IF EXISTS trip_documents_own ON public.trip_documents;
CREATE POLICY trip_documents_own ON public.trip_documents FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Travel alerts
DROP POLICY IF EXISTS travel_alerts_own ON public.travel_alerts;
CREATE POLICY travel_alerts_own ON public.travel_alerts FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS travel_alert_subs_own ON public.travel_alert_subscriptions;
CREATE POLICY travel_alert_subs_own ON public.travel_alert_subscriptions FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- AI usage: users read own; service role inserts via functions
DROP POLICY IF EXISTS ai_usage_own_read ON public.ai_daily_usage;
CREATE POLICY ai_usage_own_read ON public.ai_daily_usage FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS ai_usage_own_upsert ON public.ai_daily_usage;
CREATE POLICY ai_usage_own_upsert ON public.ai_daily_usage FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS ai_usage_own_update ON public.ai_daily_usage;
CREATE POLICY ai_usage_own_update ON public.ai_daily_usage FOR UPDATE
    USING (user_id = auth.uid());
