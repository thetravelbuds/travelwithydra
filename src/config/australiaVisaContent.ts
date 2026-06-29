/** Australia visitor visa, ETA, and eVisitor product page content. */

import { PLATFORM_NAME } from './brand';
import type { VisaGuideContent, VisaGuideFaqItem } from '../types/visaGuideContent';

export const AUSTRALIA_DESTINATION_CODE = 'au';

export function isAustraliaDestination(countryCode?: string | null): boolean {
  const code = (countryCode || '').toLowerCase().trim();
  return code === AUSTRALIA_DESTINATION_CODE || code === 'australia';
}

export const AUSTRALIA_VISA_QUICK_FACTS = {
  eVisitorType: 'eVisitor (subclass 651) — free, for eligible European/British passports',
  etaType: 'ETA (subclass 601) — electronic travel authority',
  visitorType: 'Visitor visa (subclass 600) — for longer stays or ineligible nationalities',
  lengthOfStay: 'Up to 3 months per visit',
  validity: 'Up to 12 months, multiple entry (eVisitor/ETA)',
  processingTime: 'Usually within hours; up to 48 hours if manually reviewed',
  applyBeforeTravel: 'Apply before you book flights — approval is required before departure',
  etaFee: 'AUD $20 (subclass 601)',
  visitorFee: 'From AUD $200 (subclass 600, varies by stream)',
} as const;

export const AUSTRALIA_VISA_GUIDE: VisaGuideContent = {
  processTitle: 'How to get your Australia travel authorisation',
  processSubtitle: `${AUSTRALIA_VISA_QUICK_FACTS.applyBeforeTravel}. ${AUSTRALIA_VISA_QUICK_FACTS.processingTime}.`,
  stepBadgeClass: 'bg-primary-600',
  applicationSteps: [
    {
      title: 'Choose the right visa subclass',
      description:
        'British and most European citizens use the free eVisitor (651). U.S., Canadian, Japanese, and many Asian nationalities use the ETA (601). Others may need a Visitor visa (600).',
    },
    {
      title: 'Prepare passport and photo',
      description:
        'Your passport must be valid for your entire stay. ETA applicants need a compliant digital photograph scanned to government specifications.',
    },
    {
      title: 'Apply online',
      description:
        'eVisitor: ImmiAccount on the Department of Home Affairs website. ETA: Australian ETA app or official channels. Hydra guides you through the correct route for your nationality.',
    },
    {
      title: 'Pay the government fee (if applicable)',
      description:
        'eVisitor is free. ETA costs AUD $20. Visitor visa (600) fees start around AUD $200 depending on stream.',
    },
    {
      title: 'Receive your grant notification',
      description:
        'Most eVisitor and ETA decisions arrive by email within minutes to 48 hours. Do not travel until you have written approval linked to your passport.',
    },
    {
      title: 'Travel to Australia',
      description:
        'Present the same passport used in your application. Border officers may ask about funds, itinerary, and health/character declarations.',
    },
  ],
  coreDocuments: [
    {
      name: 'Valid passport',
      description:
        'Must be valid for your entire stay. ETA and eVisitor are electronically linked — you cannot transfer them to a new passport without reapplying.',
    },
    {
      name: 'Digital passport photograph',
      description: 'Recent photo meeting Australian visa photo standards (required for ETA; may be requested for other streams).',
    },
    {
      name: 'Email address',
      description: 'Used to receive your visa grant notification and correspondence from Home Affairs.',
    },
    {
      name: 'Proof of funds (if requested)',
      description: 'Bank statements or cards showing you can support yourself during your stay.',
    },
    {
      name: 'Travel itinerary',
      description: 'Return or onward tickets and accommodation details — especially for Visitor visa (600) applications.',
    },
    {
      name: 'Health & character declarations',
      description: 'Answer all eligibility questions honestly. Some applicants may need medical exams or police certificates.',
    },
  ],
  entrySectionTitle: 'Before departure & at the Australian border',
  entryRequirements: [
    'Wait for email confirmation of your visa grant before booking non-refundable travel.',
    'Travel with the passport linked to your eVisitor, ETA, or visitor visa grant.',
    'Complete an incoming passenger card (digital or paper) before clearance.',
    'Officers may ask about accommodation, funds, and purpose of visit.',
    'eVisitor and ETA do not permit work — limited business visitor activities only.',
  ],
  borderTip:
    'An approved eVisitor or ETA lets you board your flight, but Australian Border Force makes the final entry decision. Visitor visas must match your stated purpose and stay length.',
  rejectionReasons: [
    {
      name: 'Expired or soon-expiring passport',
      description: 'Applying with a passport that expires within 6 months of travel.',
    },
    {
      name: 'Insufficient funds',
      description: 'Unable to demonstrate adequate financial resources for your stay.',
    },
    {
      name: 'Criminal record',
      description: 'Failing health or character requirements due to serious convictions.',
    },
    {
      name: 'Previous visa violations',
      description: 'Overstaying or breaching conditions on a prior Australian or other visa.',
    },
  ],
  faqCategories: [
    {
      id: 'general',
      label: 'General information',
      items: [
        {
          question: 'Do UK residents need a visa for Australia?',
          answer:
            'British Citizen passport holders are eligible for the free eVisitor (subclass 651) — not a traditional visa. Many other nationalities need an ETA (601) or Visitor visa (600).',
        },
        {
          question: 'What is the difference between eVisitor and ETA?',
          answer:
            'eVisitor (651) is free for eligible European/British passports via ImmiAccount. ETA (601) costs AUD $20 and is for countries like the U.S., Canada, Japan, and India. Both allow tourism and short business visits up to 3 months per entry.',
        },
        {
          question: 'How long can I stay in Australia?',
          answer:
            'eVisitor and ETA typically allow stays of up to 3 months per visit within a 12-month validity period. Visitor visa (600) may allow longer stays at the case officer’s discretion.',
        },
        {
          question: 'Is the eVisitor really free?',
          answer:
            'Yes — the Australian government does not charge British and eligible European nationals for subclass 651. Apply only through immi.homeaffairs.gov.au to avoid unofficial reseller fees.',
        },
      ],
    },
    {
      id: 'eligibility',
      label: 'Eligibility & requirements',
      items: [
        {
          question: 'Who should apply for a Visitor visa (600) instead?',
          answer:
            'Non-standard British passports (e.g. BNO), travellers needing stays beyond 3 months, those with complex health/character issues, or nationalities ineligible for eVisitor/ETA.',
        },
        {
          question: 'Do I need biometrics for Australia?',
          answer:
            'Biometrics are not required for eVisitor or ETA. Visitor visa (600) applicants may need biometrics depending on nationality and risk profile.',
        },
        {
          question: 'Is travel insurance required?',
          answer:
            'Not legally mandatory for short visits, but strongly recommended. Australia has no reciprocal healthcare agreement with the UK — medical costs can be very high.',
        },
      ],
    },
    {
      id: 'process',
      label: 'Application process',
      items: [
        {
          question: 'How long does processing take?',
          answer:
            'eVisitor and ETA: usually minutes to 48 hours. Visitor visa (600): often 3–6 weeks or longer for complex cases. Apply well before your departure date.',
        },
        {
          question: `How does ${PLATFORM_NAME} help?`,
          answer:
            'We identify the correct subclass for your passport, scan and validate your documents, submit through the proper government channel, and track your grant notification.',
        },
        {
          question: 'Can I add family members to one application?',
          answer:
            'Each traveller needs their own eVisitor, ETA, or visitor visa linked to their own passport. Family groups can be prepared together for efficiency.',
        },
      ],
    },
    {
      id: 'entry-exit',
      label: 'Travel rules',
      items: [
        {
          question: 'Can I work in Australia on an eVisitor or ETA?',
          answer:
            'No paid employment is allowed. Limited unpaid volunteer work and short business meetings may be permitted — check current Home Affairs guidance for your activity.',
        },
        {
          question: 'Can I extend my stay?',
          answer:
            'eVisitor and ETA cannot be extended from inside Australia. You must leave and may re-enter if your visa still allows. Some Visitor visa (600) grants can be extended in limited cases.',
        },
        {
          question: 'What items can I bring into Australia?',
          answer:
            'Australia has strict biosecurity laws. Declare all food, plant, and animal products. Undeclared items can result in fines or prosecution.',
        },
      ],
    },
  ],
};

export function getAustraliaVisaFaqs(): VisaGuideFaqItem[] {
  return AUSTRALIA_VISA_GUIDE.faqCategories.flatMap((category) => category.items);
}
