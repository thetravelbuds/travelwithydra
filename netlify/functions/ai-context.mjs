import { getServiceClient } from './admin-shared.mjs';

/** Core travelwithydra platform knowledge for Hydra */
export const SITE_KNOWLEDGE = `
TRAVELWITHYDRA PLATFORM (travelwithydra.com)
- Brand: travelwithydra — intelligent travel platform
- AI assistant name: Hydra (you). You help users navigate the site and answer travel/visa questions using platform data when provided.
- Contact: info@travelwithydra.com

KEY PAGES & ROUTES (always link with full paths like /visa-checker):
- / — Home with visa checker widget and travel score CTA
- /visa-checker — Check visa requirements for any nationality → destination
- /travel-score or /questionnaire — Calculate travel score (passport + residence + travel history)
- /dashboard — User hub: travel score, recommended destinations, travel history, world map
- /world-map or /dashboard/world-map — Interactive map; visited countries highlighted
- /map/passport/:code — Country mobility hub (e.g. /map/passport/gb)
- /visa/:countryCode — Destination visa product page & eVisa application (e.g. /visa/tr for Turkey)
- /visa/apply/:nationality/:destination — Start eVisa application
- /assistant — Full-page Hydra chat
- /pricing — Basic (free), Premium (£9.98/mo), Enterprise (£19.98/mo)
- /blogs — Travel blogs; filters: ?category=visa-tips, destinations, travel-guides
- /contact — Contact form
- /settings — Profile, nationality, residence
- /subscription — Manage subscription

FEATURES:
- Visa Requirement Checker: nationality + destination → requirement type (visa-free, eVisa, ETA, visa-on-arrival, visa-required)
- Travel Score: based on passport strength, country of residence, and travel history credibility bonus (Schengen/UK/US/AU/NZ/Japan visits)
- eVisa Applications: online applications for supported destinations (Turkey, India, Vietnam, Egypt, etc.) at /visa/:code
- Schengen & US visa application flows on platform for eligible users
- Pakistani + UK residence facilitation data for select destinations
- Hydra AI: 25 messages/day (free & premium), unlimited on Enterprise

PRICING HIGHLIGHTS:
- Basic: free — visa checker, travel score, world map, Hydra AI (daily limit)
- Premium: eVisa fee discounts 10–20%, travel alerts, priority support
- Enterprise: unlimited Hydra, dedicated support, higher eVisa discounts

RULES FOR ANSWERS:
- Prefer DATA FROM CONTEXT blocks over general knowledge when provided
- For visa requirements, cite the requirement type and max stay from context; link to /visa-checker or /visa/:code
- For account-specific questions, use USER CONTEXT (profile, applications, trips)
- Never invent visa requirements — if data missing, direct user to /visa-checker
- Keep answers concise (2–4 sentences). One follow-up question max when info is missing
- Use markdown links: [text](/path) for internal pages
`;

const COUNTRY_ALIASES = {
  uk: 'GB',
  britain: 'GB',
  'united kingdom': 'GB',
  england: 'GB',
  usa: 'US',
  america: 'US',
  'united states': 'US',
  uae: 'AE',
  dubai: 'AE',
  schengen: 'EU',
  eu: 'EU',
  pakistan: 'PK',
  turkey: 'TR',
  india: 'IN',
  thailand: 'TH',
  vietnam: 'VN',
  egypt: 'EG',
  canada: 'CA',
  australia: 'AU',
  japan: 'JP',
  china: 'CN',
  germany: 'DE',
  france: 'FR',
  spain: 'ES',
  italy: 'IT',
};

const CODE_TO_NAME = {
  GB: 'United Kingdom',
  US: 'United States',
  PK: 'Pakistan',
  TR: 'Turkey',
  IN: 'India',
  TH: 'Thailand',
  VN: 'Vietnam',
  EG: 'Egypt',
  CA: 'Canada',
  AU: 'Australia',
  JP: 'Japan',
  CN: 'China',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  AE: 'United Arab Emirates',
  NZ: 'New Zealand',
  SG: 'Singapore',
  MY: 'Malaysia',
  ID: 'Indonesia',
  LK: 'Sri Lanka',
  BD: 'Bangladesh',
  SA: 'Saudi Arabia',
  ZA: 'South Africa',
  BR: 'Brazil',
  MX: 'Mexico',
  KR: 'South Korea',
  NL: 'Netherlands',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  PT: 'Portugal',
  GR: 'Greece',
  PL: 'Poland',
  CZ: 'Czech Republic',
  HU: 'Hungary',
  RO: 'Romania',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  IE: 'Ireland',
};

function normalizeRequirement(raw) {
  if (!raw) return 'unknown';
  const v = String(raw).toLowerCase().replace(/\s+/g, '-');
  if (v === 'e-visa' || v === 'evisa') return 'evisa';
  if (v === 'visa-free' || v === 'visa free') return 'visa-free';
  if (v === 'visa-on-arrival' || v === 'voa') return 'visa-on-arrival';
  if (v === 'eta' || v === 'e-visa/eta') return 'eta';
  if (v === 'visa-required' || v === 'visa required') return 'visa-required';
  return v;
}

function resolveCountryCode(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();
  if (COUNTRY_ALIASES[lower]) return COUNTRY_ALIASES[lower];
  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) {
    if (lower.includes(alias)) return code;
  }
  for (const [code, name] of Object.entries(CODE_TO_NAME)) {
    if (name.toLowerCase() === lower || lower.includes(name.toLowerCase())) return code;
  }
  return null;
}

/** Extract nationality and destination from user message */
export function extractVisaPair(message, defaultNationality = null) {
  const text = message.toLowerCase();
  const found = [];

  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) {
    if (text.includes(alias)) found.push({ code, alias });
  }
  for (const [code, name] of Object.entries(CODE_TO_NAME)) {
    if (text.includes(name.toLowerCase())) found.push({ code, alias: name.toLowerCase() });
  }

  const unique = [...new Map(found.map((f) => [f.code, f])).values()];

  let nationality = defaultNationality ? resolveCountryCode(defaultNationality) : null;
  let destination = null;

  const toMatch = text.match(/\b(?:to|visit|travel(?:ing)?\s+to|going\s+to|enter)\s+([a-z\s]+?)(?:\?|$|\.|,| with| for)/i);
  const fromMatch = text.match(/\b(?:from|as\s+a?)\s+([a-z\s]+?)(?:\s+(?:citizen|passport|national)|\s+to|\?|$|\.|,)/i);
  const passportMatch = text.match(/([a-z\s]+?)\s+passport/i);

  if (fromMatch) nationality = resolveCountryCode(fromMatch[1].trim()) || nationality;
  if (passportMatch) nationality = resolveCountryCode(passportMatch[1].trim()) || nationality;
  if (toMatch) destination = resolveCountryCode(toMatch[1].trim());

  if (!destination && unique.length >= 1) {
    destination = unique[unique.length - 1].code;
  }
  if (!nationality && unique.length >= 2) {
    nationality = unique[0].code;
    destination = unique[unique.length - 1].code;
  } else if (!nationality && unique.length === 1 && !destination) {
    destination = unique[0].code;
  }

  if (nationality === destination && unique.length >= 2) {
    nationality = unique[0].code;
    destination = unique[unique.length - 1].code;
  }

  return { nationality, destination };
}

export async function lookupVisaRequirement(supabase, nationalityCode, destinationCode) {
  if (!nationalityCode || !destinationCode) return null;

  const nat = nationalityCode.toLowerCase();
  const dest = destinationCode.toLowerCase();

  try {
    const { data, error } = await supabase
      .from('visa_requirements')
      .select('requirement, stay_duration, notes')
      .eq('nationality', nat)
      .eq('destination', dest)
      .maybeSingle();

    if (!error && data) {
      return {
        source: 'database',
        nationality: CODE_TO_NAME[nationalityCode.toUpperCase()] || nationalityCode,
        destination: CODE_TO_NAME[destinationCode.toUpperCase()] || destinationCode,
        requirement: data.requirement,
        stayDuration: data.stay_duration,
        notes: data.notes,
      };
    }
  } catch (e) {
    console.warn('Supabase visa lookup failed:', e.message);
  }

  return null;
}

export async function fetchUserContext(accessToken) {
  if (!accessToken) return null;

  try {
    const supabase = getServiceClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData?.user) return null;

    const userId = userData.user.id;

    const [profileRes, appsRes, tripsRes, historyRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, nationality, residency, travel_score, subscription_tier, questionnaire_completed')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('visa_applications')
        .select('destination_name, destination_code, status, visa_type, application_date')
        .eq('user_id', userId)
        .order('application_date', { ascending: false })
        .limit(5),
      supabase
        .from('upcoming_trips')
        .select('destination, start_date, end_date, status')
        .eq('user_id', userId)
        .order('start_date', { ascending: true })
        .limit(5),
      supabase
        .from('travel_history')
        .select('country, entry_date, exit_date, purpose')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .limit(10),
    ]);

    return {
      email: userData.user.email,
      profile: profileRes.data,
      recentApplications: appsRes.data || [],
      upcomingTrips: tripsRes.data || [],
      travelHistory: historyRes.data || [],
    };
  } catch (e) {
    console.warn('fetchUserContext failed:', e.message);
    return null;
  }
}

export function buildContextPrompt({ userContext, clientContext, visaLookup }) {
  const sections = [];

  if (userContext?.profile) {
    const p = userContext.profile;
    sections.push(`USER CONTEXT (logged-in account):
- Name: ${p.full_name || 'Not set'}
- Nationality: ${p.nationality || 'Not set'}
- Country of residence: ${p.residency || 'Not set'}
- Travel score: ${p.travel_score ?? 'Not calculated'}
- Plan: ${p.subscription_tier || 'free'}
- Questionnaire completed: ${p.questionnaire_completed ? 'yes' : 'no'}`);
  }

  if (userContext?.recentApplications?.length) {
    const apps = userContext.recentApplications
      .map((a) => `  • ${a.destination_name || a.destination_code}: ${a.status} (${a.visa_type || 'visa'})`)
      .join('\n');
    sections.push(`RECENT VISA APPLICATIONS:\n${apps}`);
  }

  if (userContext?.upcomingTrips?.length) {
    const trips = userContext.upcomingTrips
      .map((t) => `  • ${t.destination}: ${t.start_date?.slice(0, 10) || 'TBD'} (${t.status})`)
      .join('\n');
    sections.push(`UPCOMING TRIPS:\n${trips}`);
  }

  if (userContext?.travelHistory?.length) {
    const hist = userContext.travelHistory
      .map((h) => `  • ${h.country}${h.entry_date ? ` (${h.entry_date.slice(0, 10)})` : ''}`)
      .join('\n');
    sections.push(`TRAVEL HISTORY:\n${hist}`);
  }

  if (clientContext) {
    sections.push(`CLIENT CONTEXT:\n${clientContext}`);
  }

  if (visaLookup) {
    sections.push(`VISA REQUIREMENT DATA (from travelwithydra database — use this):
- Passport: ${visaLookup.nationality}
- Destination: ${visaLookup.destination}
- Requirement: ${visaLookup.requirement}
- Max stay: ${visaLookup.stayDuration ? `${visaLookup.stayDuration} days` : 'See destination page'}
${visaLookup.notes ? `- Notes: ${visaLookup.notes}` : ''}
- Apply/check: /visa-checker or /visa/${(visaLookup.destinationCode || '').toLowerCase()}`);
  }

  return sections.length ? `\n--- LIVE CONTEXT ---\n${sections.join('\n\n')}\n--- END CONTEXT ---` : '';
}
