-- Refresh welcome copy with Hydra branding (templates already use travelwithydra from seed migration)

UPDATE public.email_templates
SET
  html_body = '<h2>Welcome to travelwithydra!</h2><p>Hello {{name}},</p><p>Thanks for joining travelwithydra — your intelligent travel companion. We''re thrilled to have you on board!</p><p>Whether you''re exploring visa requirements, checking your eligibility, or tracking applications, Hydra and the travelwithydra team are here to simplify the process for you.</p><p>If you have any questions, reach us at info@travelwithydra.com.</p><p><strong>— The travelwithydra Team</strong></p>'
WHERE slug = 'welcome';

UPDATE public.email_templates
SET
  html_body = '<h2>Membership Active</h2><p>Hello {{name}},</p><p>Your travelwithydra {{subscription_tier}} membership is now active. Enjoy premium features including discounted service fees, Hydra AI assistance, and enhanced travel tools.</p><p><strong>— The travelwithydra Team</strong></p>'
WHERE slug = 'membership_upgraded';
