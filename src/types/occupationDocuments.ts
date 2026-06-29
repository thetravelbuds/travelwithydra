export type OccupationProfileId =
  | 'employed'
  | 'business_owner'
  | 'student'
  | 'unemployed'
  | 'retired';

export type DocumentSectionKind = 'required' | 'additional' | 'optional';

export interface OccupationDocumentItem {
  id: string;
  label: string;
  hint?: string;
}

export interface OccupationDocumentSection {
  kind: DocumentSectionKind;
  title: string;
  subtitle?: string;
  items: OccupationDocumentItem[];
}

export interface OccupationProfile {
  id: OccupationProfileId;
  label: string;
  description: string;
  sections: OccupationDocumentSection[];
}

export interface OccupationChecklistConfig {
  destinationLabel: string;
  sourceNote: string;
  profiles: OccupationProfile[];
}
