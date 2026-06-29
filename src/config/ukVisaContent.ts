/** United Kingdom visitor visa product page content. */

import { PLATFORM_NAME } from './brand';
import type { VisaGuideContent, VisaGuideFaqItem } from '../types/visaGuideContent';

export const UK_DESTINATION_CODE = 'gb';

export function isUnitedKingdomDestination(countryCode?: string | null): boolean {
  const code = (countryCode || '').toLowerCase().trim();
  return code === UK_DESTINATION_CODE || code === 'uk';
}

export const UK_VISA_QUICK_FACTS = {
  visaType: 'Standard Visitor visa (sticker in passport)',
  lengthOfStay: 'Up to 6 months per visit (typical)',
  processingTime: 'Usually 3 weeks after biometrics (priority services may be faster)',
  applyBeforeTravel: 'Apply at least 4–8 weeks before your intended travel date',
} as const;

export const UK_VISA_GUIDE: VisaGuideContent = {
  processTitle: 'How to get your UK Standard Visitor visa',
  processSubtitle: `${UK_VISA_QUICK_FACTS.applyBeforeTravel}. ${UK_VISA_QUICK_FACTS.processingTime}.`,
  stepBadgeClass: 'bg-indigo-600',
  applicationSteps: [
    {
      title: 'Check you need a visa',
      description:
        'Some nationalities are visa-exempt for short visits to the UK. If you need a visa, the Standard Visitor route covers tourism, family visits, and certain business activities.',
    },
    {
      title: 'Complete your application online',
      description:
        'Answer questions about your finances, employment, travel history, and ties to your home country. Hydra helps you prepare accurate answers and supporting documents.',
    },
    {
      title: 'Upload supporting documents',
      description:
        'Bank statements, employment letters, accommodation proof, and travel itinerary are compiled into an organised packet matched to your circumstances.',
    },
    {
      title: 'Book biometrics appointment',
      description:
        'Attend a visa application centre to provide fingerprints and a photograph. Your passport is usually kept while the decision is made.',
    },
    {
      title: 'Receive your decision',
      description:
        'If approved, your passport is returned with a visa vignette (sticker). Check the validity dates and permitted length of stay before you travel.',
    },
  ],
  coreDocuments: [
    {
      name: 'Valid passport',
      description:
        'At least one blank page for the visa vignette. Some nationalities need 6+ months validity beyond your planned departure from the UK.',
    },
    {
      name: 'Completed online application',
      description: 'Application form answers and declaration — prepared through Hydra from your profile and trip details.',
    },
    {
      name: 'Financial evidence',
      description:
        'Recent bank statements (typically 3–6 months) showing you can fund your trip without working in the UK.',
    },
    {
      name: 'Employment or study proof',
      description:
        'Employer letter, payslips, business registration, or enrolment letter showing you will return home after your visit.',
    },
    {
      name: 'Accommodation & travel plans',
      description: 'Hotel bookings, host invitation, and return flight reservations or a clear travel itinerary.',
    },
    {
      name: 'Ties to home country',
      description:
        'Property ownership, family dependants, or ongoing commitments that support your intention to leave the UK after your visit.',
    },
  ],
  entrySectionTitle: 'At the application centre & border',
  entryRequirements: [
    'Attend your biometrics appointment with your appointment confirmation and supporting documents.',
    'Passport submitted at the centre is returned with the visa sticker if approved.',
    'At UK border control, officers may ask about your visit purpose, funds, and return plans.',
    'Carry copies of key documents even after your visa is granted.',
    'The visa vignette shows permitted validity — do not overstay.',
  ],
  borderTip:
    'A UK visa does not guarantee entry. Border officers make the final decision. Be ready to explain your itinerary and how you will support yourself without working.',
  faqCategories: [
    {
      id: 'general',
      label: 'General information',
      items: [
        {
          question: 'What is a UK Standard Visitor visa?',
          answer:
            'It is the usual route for tourism, visiting family or friends, short business meetings, and some other permitted activities for up to 6 months per visit.',
        },
        {
          question: 'How long can I stay in the UK?',
          answer:
            'Most Standard Visitor visas allow stays of up to 6 months. The exact dates are shown on your visa vignette. Longer routes exist for other purposes but are not covered by a standard tourist application.',
        },
        {
          question: 'Can I work in the UK on a visitor visa?',
          answer:
            'No. Paid or unpaid work, and most forms of business activity beyond permitted visitor rules, are not allowed. You must not access public funds.',
        },
      ],
    },
    {
      id: 'eligibility',
      label: 'Eligibility & finances',
      items: [
        {
          question: 'How much money do I need to show?',
          answer:
            'There is no fixed amount, but you must prove you can cover flights, accommodation, and daily expenses without working. Evidence should match your stated trip length and plans.',
        },
        {
          question: 'What if someone else is paying for my trip?',
          answer:
            'You can include a sponsor’s financial documents and a letter explaining their relationship to you and commitment to support your visit.',
        },
        {
          question: 'Will my travel history affect my application?',
          answer:
            'Yes. Previous visas, refusals, and compliance with immigration rules in other countries are considered. Answer all questions honestly.',
        },
      ],
    },
    {
      id: 'process',
      label: 'Application process',
      items: [
        {
          question: `How does ${PLATFORM_NAME} help with a UK visa application?`,
          answer:
            'We guide you through the online form, generate a tailored document checklist, organise your packet for the application centre, and help book your biometrics appointment where our service includes it.',
        },
        {
          question: 'How long does processing take?',
          answer:
            'Standard service is often around 3 weeks after biometrics. Priority and super-priority options may be available at extra cost depending on your location.',
        },
        {
          question: 'Do I need an interview?',
          answer:
            'Most visitor applicants only attend a biometrics appointment. An interview may be requested in complex cases.',
        },
      ],
    },
    {
      id: 'refusals',
      label: 'Refusals & reapplications',
      items: [
        {
          question: 'What are common reasons for refusal?',
          answer:
            'Insufficient financial evidence, weak ties to home country, unclear travel purpose, or incomplete documentation. Address the refusal letter points directly if you reapply.',
        },
      ],
    },
  ],
};

export function getUkVisaFaqs(): VisaGuideFaqItem[] {
  return UK_VISA_GUIDE.faqCategories.flatMap((category) => category.items);
}
