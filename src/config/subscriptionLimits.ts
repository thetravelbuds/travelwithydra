/** Internal subscription caps — not shown on marketing pages. */

import { normalizeSubscriptionTier } from '../lib/api/userProfile';
import type { VisaApplication } from '../types/visa';
import { getCompanyEmail } from './companyContact';

/** Max submitted (non-draft) visa applications per account. */
export const APPLICATION_LIMIT_BY_TIER: Record<string, number | null> = {
  free: null,
  premium: 50,
  enterprise: 100,
  admin: null,
};

export function getApplicationLimitForTier(tier?: string | null): number | null {
  const normalized = normalizeSubscriptionTier(tier);
  if (normalized === 'admin') return null;
  return APPLICATION_LIMIT_BY_TIER[normalized] ?? null;
}

/** Count applications that consume the plan quota (excludes in-progress drafts). */
export function countSubmittedApplications(applications: VisaApplication[]): number {
  return applications.filter((app) => app.application_data?.draft !== true).length;
}

export interface ApplicationLimitCheck {
  allowed: boolean;
  limit: number | null;
  count: number;
  message?: string;
}

export function getApplicationLimitExceededMessage(limit: number): string {
  return `You have reached the maximum of ${limit} visa applications on your plan. Please contact customer service at ${getCompanyEmail()} for assistance.`;
}

export function checkApplicationLimit(options: {
  tier?: string | null;
  applications: VisaApplication[];
}): ApplicationLimitCheck {
  const limit = getApplicationLimitForTier(options.tier);
  const count = countSubmittedApplications(options.applications);

  if (limit === null) {
    return { allowed: true, limit: null, count };
  }

  if (count >= limit) {
    return {
      allowed: false,
      limit,
      count,
      message: getApplicationLimitExceededMessage(limit),
    };
  }

  return { allowed: true, limit, count };
}
