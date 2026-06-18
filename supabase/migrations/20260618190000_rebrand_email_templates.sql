-- Rebrand email templates from Borderly to travelwithydra

UPDATE public.email_templates
SET
  subject = 'Welcome to travelwithydra!',
  body_html = '<h2>Welcome to travelwithydra!</h2><p>Hello {{name}},</p><p>Thanks for joining travelwithydra — your intelligent travel companion. We''re thrilled to have you on board!</p><p>Whether you''re exploring visa requirements, checking your eligibility, or tracking applications, Hydra and the travelwithydra team are here to simplify the process for you.</p><p>If you have any questions, reach us at info@travelwithydra.com.</p><p><strong>— The travelwithydra Team</strong></p>'
WHERE template_key = 'welcome';

UPDATE public.email_templates
SET
  body_html = '<h2>Message Received</h2><p>Hello {{name}},</p><p>Thank you for contacting travelwithydra. We have received your message and will get back to you as soon as possible.</p><p><strong>— The travelwithydra Team</strong></p>'
WHERE template_key = 'contact_acknowledgement';

UPDATE public.email_templates
SET
  body_html = '<h2>Application Received</h2><p>Hello {{name}},</p><p>Thanks for submitting your visa application for {{destination}} through travelwithydra.</p><p><strong>Application ID:</strong> {{application_id}}</p><p><strong>Status:</strong> Submitted</p><p>We will notify you by email when there is an update on your application.</p><p><strong>— travelwithydra Application Team</strong></p>'
WHERE template_key = 'application_received';

UPDATE public.email_templates
SET
  body_html = '<h2>Application In Review</h2><p>Hello {{name}},</p><p>Your visa application for {{destination}} (ID: {{application_id}}) is now being reviewed by our team.</p><p>We will notify you as soon as a decision is made.</p><p><strong>— travelwithydra Application Team</strong></p>'
WHERE template_key = 'application_in_review';

UPDATE public.email_templates
SET
  body_html = '<h2>Application Approved</h2><p>Hello {{name}},</p><p>Great news! Your visa application for {{destination}} (ID: {{application_id}}) has been approved.</p><p>Log in to your travelwithydra dashboard to view your decision documents.</p><p><strong>— travelwithydra Application Team</strong></p>'
WHERE template_key = 'application_approved';

UPDATE public.email_templates
SET
  body_html = '<h2>Application Update</h2><p>Hello {{name}},</p><p>We have an update regarding your visa application for {{destination}} (ID: {{application_id}}).</p><p>Unfortunately, your application was not approved at this time. Please log in to your dashboard for details or contact info@travelwithydra.com if you have questions.</p><p><strong>— travelwithydra Application Team</strong></p>'
WHERE template_key = 'application_rejected';

UPDATE public.email_templates
SET
  subject = 'Your travelwithydra membership is now active',
  body_html = '<h2>Membership Active</h2><p>Hello {{name}},</p><p>Your travelwithydra {{subscription_tier}} membership is now active. Enjoy premium features including discounted service fees, Hydra AI assistance, and enhanced travel tools.</p><p><strong>— The travelwithydra Team</strong></p>'
WHERE template_key = 'subscription_active';
