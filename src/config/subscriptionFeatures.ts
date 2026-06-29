/** Feature access and limits by subscription tier. */

import { normalizeSubscriptionTier } from '../lib/api/userProfile';

export type FeatureTier = 'free' | 'premium' | 'enterprise' | 'admin';

export function resolveFeatureTier(tier?: string | null): FeatureTier {
  const normalized = normalizeSubscriptionTier(tier);
  if (normalized === 'admin') return 'admin';
  if (normalized === 'enterprise') return 'enterprise';
  if (normalized === 'premium') return 'premium';
  return 'free';
}

export const SUBSCRIPTION_FEATURES = {
  travelHistory: { free: false, premium: true, enterprise: true, admin: true },
  travelAlerts: { free: false, premium: true, enterprise: true, admin: true },
  documentVault: { free: false, premium: true, enterprise: true, admin: true },
  organizationTravelers: { free: false, premium: false, enterprise: true, admin: true },
  unlimitedAi: { free: false, premium: false, enterprise: true, admin: true },
} as const;

export type SubscriptionFeature = keyof typeof SUBSCRIPTION_FEATURES;

export function hasSubscriptionFeature(
  tier: string | null | undefined,
  feature: SubscriptionFeature
): boolean {
  const key = resolveFeatureTier(tier);
  return SUBSCRIPTION_FEATURES[feature][key];
}

export const DOCUMENT_VAULT_LIMIT = {
  free: 0,
  premium: 50,
  enterprise: 500,
  admin: 500,
} as const;

export const ORGANIZATION_TRAVELER_LIMIT = {
  free: 0,
  premium: 0,
  enterprise: 500,
  admin: 500,
} as const;

export const TRAVEL_HISTORY_COUNTRY_LIMIT = {
  free: 0,
  premium: 100,
  enterprise: 500,
  admin: 500,
} as const;

export function getDocumentVaultLimit(tier?: string | null): number {
  return DOCUMENT_VAULT_LIMIT[resolveFeatureTier(tier)];
}

export function getOrganizationTravelerLimit(tier?: string | null): number {
  return ORGANIZATION_TRAVELER_LIMIT[resolveFeatureTier(tier)];
}

export function getTravelHistoryLimit(tier?: string | null): number {
  return TRAVEL_HISTORY_COUNTRY_LIMIT[resolveFeatureTier(tier)];
}

export function getMinimumTierForFeature(feature: SubscriptionFeature): 'premium' | 'enterprise' {
  if (feature === 'organizationTravelers') return 'enterprise';
  return 'premium';
}
