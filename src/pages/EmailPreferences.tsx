import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BRAND_EMAIL, PLATFORM_NAME } from '../config/brand';

interface PrefsState {
  email: string;
  name: string;
  application_emails_enabled: boolean;
  promotional_emails_enabled: boolean;
}

const EmailPreferences: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const optout = searchParams.get('optout');

  const [prefs, setPrefs] = useState<PrefsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('This preferences link is invalid.');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        if (optout === 'promotional' || optout === 'application') {
          const res = await fetch('/.netlify/functions/email-preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, optout }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Could not update preferences');
          setPrefs({
            email: '',
            name: '',
            application_emails_enabled: data.application_emails_enabled,
            promotional_emails_enabled: data.promotional_emails_enabled,
          });
          setSaved(true);
          setLoading(false);
          return;
        }

        const res = await fetch(
          `/.netlify/functions/email-preferences?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load preferences');
        setPrefs({
          email: data.email,
          name: data.name,
          application_emails_enabled: data.application_emails_enabled,
          promotional_emails_enabled: data.promotional_emails_enabled,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, optout]);

  const handleSave = async () => {
    if (!token || !prefs) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/.netlify/functions/email-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          application_emails_enabled: prefs.application_emails_enabled,
          promotional_emails_enabled: prefs.promotional_emails_enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save preferences');
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">Email preferences</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage notifications from {PLATFORM_NAME} ({BRAND_EMAIL}).
        </p>

        {loading && <p className="mt-6 text-gray-500">Loading…</p>}

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {!loading && prefs && (
          <div className="mt-6 space-y-5">
            {prefs.email && (
              <p className="text-sm text-gray-600">
                Signed in as <strong>{prefs.email}</strong>
              </p>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600"
                checked={prefs.application_emails_enabled}
                onChange={(e) =>
                  setPrefs((p) =>
                    p ? { ...p, application_emails_enabled: e.target.checked } : p
                  )
                }
              />
              <span>
                <span className="font-medium text-gray-900">Application updates</span>
                <span className="block text-sm text-gray-500">
                  Submitted, payment confirmed, in review, approved, or rejected.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600"
                checked={prefs.promotional_emails_enabled}
                onChange={(e) =>
                  setPrefs((p) =>
                    p ? { ...p, promotional_emails_enabled: e.target.checked } : p
                  )
                }
              />
              <span>
                <span className="font-medium text-gray-900">Promotions & offers</span>
                <span className="block text-sm text-gray-500">
                  Discount codes, new eVisa destinations, and travel tips.
                </span>
              </span>
            </label>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save preferences'}
            </button>

            {saved && (
              <p className="text-sm text-green-700">Your email preferences have been saved.</p>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          <Link to="/" className="text-teal-600 hover:underline">
            Back to {PLATFORM_NAME}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default EmailPreferences;
