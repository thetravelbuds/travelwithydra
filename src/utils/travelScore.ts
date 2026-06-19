export {
  calculateTravelScore,
  getTravelScoreLevel,
  getScoreBreakdown,
  getMobilityAccessCounts,
  getTravelHistoryCredibilityBonus,
  getVisaApprovalLikelihoods,
  getPassportMobilityGroups,
  getRecommendationLikelihood,
  normalizeCode,
  resolveCountryName,
} from './travelScoreEngine';

export type {
  TravelScoreProfile,
  MobilityAccessCounts,
  ScoreBreakdown,
  ApprovalLikelihood,
  GroupedDestinations,
  TravelHistoryEntry,
} from './travelScoreEngine';
