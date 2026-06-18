-- Email templates, inbound messages, and email logging for admin email center

CREATE TABLE IF NOT EXISTS public.email_templates (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.inbound_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    source TEXT NOT NULL DEFAULT 'contact_form',
    sender_name TEXT,
    sender_email TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread'
        CHECK (status IN ('unread', 'read', 'replied')),
    admin_reply TEXT,
    replied_at TIMESTAMPTZ,
    replied_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.email_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    recipient_user_id UUID REFERENCES public.profiles(id),
    subject TEXT NOT NULL,
    template_slug TEXT,
    sent_by TEXT NOT NULL DEFAULT 'system',
    admin_id UUID REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_templates_admin_all ON public.email_templates;
CREATE POLICY email_templates_admin_all
    ON public.email_templates FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS inbound_messages_admin_all ON public.inbound_messages;
CREATE POLICY inbound_messages_admin_all
    ON public.inbound_messages FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS email_log_admin_read ON public.email_log;
CREATE POLICY email_log_admin_read
    ON public.email_log FOR SELECT
    USING (public.is_admin());

DROP TRIGGER IF EXISTS handle_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER handle_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

INSERT INTO public.email_templates (slug, name, subject, html_body, description) VALUES
(
    'welcome',
    'Welcome Email',
    'Welcome to travelwithydra!',
    '<h2>Welcome to travelwithydra!</h2><p>Hello {{name}},</p><p>Thanks for joining the travelwithydra community — where borders meet opportunity. We''re thrilled to have you on board!</p><p>Whether you''re exploring visa requirements, checking your eligibility, or tracking applications, travelwithydra is here to simplify the process for you.</p><p>If you have any questions, our team is just a click away.</p><p><strong>— The travelwithydra Team</strong></p>',
    'Sent automatically when a user signs up.'
),
(
    'contact_acknowledgement',
    'Contact Form Acknowledgement',
    'We''ve received your message',
    '<h2>Message Received</h2><p>Hello {{name}},</p><p>Thank you for contacting travelwithydra. We have received your message and will get back to you as soon as possible.</p><p><strong>— The travelwithydra Team</strong></p>',
    'Sent to users after they submit the contact form.'
),
(
    'application_submitted',
    'Application Submitted',
    'Your visa application has been received',
    '<h2>Application Received</h2><p>Hello {{name}},</p><p>Thanks for submitting your visa application for {{destination}} through travelwithydra.</p><p><strong>Application ID:</strong> {{application_id}}</p><p><strong>Status:</strong> Submitted</p><p>We will notify you by email when there is an update on your application.</p><p><strong>— travelwithydra Application Team</strong></p>',
    'Sent when a user submits a visa application.'
),
(
    'application_in_review',
    'Application In Review',
    'Your visa application is being reviewed',
    '<h2>Application In Review</h2><p>Hello {{name}},</p><p>Your visa application for {{destination}} (ID: {{application_id}}) is now being reviewed by our team.</p><p>We will notify you as soon as a decision is made.</p><p><strong>— travelwithydra Application Team</strong></p>',
    'Sent when application status changes to in review.'
),
(
    'application_approved',
    'Application Approved',
    'Your visa application has been approved',
    '<h2>Application Approved</h2><p>Hello {{name}},</p><p>Great news! Your visa application for {{destination}} (ID: {{application_id}}) has been approved.</p><p>Log in to your travelwithydra dashboard to view your decision documents.</p><p><strong>— travelwithydra Application Team</strong></p>',
    'Sent when an application is approved.'
),
(
    'application_rejected',
    'Application Rejected',
    'Update on your visa application',
    '<h2>Application Update</h2><p>Hello {{name}},</p><p>We have an update regarding your visa application for {{destination}} (ID: {{application_id}}).</p><p>Unfortunately, your application was not approved at this time. Please log in to your dashboard for details or contact support if you have questions.</p><p><strong>— travelwithydra Application Team</strong></p>',
    'Sent when an application is rejected.'
),
(
    'membership_upgraded',
    'Membership Upgraded',
    'Your travelwithydra membership is now active',
    '<h2>Membership Active</h2><p>Hello {{name}},</p><p>Your travelwithydra {{subscription_tier}} membership is now active. Enjoy premium features including discounted service fees and enhanced travel tools.</p><p><strong>— The travelwithydra Team</strong></p>',
    'Sent when a user upgrades to premium or enterprise.'
)
ON CONFLICT (slug) DO NOTHING;
