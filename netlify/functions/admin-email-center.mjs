import {
  getServiceClient,
  verifyAdmin,
  sendRenderedEmail,
  sendTemplateEmail,
  renderTemplate,
  getTemplate,
  jsonResponse,
  handleOptions,
} from './admin-shared.mjs';

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

async function listMembers(supabase, filters = {}) {
  let query = supabase
    .from('profiles')
    .select('id, email, full_name, nationality, residency, subscription_tier, created_at, questionnaire_completed')
    .order('created_at', { ascending: false });

  if (filters.nationality) {
    query = query.ilike('nationality', `%${filters.nationality}%`);
  }
  if (filters.residency) {
    query = query.ilike('residency', `%${filters.residency}%`);
  }
  if (filters.subscription_tier && filters.subscription_tier !== 'all') {
    query = query.eq('subscription_tier', filters.subscription_tier);
  }

  const { data, error } = await query.limit(500);
  if (error) throw error;
  return data ?? [];
}

async function listTemplates(supabase) {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function saveTemplate(supabase, template) {
  const { slug, name, subject, html_body, description } = template;
  if (!slug || !name || !subject || !html_body) {
    throw new Error('slug, name, subject, and html_body are required');
  }

  const { data, error } = await supabase
    .from('email_templates')
    .upsert({
      slug,
      name,
      subject,
      html_body,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function listInbound(supabase, status = 'all') {
  let query = supabase
    .from('inbound_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function replyInbound(supabase, adminId, payload) {
  const { messageId, replyBody, subject } = payload;
  if (!messageId || !replyBody?.trim()) {
    throw new Error('messageId and replyBody are required');
  }

  const { data: inbound, error: fetchError } = await supabase
    .from('inbound_messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (fetchError) throw fetchError;

  const replySubject = subject?.trim() || `Re: ${inbound.subject || 'Your message to travelwithydra'}`;
  const html = `
    <p>${String(replyBody).replace(/\n/g, '<br>')}</p>
    <hr>
    <p style="color:#666;font-size:12px;">On ${new Date(inbound.created_at).toLocaleString()}, ${inbound.sender_name || inbound.sender_email} wrote:</p>
    <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555;">${String(inbound.body).replace(/\n/g, '<br>')}</blockquote>
  `;

  await sendRenderedEmail({
    supabase,
    to: inbound.sender_email,
    subject: replySubject,
    html,
    sentBy: 'admin',
    adminId,
  });

  const { data: updated, error: updateError } = await supabase
    .from('inbound_messages')
    .update({
      status: 'replied',
      admin_reply: replyBody.trim(),
      replied_at: new Date().toISOString(),
      replied_by: adminId,
    })
    .eq('id', messageId)
    .select('*')
    .single();

  if (updateError) throw updateError;
  return updated;
}

async function sendBulkEmail(supabase, adminId, payload) {
  const {
    filters = {},
    subject,
    html,
    templateSlug,
    selectedUserIds = [],
    useFilters = true,
  } = payload;

  let recipients = [];

  if (selectedUserIds.length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, nationality, residency, subscription_tier')
      .in('id', selectedUserIds);
    if (error) throw error;
    recipients = data ?? [];
  } else if (useFilters) {
    recipients = await listMembers(supabase, filters);
  }

  recipients = recipients.filter((profile) => profile.email);

  if (recipients.length === 0) {
    throw new Error('No recipients matched your filters');
  }

  let template = null;
  if (templateSlug) {
    template = await getTemplate(supabase, templateSlug);
    if (!template) {
      throw new Error(`Template not found: ${templateSlug}`);
    }
  }

  if (!template && (!subject?.trim() || !html?.trim())) {
    throw new Error('Provide subject and html, or choose a template');
  }

  const results = [];
  for (const profile of recipients) {
    const variables = {
      name: profile.full_name || 'there',
      email: profile.email,
      nationality: profile.nationality || '',
      residency: profile.residency || '',
      subscription_tier: profile.subscription_tier || 'free',
    };

    const rendered = template
      ? renderTemplate(template, variables)
      : { subject: subject.trim(), html: html.trim().replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '') };

    await sendRenderedEmail({
      supabase,
      to: profile.email,
      subject: rendered.subject,
      html: rendered.html,
      templateSlug: templateSlug || null,
      recipientUserId: profile.id,
      sentBy: 'admin',
      adminId,
    });

    results.push(profile.email);
  }

  return { sent: results.length, recipients: results };
}

async function listEmailLog(supabase) {
  const { data, error } = await supabase
    .from('email_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return jsonResponse(401, { error: 'Missing authorization token' });
    }

    const adminCheck = await verifyAdmin(token);
    if (!adminCheck.ok) {
      return jsonResponse(adminCheck.status, { error: adminCheck.message });
    }

    const supabase = getServiceClient();
    const adminId = adminCheck.user.id;

    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const action = params.action || 'list_members';

      switch (action) {
        case 'list_members':
          return jsonResponse(200, {
            members: await listMembers(supabase, {
              nationality: params.nationality,
              residency: params.residency,
              subscription_tier: params.subscription_tier,
              search: params.search,
            }),
          });
        case 'list_templates':
          return jsonResponse(200, { templates: await listTemplates(supabase) });
        case 'list_inbound':
          return jsonResponse(200, { messages: await listInbound(supabase, params.status || 'all') });
        case 'list_email_log':
          return jsonResponse(200, { emails: await listEmailLog(supabase) });
        default:
          return jsonResponse(400, { error: 'Unknown action' });
      }
    }

    if (event.httpMethod !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' });
    }

    const body = parseBody(event);
    const action = body.action;

    switch (action) {
      case 'save_template':
        return jsonResponse(200, {
          template: await saveTemplate(supabase, body.template),
        });
      case 'reply_inbound':
        return jsonResponse(200, {
          message: await replyInbound(supabase, adminId, body),
        });
      case 'mark_inbound_read': {
        const { error } = await supabase
          .from('inbound_messages')
          .update({ status: 'read' })
          .eq('id', body.messageId);
        if (error) throw error;
        return jsonResponse(200, { success: true });
      }
      case 'send_bulk':
        return jsonResponse(200, {
          result: await sendBulkEmail(supabase, adminId, body),
        });
      case 'send_single': {
        const { email, subject, html, templateSlug, variables = {} } = body;
        if (!email) throw new Error('email is required');

        if (templateSlug) {
          await sendTemplateEmail({
            supabase,
            slug: templateSlug,
            to: email,
            variables,
            sentBy: 'admin',
            adminId,
          });
        } else {
          await sendRenderedEmail({
            supabase,
            to: email,
            subject,
            html,
            sentBy: 'admin',
            adminId,
          });
        }
        return jsonResponse(200, { success: true });
      }
      default:
        return jsonResponse(400, { error: 'Unknown action' });
    }
  } catch (error) {
    console.error('admin-email-center error:', error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Admin email center failed',
    });
  }
}
