import { ALL_COUNTRIES } from '../../utils/countries';
import { getCountryCodeFromName, getVisaRequirement } from '../../lib/api/visaRequirements';
import type { UserProfile } from '../../lib/api/userProfile';
import authService from '../../lib/api/auth';
import type { HydraRequestContext } from '../../api/ai-assistant';

export interface HydraClientContext {
  currentPath?: string;
  visaLookup?: {
    nationality: string;
    destination: string;
    requirement: string;
    stayDuration?: number;
    notes?: string;
  };
}

export function buildHydraClientContext(profile: UserProfile | null): string {
  if (!profile) return 'User is not logged in.';

  const lines = [
    `Logged in as ${profile.email || 'user'}.`,
    profile.nationality ? `Profile nationality: ${profile.nationality}.` : '',
    profile.residency ? `Profile residence: ${profile.residency}.` : '',
    profile.travel_score != null ? `Travel score: ${profile.travel_score}.` : '',
    profile.subscription_tier ? `Subscription: ${profile.subscription_tier}.` : '',
  ].filter(Boolean);

  return lines.join(' ');
}

function findCountryInText(text: string): string | null {
  const lower = text.toLowerCase();
  const aliases: Record<string, string> = {
    uk: 'GB',
    britain: 'GB',
    'united kingdom': 'GB',
    usa: 'US',
    america: 'US',
    'united states': 'US',
    uae: 'AE',
    dubai: 'AE',
  };
  for (const [alias, code] of Object.entries(aliases)) {
    if (lower.includes(alias)) return code;
  }
  for (const country of ALL_COUNTRIES) {
    if (lower.includes(country.name.toLowerCase())) return country.code;
  }
  return null;
}

/** Detect visa-related questions and pre-fetch requirement from Supabase */
export async function enrichHydraContext(
  message: string,
  profile: UserProfile | null
): Promise<HydraClientContext> {
  const context: HydraClientContext = {
    currentPath: typeof window !== 'undefined' ? window.location.pathname : undefined,
  };

  const visaKeywords =
    /\b(visa|evisa|e-visa|eta|passport|entry|travel to|visit|requirement|schengen)\b/i;
  if (!visaKeywords.test(message)) return context;

  const nationality =
    profile?.nationality && profile.nationality.length <= 3
      ? profile.nationality
      : profile?.nationality
        ? getCountryCodeFromName(profile.nationality) || profile.nationality
        : null;

  const destFromText = findCountryInText(message);
  const natFromText = findCountryInText(
    message.replace(new RegExp(ALL_COUNTRIES.find((c) => c.code === destFromText)?.name || '$$$$', 'i'), '')
  );

  const nat = natFromText || nationality;
  const dest = destFromText;

  if (nat && dest && nat !== dest) {
    try {
      const req = await getVisaRequirement(nat, dest);
      if (req && req.requirement !== 'unknown') {
        context.visaLookup = {
          nationality: req.nationality,
          destination: req.destination,
          requirement: req.requirement,
          stayDuration: req.stay_duration,
          notes: req.notes,
        };
      }
    } catch {
      // Server will attempt lookup
    }
  }

  return context;
}

/** Build full request context for Hydra API (profile, visa prefetch, auth token) */
export async function prepareHydraRequestContext(
  message: string,
  profile: UserProfile | null
): Promise<HydraRequestContext> {
  const { session } = await authService.getSession();
  const enriched = await enrichHydraContext(message, profile);

  return {
    accessToken: session?.access_token ?? null,
    clientContext: buildHydraClientContext(profile),
    hydraContext: {
      currentPath: enriched.currentPath,
      visaLookup: enriched.visaLookup,
      profileNationality: profile?.nationality,
    },
  };
}
