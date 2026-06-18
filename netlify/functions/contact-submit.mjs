import {
  getServiceClient,
  getCompanyEmail,
  sendRenderedEmail,
  sendTemplateEmail,
  jsonResponse,
  handleOptions,
} from './admin-shared.mjs';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { name, email, subject, message } = body;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return jsonResponse(400, { error: 'All fields are required' });
    }

    const supabase = getServiceClient();

    const { data: inbound, error: insertError } = await supabase
      .from('inbound_messages')
      .insert({
        source: 'contact_form',
        sender_name: name.trim(),
        sender_email: email.trim().toLowerCase(),
        subject: subject.trim(),
        body: message.trim(),
        status: 'unread',
      })
      .select('*')
      .single();

    if (insertError && insertError.code !== '42P01') {
      throw insertError;
    }

    const companyEmail = getCompanyEmail();
    const companyHtml = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${String(message).replace(/\n/g, '<br>')}</p>
    `;

    await sendRenderedEmail({
      supabase,
      to: companyEmail,
      subject: `New Contact Form: ${subject}`,
      html: companyHtml,
      sentBy: 'system',
    });

    try {
      await sendTemplateEmail({
        supabase,
        slug: 'contact_acknowledgement',
        to: email.trim(),
        variables: { name: name.trim(), email: email.trim() },
        sentBy: 'system',
      });
    } catch (templateError) {
      console.warn('contact_acknowledgement template send failed:', templateError);
    }

    return jsonResponse(200, {
      success: true,
      messageId: inbound?.id ?? null,
    });
  } catch (error) {
    console.error('contact-submit error:', error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Failed to submit contact form',
    });
  }
}
