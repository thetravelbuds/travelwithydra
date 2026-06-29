/** Server-side subscription caps (mirrors src/config/subscriptionLimits.ts). */

const APPLICATION_LIMIT_BY_TIER = {
  free: null,
  premium: 50,
  enterprise: 100,
  admin: null,
};

export function normalizeSubscriptionTier(tier) {
  const value = (tier || 'free').toLowerCase();
  if (value === 'admin') return 'admin';
  if (value === 'enterprise' || value === 'business') return 'enterprise';
  if (value === 'premium' || value === 'monthly' || value === 'lifetime') return 'premium';
  return 'free';
}

export function getApplicationLimitForTier(tier) {
  const normalized = normalizeSubscriptionTier(tier);
  if (normalized === 'admin') return null;
  return APPLICATION_LIMIT_BY_TIER[normalized] ?? null;
}

export function countSubmittedApplications(rows) {
  return (rows || []).filter((row) => {
    const data = row.application_data;
    if (!data) return true;
    if (typeof data === 'object' && data.draft === true) return false;
    return true;
  }).length;
}

export function getApplicationLimitExceededMessage(limit) {
  const email =
    process.env.CONTACT_EMAIL ||
    process.env.VITE_CONTACT_EMAIL ||
    process.env.EMAIL_FROM_EMAIL ||
    'info@travelwithydra.com';
  return `You have reached the maximum of ${limit} visa applications on your plan. Please contact customer service at ${email} for assistance.`;
}

export async function assertApplicationWithinLimit(supabase, userId, tier) {
  const limit = getApplicationLimitForTier(tier);
  if (limit === null) return null;

  const { data, error } = await supabase
    .from('visa_applications')
    .select('id, application_data')
    .eq('user_id', userId);

  if (error) throw error;

  const count = countSubmittedApplications(data);
  if (count >= limit) {
    return getApplicationLimitExceededMessage(limit);
  }

  return null;
}
