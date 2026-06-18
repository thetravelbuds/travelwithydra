import React, { useEffect, useState } from 'react';
import adminEmailService, { EmailTemplate, InboundMessage } from '../../lib/api/adminEmail';
import adminMembersService, { AdminMember } from '../../lib/api/adminMembers';
import { ALL_COUNTRIES } from '../../utils/countries';

type EmailTab = 'templates' | 'inbox' | 'compose';

const TEMPLATE_VARIABLES =
  '{{name}}, {{email}}, {{destination}}, {{nationality}}, {{application_id}}, {{status}}, {{subscription_tier}}, {{residency}}';

const AdminEmailCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EmailTab>('templates');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [inbound, setInbound] = useState<InboundMessage[]>([]);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<InboundMessage | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [composeSubject, setComposeSubject] = useState('');
  const [composeHtml, setComposeHtml] = useState('');
  const [composeTemplateSlug, setComposeTemplateSlug] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterNationality, setFilterNationality] = useState('');
  const [filterResidency, setFilterResidency] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const loadTemplates = async () => {
    const { templates: rows, error: loadError } = await adminEmailService.listTemplates();
    if (loadError) setError(loadError.message);
    else setTemplates(rows);
  };

  const loadInbound = async () => {
    const { messages, error: loadError } = await adminEmailService.listInbound('all');
    if (loadError) setError(loadError.message);
    else setInbound(messages);
  };

  const loadMembers = async () => {
    const { members: rows, error: loadError } = await adminMembersService.listMembers({
      subscription_tier: filterTier === 'all' ? undefined : filterTier,
      nationality: filterNationality || undefined,
      residency: filterResidency || undefined,
    });
    if (loadError) setError(loadError.message);
    else setMembers(rows);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const load = async () => {
      if (activeTab === 'templates') await loadTemplates();
      if (activeTab === 'inbox') await loadInbound();
      if (activeTab === 'compose') {
        await loadTemplates();
        await loadMembers();
      }
      setLoading(false);
    };
    void load();
  }, [activeTab, filterTier, filterNationality, filterResidency]);

  const saveTemplate = async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    const { error: saveError } = await adminEmailService.saveTemplate(selectedTemplate);
    setLoading(false);
    if (saveError) setError(saveError.message);
    else {
      setMessage('Template saved.');
      await loadTemplates();
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyBody.trim()) return;
    setLoading(true);
    const { error: replyError } = await adminEmailService.replyInbound(
      selectedMessage.id,
      replyBody.trim()
    );
    setLoading(false);
    if (replyError) setError(replyError.message);
    else {
      setMessage('Reply sent.');
      setReplyBody('');
      setSelectedMessage(null);
      await loadInbound();
    }
  };

  const sendBulk = async () => {
    setLoading(true);
    setError(null);
    const { result, error: sendError } = await adminEmailService.sendBulkEmail({
      filters: {
        subscription_tier: filterTier === 'all' ? '' : filterTier,
        nationality: filterNationality,
        residency: filterResidency,
      },
      subject: composeSubject,
      html: composeHtml,
      templateSlug: composeTemplateSlug || undefined,
      selectedUserIds: selectedMemberIds,
      useFilters: selectedMemberIds.length === 0,
    });
    setLoading(false);
    if (sendError) setError(sendError.message);
    else setMessage(`Sent ${result?.sent ?? 0} email(s).`);
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {(['templates', 'inbox', 'compose'] as EmailTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize ${
              activeTab === tab ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {message && (
        <div className="rounded border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      {activeTab === 'templates' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold">Email templates</h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.slug}
                  type="button"
                  onClick={() => setSelectedTemplate({ ...template })}
                  className={`block w-full rounded-md border px-4 py-3 text-left ${
                    selectedTemplate?.slug === template.slug
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium">{template.name}</p>
                  <p className="text-xs text-gray-500">{template.slug}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-2 text-lg font-semibold">Edit template</h3>
            <p className="mb-4 text-xs text-gray-500">Variables: {TEMPLATE_VARIABLES}</p>
            {selectedTemplate ? (
              <div className="space-y-3">
                <input
                  value={selectedTemplate.name}
                  onChange={(event) =>
                    setSelectedTemplate({ ...selectedTemplate, name: event.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Template name"
                />
                <input
                  value={selectedTemplate.subject}
                  onChange={(event) =>
                    setSelectedTemplate({ ...selectedTemplate, subject: event.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Subject"
                />
                <textarea
                  value={selectedTemplate.html_body}
                  onChange={(event) =>
                    setSelectedTemplate({ ...selectedTemplate, html_body: event.target.value })
                  }
                  rows={12}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
                  placeholder="HTML body"
                />
                <textarea
                  value={selectedTemplate.description || ''}
                  onChange={(event) =>
                    setSelectedTemplate({ ...selectedTemplate, description: event.target.value })
                  }
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Description"
                />
                <button
                  type="button"
                  onClick={saveTemplate}
                  className="rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
                >
                  Save template
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a template to edit.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold">Messages to travelwithydra</h3>
            <div className="max-h-[520px] space-y-2 overflow-y-auto">
              {inbound.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedMessage(item);
                    void adminEmailService.markInboundRead(item.id);
                  }}
                  className={`block w-full rounded-md border px-4 py-3 text-left ${
                    selectedMessage?.id === item.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{item.sender_name || item.sender_email}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        item.status === 'unread'
                          ? 'bg-red-100 text-red-700'
                          : item.status === 'replied'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{item.subject}</p>
                  <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                </button>
              ))}
              {inbound.length === 0 && (
                <p className="text-sm text-gray-500">No inbound messages yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold">Reply</h3>
            {selectedMessage ? (
              <div className="space-y-4">
                <div className="rounded-md bg-gray-50 p-4 text-sm">
                  <p><strong>From:</strong> {selectedMessage.sender_name} ({selectedMessage.sender_email})</p>
                  <p><strong>Subject:</strong> {selectedMessage.subject}</p>
                  <p className="mt-2 whitespace-pre-wrap">{selectedMessage.body}</p>
                </div>
                {selectedMessage.admin_reply && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm">
                    <p className="font-medium">Previous reply</p>
                    <p className="whitespace-pre-wrap">{selectedMessage.admin_reply}</p>
                  </div>
                )}
                <textarea
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                  rows={8}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Write your reply..."
                />
                <button
                  type="button"
                  onClick={sendReply}
                  className="rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
                >
                  Send reply
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a message to reply.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'compose' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold">Recipients</h3>
            <div className="mb-4 grid gap-3">
              <select
                value={filterTier}
                onChange={(event) => setFilterTier(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">All tiers</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <select
                value={filterNationality}
                onChange={(event) => setFilterNationality(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All nationalities</option>
                {ALL_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.name}>{country.name}</option>
                ))}
              </select>
              <select
                value={filterResidency}
                onChange={(event) => setFilterResidency(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All residences</option>
                {ALL_COUNTRIES.map((country) => (
                  <option key={`res-${country.code}`} value={country.name}>{country.name}</option>
                ))}
              </select>
            </div>
            <p className="mb-2 text-xs text-gray-500">
              Select specific users below, or leave none selected to email everyone matching filters.
            </p>
            <div className="max-h-72 space-y-1 overflow-y-auto rounded border border-gray-200 p-2">
              {members.map((member) => (
                <label key={member.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(member.id)}
                    onChange={() => toggleMember(member.id)}
                  />
                  <span>{member.full_name || member.email} ({member.subscription_tier})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold">Compose email</h3>
            <div className="space-y-3">
              <select
                value={composeTemplateSlug}
                onChange={(event) => setComposeTemplateSlug(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Custom email (no template)</option>
                {templates.map((template) => (
                  <option key={template.slug} value={template.slug}>{template.name}</option>
                ))}
              </select>
              {!composeTemplateSlug && (
                <>
                  <input
                    value={composeSubject}
                    onChange={(event) => setComposeSubject(event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Subject"
                  />
                  <textarea
                    value={composeHtml}
                    onChange={(event) => setComposeHtml(event.target.value)}
                    rows={10}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="HTML body. Use {{name}}, {{nationality}}, {{residency}}, etc."
                  />
                </>
              )}
              <button
                type="button"
                onClick={sendBulk}
                className="rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
              >
                Send email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailCenter;
