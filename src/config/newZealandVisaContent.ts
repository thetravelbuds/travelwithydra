/** New Zealand NZeTA and visitor visa product page content. */

import { PLATFORM_NAME } from './brand';
import type { VisaGuideContent, VisaGuideFaqItem } from '../types/visaGuideContent';

export const NEW_ZEALAND_DESTINATION_CODE = 'nz';

export function isNewZealandDestination(countryCode?: string | null): boolean {
  const code = (countryCode || '').toLowerCase().trim();
  return code === NEW_ZEALAND_DESTINATION_CODE || code === 'new zealand' || code === 'nzl';
}

export const NEW_ZEALAND_VISA_QUICK_FACTS = {
  nzetaType: 'NZeTA (Electronic Travel Authority) — for visa-waiver nationalities',
  visitorType: 'Visitor visa — for nationals who cannot use the NZeTA',
  lengthOfStay: 'Up to 6 months per visit (visa-waiver / NZeTA)',
  nzetaValidity: '2 years, multiple entries',
  processingTime: 'Usually minutes to 72 hours',
  applyBeforeTravel: 'Apply at least 72 hours before departure (earlier is safer)',
  nzetaFeeApp: 'NZD $17 via official mobile app',
  nzetaFeeWeb: 'NZD $23 via Immigration New Zealand website',
  ivlFee: 'NZD $100 International Visitor Conservation and Tourism Levy (IVL)',
} as const;

export const NEW_ZEALAND_VISA_GUIDE: VisaGuideContent = {
  processTitle: 'How to get your New Zealand travel approval',
  processSubtitle: `${NEW_ZEALAND_VISA_QUICK_FACTS.applyBeforeTravel}. ${NEW_ZEALAND_VISA_QUICK_FACTS.processingTime}.`,
  stepBadgeClass: 'bg-primary-600',
  applicationSteps: [
    {
      title: 'Check NZeTA vs visitor visa',
      description:
        'British and many other passport holders need an NZeTA before travel. Visa-required nationalities must apply for a visitor visa with fuller documentation.',
    },
    {
      title: 'Gather passport and photo',
      description:
        'Passport valid at least 3 months beyond your planned departure from New Zealand. Upload a digital photo or take one in the official NZeTA app.',
    },
    {
      title: 'Apply online or via the NZeTA app',
      description:
        'The mobile app is cheaper (NZD $17 vs NZD $23 on the website) and can process up to 10 travellers. Hydra helps you choose the right route and prepare documents.',
    },
    {
      title: 'Pay NZeTA and IVL fees',
      description:
        'NZeTA fee plus the mandatory NZD $100 International Visitor Conservation and Tourism Levy (IVL). Total is approximately NZD $117 (app) or NZD $123 (web).',
    },
    {
      title: 'Receive approval by email',
      description:
        'Most NZeTAs are approved within minutes to 72 hours. Do not travel until you receive confirmation linked to your passport.',
    },
    {
      title: 'Complete the NZ Traveller Declaration',
      description:
        'All arrivals must submit the New Zealand Traveller Declaration within 24 hours before landing — customs, immigration, and biosecurity information.',
    },
  ],
  coreDocuments: [
    {
      name: 'Valid passport',
      description:
        'Valid for at least 3 months after the date you plan to leave New Zealand.',
    },
    {
      name: 'Digital photograph',
      description: 'Passport-style photo uploaded online or captured in the NZeTA app.',
    },
    {
      name: 'Proof of onward travel',
      description: 'Return or onward ticket — required at check-in and border control.',
    },
    {
      name: 'Proof of sufficient funds',
      description:
        'Typically NZD $1,000 per month of stay (or NZD $400/month if accommodation is prepaid). Bank or card statements may be requested.',
    },
    {
      name: 'Health & character declarations',
      description: 'Answer eligibility questions truthfully. Serious medical or criminal issues may require a full visitor visa instead.',
    },
    {
      name: 'Visitor visa documents (if applicable)',
      description:
        'Employment letters, bank statements, itinerary, and accommodation proof for nationals applying for a full visitor visa rather than NZeTA.',
    },
  ],
  entrySectionTitle: 'Check-in, arrival & biosecurity',
  entryRequirements: [
    'Present passport, NZeTA confirmation email, and proof of onward travel at airline check-in.',
    'Complete the NZ Traveller Declaration before arrival.',
    'Biosecurity officers enforce strict rules — declare all food, outdoor gear, and plant/animal products.',
    'Border officers decide your permitted stay length (up to 6 months for many visitors).',
    'Carry evidence of funds and accommodation if asked.',
  ],
  borderTip:
    'An NZeTA is not a visa — it authorises travel to New Zealand for visa-waiver nationals. Border officers make the final entry decision. Working in New Zealand requires an appropriate work visa.',
  rejectionReasons: [
    {
      name: 'Expired or short-validity passport',
      description: 'Passport expires within 3 months of your planned departure from New Zealand.',
    },
    {
      name: 'Insufficient funds',
      description: 'Cannot show adequate money for your stay and return travel.',
    },
    {
      name: 'Criminal or immigration history',
      description: 'Prior convictions or visa breaches affecting admissibility.',
    },
    {
      name: 'Previous visa violations',
      description: 'Overstaying or working unlawfully on a prior New Zealand or other visa.',
    },
  ],
  faqCategories: [
    {
      id: 'general',
      label: 'General information',
      items: [
        {
          question: 'Do British citizens need a visa for New Zealand?',
          answer:
            'British citizens do not need a traditional visitor visa for stays up to 6 months, but you must obtain an NZeTA before travelling and pay the IVL levy.',
        },
        {
          question: 'What is the NZeTA?',
          answer:
            'The New Zealand Electronic Travel Authority is a border security measure for visa-waiver travellers. It is linked to your passport and valid for 2 years with multiple entries.',
        },
        {
          question: 'How long can I stay?',
          answer:
            'Most visitors on an NZeTA can stay up to 6 months per visit. The exact duration is decided by immigration officers at entry.',
        },
        {
          question: 'What is the IVL?',
          answer:
            'The International Visitor Conservation and Tourism Levy (NZD $100) funds tourism infrastructure and conservation. It is added automatically when you apply for an NZeTA.',
        },
      ],
    },
    {
      id: 'eligibility',
      label: 'Eligibility & requirements',
      items: [
        {
          question: 'Who needs a visitor visa instead of an NZeTA?',
          answer:
            'Nationalities not on the visa-waiver list — including India, China, and many African and Middle Eastern countries — must apply for a full visitor visa with supporting documents.',
        },
        {
          question: 'How much money do I need to show?',
          answer:
            'Immigration New Zealand expects roughly NZD $1,000 per month, or NZD $400 per month if you have prepaid accommodation. Carry bank statements or cards if asked.',
        },
        {
          question: 'Can I work on an NZeTA?',
          answer:
            'You cannot take up employment with a New Zealand employer. Limited remote work for an overseas employer may be permitted for up to 90 days under current visitor rules — verify before relying on this.',
        },
      ],
    },
    {
      id: 'process',
      label: 'Application process',
      items: [
        {
          question: 'How much does the NZeTA cost?',
          answer:
            'NZD $17 via the official app or NZD $23 on the website, plus NZD $100 IVL — total approximately NZD $117–123. Visitor visa fees are higher and depend on nationality and stream.',
        },
        {
          question: 'How long does processing take?',
          answer:
            'NZeTA: usually 10 minutes to 72 hours. Visitor visa: often several weeks. Apply at least 3 days before travel; earlier is recommended in peak season.',
        },
        {
          question: `How does ${PLATFORM_NAME} help?`,
          answer:
            'We determine whether you need an NZeTA or visitor visa, validate your passport scan and photo, prepare supporting documents, and track your approval.',
        },
        {
          question: 'What is the NZ Traveller Declaration?',
          answer:
            'A mandatory online form completed within 24 hours of arrival covering customs, immigration, and biosecurity. It is separate from the NZeTA application.',
        },
      ],
    },
    {
      id: 'children',
      label: 'Children & families',
      items: [
        {
          question: 'Do children need an NZeTA?',
          answer:
            'Yes — every traveller including infants needs their own NZeTA or visitor visa linked to their passport. The app allows requests for up to 10 people in one session.',
        },
      ],
    },
    {
      id: 'entry-exit',
      label: 'Entry & extensions',
      items: [
        {
          question: 'Can I extend my stay in New Zealand?',
          answer:
            'You may apply to extend visitor status before your current permission expires. Extensions are not automatic and require a valid reason.',
        },
        {
          question: 'What happens if my NZeTA is denied?',
          answer:
            'The IVL is generally non-refundable if your request is declined. You may need to apply for a visitor visa with fuller evidence or address the reason for refusal before reapplying.',
        },
      ],
    },
  ],
};

export function getNewZealandVisaFaqs(): VisaGuideFaqItem[] {
  return NEW_ZEALAND_VISA_GUIDE.faqCategories.flatMap((category) => category.items);
}
