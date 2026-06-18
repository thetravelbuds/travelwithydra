import authService from './auth';

export interface EmailTemplate {
  slug: string;
  name: string;
  subject: string;
  html_body: string;
  description?: string | null;
  updated_at?: string;
}

export interface InboundMessage {
  id: string;
  source: string;
  sender_name: string | null;
  sender_email: string;
  subject: string | null;
  body: string;
  status: 'unread' | 'read' | 'replied';
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export interface EmailLogEntry {
  id: string;
  recipient_email: string;
  subject: string;
  template_slug: string | null;
  sent_by: string;
  created_at: string;
}

async function getAccessToken(): Promise<string | null> {
  const { session } = await authService.getSession();
  return session?.access_token ?? null;
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

export const adminEmailService = {
  async listTemplates(): Promise<{ templates: EmailTemplate[]; error: Error | null }> {
    try {
      const data = await adminFetch('/.netlify/functions/admin-email-center?action=list_templates');
      return { templates: data.templates ?? [], error: null };
    } catch (error) {
      return { templates: [], error: error as Error };
    }
  },

  async saveTemplate(template: EmailTemplate): Promise<{ template: EmailTemplate | null; error: Error | null }> {
    try {
      const data = await adminFetch('/.netlify/functions/admin-email-center', {
        method: 'POST',
        body: JSON.stringify({ action: 'save_template', template }),
      });
      return { template: data.template ?? null, error: null };
    } catch (error) {
      return { template: null, error: error as Error };
    }
  },

  async listInbound(status = 'all'): Promise<{ messages: InboundMessage[]; error: Error | null }> {
    try {
      const data = await adminFetch(
        `/.netlify/functions/admin-email-center?action=list_inbound&status=${encodeURIComponent(status)}`
      );
      return { messages: data.messages ?? [], error: null };
    } catch (error) {
      return { messages: [], error: error as Error };
    }
  },

  async replyInbound(messageId: string, replyBody: string, subject?: string) {
    try {
      const data = await adminFetch('/.netlify/functions/admin-email-center', {
        method: 'POST',
        body: JSON.stringify({ action: 'reply_inbound', messageId, replyBody, subject }),
      });
      return { message: data.message, error: null };
    } catch (error) {
      return { message: null, error: error as Error };
    }
  },

  async markInboundRead(messageId: string) {
    try {
      await adminFetch('/.netlify/functions/admin-email-center', {
        method: 'POST',
        body: JSON.stringify({ action: 'mark_inbound_read', messageId }),
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  async sendBulkEmail(payload: {
    filters?: Record<string, string>;
    subject?: string;
    html?: string;
    templateSlug?: string;
    selectedUserIds?: string[];
    useFilters?: boolean;
  }) {
    try {
      const data = await adminFetch('/.netlify/functions/admin-email-center', {
        method: 'POST',
        body: JSON.stringify({ action: 'send_bulk', ...payload }),
      });
      return { result: data.result, error: null };
    } catch (error) {
      return { result: null, error: error as Error };
    }
  },

  async listEmailLog() {
    try {
      const data = await adminFetch('/.netlify/functions/admin-email-center?action=list_email_log');
      return { emails: (data.emails ?? []) as EmailLogEntry[], error: null };
    } catch (error) {
      return { emails: [], error: error as Error };
    }
  },
};

export default adminEmailService;
