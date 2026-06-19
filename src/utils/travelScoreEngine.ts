import { PASSPORT_SCORES, ALL_COUNTRIES } from './countries';
import { getVisaRequirementsForNationalityFromCsv } from '../services/visaCsvData';
import { countryCodeMap } from '../data/countryCodes';
import {
  isPakistanUkFacilitationProfile,
  PAKISTAN_UK_FACILITATION,
  FacilitationEntryType,
} from '../data/residenceFacilitation';
import type { VisaRequirement } from '../lib/api/visaRequirements';

export interface TravelHistoryEntry {
  country_id: string;
  visit_date?: string;
  duration_days?: number;
  purpose?: string;
}

export interface TravelScoreProfile {
  nationality: string;
  residency: string;
  travel_history: TravelHistoryEntry[];
}

export interface MobilityAccessCounts {
  visaFree: number;
  visaOnArrival: number;
  eVisa: number;
  visaRequired: number;
  eta: number;
  totalTracked: number;
}

export interface ScoreBreakdown {
  passportComponent: number;
  mobilityComponent: number;
  residencyComponent: number;
  historyComponent: number;
}

export interface ApprovalLikelihood {
  destinationCode: string;
  destinationName: string;
  category: 'schengen' | 'evisa' | 'eta' | 'traditional';
  likelihoodPercent: number;
  requirement: string;
  note?: string;
}

const SCHENGEN_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IS', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE', 'CH',
]);

const PRESTIGE_HISTORY_CODES: Record<string, { codes: Set<string>; label: string; bonus: number }> = {
  schengen: { codes: SCHENGEN_CODES, label: 'Schengen Area', bonus: 45 },
  uk: { codes: new Set(['GB', 'UK']), label: 'United Kingdom', bonus: 40 },
  us: { codes: new Set(['US']), label: 'United States', bonus: 50 },
  australia: { codes: new Set(['AU']), label: 'Australia', bonus: 35 },
  newzealand: { codes: new Set(['NZ']), label: 'New Zealand', bonus: 30 },
  japan: { codes: new Set(['JP']), label: 'Japan', bonus: 35 },
};

const WEIGHTS = {
  MOBILITY: 0.45,
  PASSPORT: 0.3,
  RESIDENCY: 0.1,
  HISTORY: 0.15,
};

function normalizeCode(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const fromMap = Object.entries(countryCodeMap).find(
    ([, name]) => name.toLowerCase() === trimmed.toLowerCase()
  )?.[0];
  if (fromMap) return fromMap;
  const fromList = ALL_COUNTRIES.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase() || c.code === trimmed.toLowerCase()
  );
  return fromList ? fromList.code.toUpperCase() : trimmed.toUpperCase();
}

function resolveCountryName(code: string): string {
  return countryCodeMap[code] ?? ALL_COUNTRIES.find((c) => c.code.toUpperCase() === code)?.name ?? code;
}

export { resolveCountryName };

function resolveNationalityName(nationality: string): string {
  const code = normalizeCode(nationality);
  return resolveCountryName(code);
}

function bucketRequirement(req: VisaRequirement['requirement']): keyof MobilityAccessCounts | null {
  switch (req) {
    case 'visa-free':
      return 'visaFree';
    case 'visa-on-arrival':
      return 'visaOnArrival';
    case 'evisa':
      return 'eVisa';
    case 'eta':
      return 'eta';
    case 'visa-required':
      return 'visaRequired';
    default:
      return null;
  }
}

function facilitationTypeToRequirement(type: FacilitationEntryType): VisaRequirement['requirement'] {
  if (type === 'visa-free') return 'visa-free';
  if (type === 'visa-on-arrival') return 'visa-on-arrival';
  if (type === 'eta') return 'eta';
  return 'evisa';
}

/** Mobility counts from nationality + residence only — travel history does NOT add visa-free access */
export function getMobilityAccessCounts(nationality: string, residence: string): MobilityAccessCounts {
  const natCode = normalizeCode(nationality);
  const resCode = normalizeCode(residence || nationality);
  const natName = resolveNationalityName(nationality);

  const counts: MobilityAccessCounts = {
    visaFree: 0,
    visaOnArrival: 0,
    eVisa: 0,
    visaRequired: 0,
    eta: 0,
    totalTracked: 0,
  };

  const requirements = getVisaRequirementsForNationalityFromCsv(natName);
  const destinationMap = new Map<string, VisaRequirement['requirement']>();

  for (const req of requirements) {
    const destCode = normalizeCode(
      Object.entries(countryCodeMap).find(([, n]) => n === req.destination)?.[0] ??
        ALL_COUNTRIES.find((c) => c.name === req.destination)?.code ??
        req.destination
    );
    if (!destCode) continue;
    destinationMap.set(destCode, req.requirement);
  }

  if (isPakistanUkFacilitationProfile(natCode, resCode)) {
    for (const entry of PAKISTAN_UK_FACILITATION) {
      destinationMap.set(entry.countryCode, facilitationTypeToRequirement(entry.entryType));
    }
  }

  for (const requirement of destinationMap.values()) {
    const bucket = bucketRequirement(requirement);
    if (!bucket || bucket === 'totalTracked') continue;
    counts[bucket] += 1;
    counts.totalTracked += 1;
  }

  return counts;
}

export function getTravelHistoryCredibilityBonus(visitedCountryCodes: string[]): {
  totalBonus: number;
  regions: string[];
  matchedCodes: string[];
} {
  const normalized = visitedCountryCodes.map(normalizeCode);
  const matchedCodes: string[] = [];
  const regions: string[] = [];
  let totalBonus = 0;

  for (const region of Object.values(PRESTIGE_HISTORY_CODES)) {
    const hits = normalized.filter((code) => region.codes.has(code));
    if (hits.length > 0) {
      regions.push(region.label);
      matchedCodes.push(...hits);
      totalBonus += region.bonus;
    }
  }

  return { totalBonus: Math.min(totalBonus, 150), regions, matchedCodes };
}

export function calculateTravelScore(profile: TravelScoreProfile): number {
  const natCode = normalizeCode(profile.nationality);
  const resCode = normalizeCode(profile.residency || profile.nationality);
  const mobility = getMobilityAccessCounts(profile.nationality, profile.residency);
  const passportBase = (PASSPORT_SCORES[natCode.toLowerCase()] ?? PASSPORT_SCORES[pkCodeFallback(natCode)] ?? 35) * 10;

  const mobilityRatio =
    mobility.totalTracked > 0
      ? (mobility.visaFree + mobility.visaOnArrival * 0.85 + mobility.eVisa * 0.7 + mobility.eta * 0.75) /
        mobility.totalTracked
      : 0.25;

  const mobilityComponent = Math.round(mobilityRatio * 1000 * WEIGHTS.MOBILITY);
  const passportComponent = Math.round((passportBase / 1000) * 1000 * WEIGHTS.PASSPORT);

  let residencyComponent = 0;
  if (resCode !== natCode) {
    const resStrength = (PASSPORT_SCORES[resCode.toLowerCase()] ?? 50) * 10;
    residencyComponent = Math.round((resStrength / 1000) * 1000 * WEIGHTS.RESIDENCY);
    if (isPakistanUkFacilitationProfile(natCode, resCode)) {
      residencyComponent = Math.min(100, residencyComponent + 35);
    }
  }

  const visited = profile.travel_history?.map((h) => h.country_id) ?? [];
  const { totalBonus } = getTravelHistoryCredibilityBonus(visited);
  const historyComponent = Math.round((totalBonus / 150) * 1000 * WEIGHTS.HISTORY);

  const total = passportComponent + mobilityComponent + residencyComponent + historyComponent;
  return Math.max(0, Math.min(1000, total));
}

function pkCodeFallback(code: string): string {
  return code === 'PK' ? 'pk' : code.toLowerCase();
}

export function getScoreBreakdown(profile: TravelScoreProfile): ScoreBreakdown {
  const natCode = normalizeCode(profile.nationality);
  const resCode = normalizeCode(profile.residency || profile.nationality);
  const mobility = getMobilityAccessCounts(profile.nationality, profile.residency);
  const passportBase = (PASSPORT_SCORES[natCode.toLowerCase()] ?? 35) * 10;

  const mobilityRatio =
    mobility.totalTracked > 0
      ? (mobility.visaFree + mobility.visaOnArrival * 0.85 + mobility.eVisa * 0.7 + mobility.eta * 0.75) /
        mobility.totalTracked
      : 0.25;

  const mobilityComponent = Math.round(mobilityRatio * 1000 * WEIGHTS.MOBILITY);
  const passportComponent = Math.round((passportBase / 1000) * 1000 * WEIGHTS.PASSPORT);

  let residencyComponent = 0;
  if (resCode !== natCode) {
    const resStrength = (PASSPORT_SCORES[resCode.toLowerCase()] ?? 50) * 10;
    residencyComponent = Math.round((resStrength / 1000) * 1000 * WEIGHTS.RESIDENCY);
    if (isPakistanUkFacilitationProfile(natCode, resCode)) {
      residencyComponent = Math.min(100, residencyComponent + 35);
    }
  }

  const visited = profile.travel_history?.map((h) => h.country_id) ?? [];
  const { totalBonus } = getTravelHistoryCredibilityBonus(visited);
  const historyComponent = Math.round((totalBonus / 150) * 1000 * WEIGHTS.HISTORY);

  return { passportComponent, mobilityComponent, residencyComponent, historyComponent };
}

export function getTravelScoreLevel(score: number): string {
  if (score >= 900) return 'Elite Traveler';
  if (score >= 800) return 'Globetrotter';
  if (score >= 700) return 'Explorer';
  if (score >= 600) return 'Adventurer';
  if (score >= 500) return 'Voyager';
  if (score >= 400) return 'Journeyman';
  if (score >= 300) return 'Wanderer';
  if (score >= 200) return 'Novice';
  return 'Beginner';
}

export function getVisaApprovalLikelihoods(
  profile: TravelScoreProfile,
  travelScore: number
): ApprovalLikelihood[] {
  const natCode = normalizeCode(profile.nationality);
  const resCode = normalizeCode(profile.residency || profile.nationality);
  const natName = resolveNationalityName(profile.nationality);
  const visited = new Set((profile.travel_history ?? []).map((h) => normalizeCode(h.country_id)));
  const credibility = getTravelHistoryCredibilityBonus([...visited]);
  const scoreFactor = travelScore / 1000;

  const results: ApprovalLikelihood[] = [];
  const requirements = getVisaRequirementsForNationalityFromCsv(natName);

  const facilitationByCode = new Map<string, (typeof PAKISTAN_UK_FACILITATION)[number]>();
  if (isPakistanUkFacilitationProfile(natCode, resCode)) {
    for (const entry of PAKISTAN_UK_FACILITATION) {
      facilitationByCode.set(entry.countryCode, entry);
    }
  }

  for (const req of requirements) {
    const destCode = normalizeCode(
      Object.entries(countryCodeMap).find(([, n]) => n === req.destination)?.[0] ??
        ALL_COUNTRIES.find((c) => c.name === req.destination)?.code ??
        req.destination
    );
    if (!destCode) continue;

    const isSchengen = SCHENGEN_CODES.has(destCode);
    const isEvisa = req.requirement === 'evisa' || req.requirement === 'eta';
    const isTraditional = req.requirement === 'visa-required';

    if (!isSchengen && !isEvisa && !isTraditional) continue;

    let category: ApprovalLikelihood['category'] = 'traditional';
    if (isSchengen) category = 'schengen';
    else if (req.requirement === 'eta') category = 'eta';
    else if (req.requirement === 'evisa') category = 'evisa';

    let base = 32 + scoreFactor * 38;
    if (category === 'evisa') base += 12;
    if (category === 'eta') base += 15;
    if (category === 'schengen') base -= 8;

    if (credibility.regions.includes('Schengen Area') && category === 'schengen') base += 18;
    if (credibility.regions.includes('United Kingdom')) base += 8;
    if (credibility.regions.includes('United States')) base += 12;
    if (credibility.regions.includes('Australia') || credibility.regions.includes('New Zealand')) base += 6;
    if (credibility.regions.includes('Japan')) base += 5;

    const facilitation = facilitationByCode.get(destCode);
    if (facilitation) base += 22;

    if (visited.has(destCode)) base += 4;

    const likelihoodPercent = (() => {
      if (category === 'schengen') {
        return getRecommendationLikelihood('schengen', travelScore);
      }
      if (category === 'evisa' || category === 'eta') {
        return getRecommendationLikelihood(category, travelScore);
      }
      return Math.max(18, Math.min(92, Math.round(base)));
    })();

    results.push({
      destinationCode: destCode,
      destinationName: req.destination,
      category,
      likelihoodPercent,
      requirement: req.requirement,
      note: facilitation?.notes,
    });
  }

  return results.sort((a, b) => b.likelihoodPercent - a.likelihoodPercent);
}

export interface GroupedDestinations {
  visaFree: Array<{ code: string; name: string; stay?: string; notes?: string }>;
  evisa: Array<{ code: string; name: string; stay?: string; notes?: string }>;
  eta: Array<{ code: string; name: string; stay?: string; notes?: string }>;
  visaOnArrival: Array<{ code: string; name: string; stay?: string; notes?: string }>;
  traditional: Array<{ code: string; name: string; stay?: string; notes?: string }>;
}

/** Destinations a passport can access — for mobility hub pages */
export function getPassportMobilityGroups(passportCountryCode: string): GroupedDestinations {
  const code = normalizeCode(passportCountryCode);
  const name = resolveCountryName(code);
  const groups: GroupedDestinations = {
    visaFree: [],
    evisa: [],
    eta: [],
    visaOnArrival: [],
    traditional: [],
  };

  const requirements = getVisaRequirementsForNationalityFromCsv(name);

  for (const req of requirements) {
    const destCode = normalizeCode(
      Object.entries(countryCodeMap).find(([, n]) => n === req.destination)?.[0] ??
        ALL_COUNTRIES.find((c) => c.name === req.destination)?.code ??
        req.destination
    );
    const item = {
      code: destCode,
      name: req.destination,
      stay: req.stay_duration ? `${req.stay_duration} days` : undefined,
      notes: req.notes,
    };

    switch (req.requirement) {
      case 'visa-free':
        groups.visaFree.push(item);
        break;
      case 'evisa':
        groups.evisa.push(item);
        break;
      case 'eta':
        groups.eta.push(item);
        break;
      case 'visa-on-arrival':
        groups.visaOnArrival.push(item);
        break;
      case 'visa-required':
        groups.traditional.push(item);
        break;
      default:
        break;
    }
  }

  return groups;
}

export function getRecommendationLikelihood(
  category: 'evisa' | 'eta' | 'schengen',
  travelScore: number
): number {
  const score = Math.max(0, Math.min(1000, travelScore));
  if (category === 'schengen') {
    const raw = 68 + (score / 1000) * 24;
    return Math.max(70, Math.min(92, Math.round(raw)));
  }
  const raw = 91 + (score / 1000) * 7;
  return Math.max(91, Math.min(98, Math.round(raw)));
}
