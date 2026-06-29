/** Turkey e-Visa product page content. */

import { PLATFORM_NAME } from './brand';
import type { VisaGuideContent, VisaGuideFaqItem } from '../types/visaGuideContent';

export const TURKEY_DESTINATION_CODE = 'tr';

export function isTurkeyProductDestination(countryCode?: string | null): boolean {
  return (countryCode || '').toLowerCase().trim() === TURKEY_DESTINATION_CODE;
}

export const TURKEY_EVISA_QUICK_FACTS = {
  entryType: 'Single or multiple entry (depends on nationality)',
  lengthOfStay: 'Up to 30 or 90 days per visit (depends on nationality)',
  visaValidity: '180 days from issue',
  applicationChannel: '100% online — no embassy visit for eligible travellers',
  applyBeforeTravel: 'Apply at least 48 hours before departure (earlier is recommended)',
} as const;

export const TURKEY_VISA_GUIDE: VisaGuideContent = {
  processTitle: 'How to get your Turkey e-Visa',
  processSubtitle: `${TURKEY_EVISA_QUICK_FACTS.applicationChannel}. ${TURKEY_EVISA_QUICK_FACTS.applyBeforeTravel}.`,
  stepBadgeClass: 'bg-primary-600',
  applicationSteps: [
    {
      title: 'Check your eligibility',
      description:
        'Confirm your nationality and whether you need a supporting visa or residence permit (US, UK, Schengen, or Ireland). Use the checker above to see your route before you apply.',
    },
    {
      title: 'Complete your application online',
      description:
        'Fill in passport details, travel dates, and upload your documents. Hydra guides you step by step — most applicants finish in under 15 minutes.',
    },
    {
      title: 'We review before submission',
      description:
        'Turkey’s system rejects unclear passport scans and mismatched supporting visas. We check formatting and validity dates before your application goes to the authorities.',
    },
    {
      title: 'Receive your e-Visa by email',
      description:
        'Once approved, your e-Visa arrives digitally. Print a copy and save one on your phone for Turkish immigration.',
    },
  ],
  coreDocuments: [
    {
      name: 'Passport',
      description:
        'Valid at least 60 days beyond the end of your requested visa period (6 months recommended). Clear scan of the bio-data page.',
    },
    {
      name: 'Supporting visa or residence permit (if required)',
      description:
        'Many nationalities must hold a valid US, UK, Schengen, or Ireland visa or residence permit. It must be valid on your arrival date in Turkey.',
    },
    {
      name: 'Email address',
      description: 'Your approved e-Visa is sent electronically — use an inbox you can access while travelling.',
    },
    {
      name: 'Payment method',
      description: 'Government visa fee plus service charges are paid securely online during the application.',
    },
    {
      name: 'Return or onward travel (recommended)',
      description: 'Immigration may ask for proof you plan to leave Turkey within your permitted stay.',
    },
    {
      name: 'Accommodation details (recommended)',
      description: 'Hotel booking or host address can help if officers ask about your itinerary.',
    },
  ],
  entrySectionTitle: 'At the border',
  entryRequirements: [
    'Printed e-Visa plus a digital backup on your phone.',
    'Passport used in the application (same document number).',
    'Supporting visa or permit, if your nationality requires one — valid on arrival day.',
    'Proof of sufficient funds and return travel (may be requested).',
    'Travel insurance is recommended though not always checked at the border.',
  ],
  borderTip:
    'Your supporting visa must still be valid on the day you enter Turkey. An expired permit voids the e-Visa even if the e-Visa itself has not expired. Tourist e-Visas do not permit employment in Turkey.',
  faqCategories: [
    {
      id: 'general',
      label: 'General information',
      items: [
        {
          question: 'Do I need a visa to visit Turkey?',
          answer:
            'It depends on your nationality. Some passport holders are visa-exempt for short stays. Many others can apply for an e-Visa online. Some nationalities must apply through a Turkish embassy. Use our eligibility checker for your passport.',
        },
        {
          question: 'What is the difference between visa-exempt entry and an e-Visa?',
          answer:
            'Visa-exempt travellers enter with only their passport for short tourism or business visits. An e-Visa is an electronic travel authorisation you apply for and receive by email before departure.',
        },
        {
          question: 'How long can I stay in Turkey on an e-Visa?',
          answer:
            'Stay limits depend on your nationality — commonly up to 30 or 90 days within the validity period shown on your e-Visa. The exact duration is printed on your approval document.',
        },
        {
          question: 'Can I work or study on a Turkey tourist e-Visa?',
          answer:
            'No. Tourist and commercial e-Visas are for short visits, tourism, or certain business activities — not employment or long-term study.',
        },
      ],
    },
    {
      id: 'eligibility',
      label: 'Eligibility & supporting documents',
      items: [
        {
          question: 'Who needs a supporting US, UK, Schengen, or Ireland visa?',
          answer:
            'Many nationalities that are not visa-exempt must hold a valid sticker visa or residence permit from the US, UK, a Schengen country, or Ireland to qualify for Turkey’s e-Visa route. The permit must be valid on your arrival date.',
        },
        {
          question: 'Does my supporting visa need to have been used before?',
          answer:
            'No. Turkey generally accepts a new, unused single- or multiple-entry visa if it is valid when you enter Turkey.',
        },
        {
          question: 'What if my supporting visa expires before I travel?',
          answer:
            'You must renew or replace the supporting document before applying, or use another eligible route. An expired supporting visa makes the e-Visa invalid at the border.',
        },
      ],
    },
    {
      id: 'process',
      label: 'Application process',
      items: [
        {
          question: `How do I apply for a Turkey e-Visa with ${PLATFORM_NAME}?`,
          answer:
            `Select Turkey as your destination, complete the guided form, upload your passport and any supporting documents, pay the fees, and submit. We notify you by email when your e-Visa is approved.`,
        },
        {
          question: 'How fast is Turkey e-Visa processing?',
          answer:
            'Many applications are approved within hours, but allow at least 48 hours before travel. Complex cases or document issues can take longer.',
        },
        {
          question: 'Can I apply for family members in one session?',
          answer:
            'Yes. Add each traveller to your checkout. Every person needs their own passport and, where required, their own supporting visa.',
        },
      ],
    },
    {
      id: 'entry-exit',
      label: 'Entry & exit',
      items: [
        {
          question: 'Do I need to print my Turkey e-Visa?',
          answer:
            'Yes — carry a printed copy and keep a digital backup. Airlines and immigration officers commonly ask to see it.',
        },
        {
          question: 'Which airports and borders accept the e-Visa?',
          answer:
            'Turkey accepts e-Visas at major international airports and designated land crossings. Always confirm your entry point accepts e-Visas before travel.',
        },
      ],
    },
  ],
};

export function getTurkeyEvisaFaqs(): VisaGuideFaqItem[] {
  return TURKEY_VISA_GUIDE.faqCategories.flatMap((category) => category.items);
}
