/** Shared types for destination-specific visa product guides. */

export interface VisaGuideFaqItem {
  question: string;
  answer: string;
}

export interface VisaGuideFaqCategory {
  id: string;
  label: string;
  items: VisaGuideFaqItem[];
}

export interface VisaGuideDocument {
  name: string;
  description: string;
}

export interface VisaGuideStep {
  title: string;
  description: string;
}

export interface VisaGuideContent {
  processTitle: string;
  processSubtitle: string;
  applicationSteps: VisaGuideStep[];
  coreDocuments: VisaGuideDocument[];
  entrySectionTitle: string;
  entryRequirements: string[];
  borderTip?: string;
  faqCategories: VisaGuideFaqCategory[];
  /** Tailwind classes for step number badges, e.g. bg-primary-600 or bg-indigo-600 */
  stepBadgeClass?: string;
  /** Optional common refusal factors shown below the main guide */
  rejectionReasons?: VisaGuideDocument[];
  /** Optional SEO highlight block shown above the process section */
  seoHighlight?: {
    title: string;
    body: string;
    bullets?: string[];
  };
}
