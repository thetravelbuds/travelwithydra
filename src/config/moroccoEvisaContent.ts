/** Morocco e-Visa product page content (requirements, process, FAQs). */

export interface MoroccoFaqItem {
  question: string;
  answer: string;
}

export interface MoroccoFaqCategory {
  id: string;
  label: string;
  items: MoroccoFaqItem[];
}

export const MOROCCO_EVISA_QUICK_FACTS = {
  entryType: 'Single entry',
  lengthOfStay: '30 days per visit',
  visaValidity: '180 days from issue',
  applicationChannel: '100% online — no embassy visit',
  applyBeforeTravel: 'At least 2 weeks before your departure date',
} as const;

export const MOROCCO_APPLICATION_STEPS = [
  {
    title: 'Complete your application online',
    description:
      'Answer the guided questions, upload your passport and photo, and pay securely. Your progress is saved so you can return anytime — most applicants finish in under 15 minutes.',
  },
  {
    title: 'We review your documents',
    description:
      'Morocco’s e-Visa system is strict about photo quality, passport scans, and formatting. We check your application before submission to catch issues that could cause delays.',
  },
  {
    title: 'Government processing',
    description:
      'Your application is submitted to the Moroccan authorities. You receive email updates as your application moves through review.',
  },
  {
    title: 'Receive your e-Visa',
    description:
      'Once approved, your e-Visa is delivered digitally by email. Print a copy and keep a backup on your phone for immigration on arrival.',
  },
] as const;

export const MOROCCO_CORE_DOCUMENTS = [
  {
    name: 'Passport',
    description:
      'Valid for at least 6 months from your date of arrival in Morocco, with a clear scan of the bio-data page.',
  },
  {
    name: 'Passport-style photograph',
    description:
      'A recent colour photo meeting Morocco e-Visa specifications — you can take one on your phone during the application.',
  },
  {
    name: 'Supporting residence or visa document (if applicable)',
    description:
      'UK residence permit holders may need a valid Share Code from HM Home Office, or a qualifying multi-entry visa / residence permit under Morocco’s e-Visa waiver program.',
  },
  {
    name: 'Travel insurance',
    description:
      'Mandatory for most applicants. Must cover medical emergencies for your entire stay with minimum coverage of £30,000 (or equivalent).',
  },
  {
    name: 'Proof of accommodation',
    description: 'Hotel booking confirmation or an invitation letter from your host in Morocco.',
  },
  {
    name: 'Return or onward travel',
    description: 'A return flight ticket or onward itinerary showing you plan to leave Morocco.',
  },
] as const;

export const MOROCCO_ENTRY_REQUIREMENTS = [
  'Sufficient funds to support your stay (around €70 per day is commonly cited at the border).',
  'Printed copy of your approved e-Visa plus a digital backup on your phone.',
  'Proof of accommodation or host invitation.',
  'Return or onward ticket.',
  'Travel insurance valid for the full duration of your trip.',
] as const;

export const MOROCCO_FAQ_CATEGORIES: MoroccoFaqCategory[] = [
  {
    id: 'general',
    label: 'General information',
    items: [
      {
        question: 'Do I need a visa to visit Morocco?',
        answer:
          'It depends on your nationality. British passport holders do not need a visa for short tourism visits. Many other nationalities must apply for a Morocco e-Visa online before travel — including travellers who hold a UK residence permit (BRP) or Share Code but are not British citizens.',
      },
      {
        question: 'Do I need to visit an embassy or submit my passport in person?',
        answer:
          'No. The Morocco e-Visa process is fully online. You upload digital copies of your documents and receive your approved visa electronically — there is no need to mail your passport or attend an embassy appointment.',
      },
      {
        question: 'What does the Morocco e-Visa look like?',
        answer:
          'After approval you receive a digital visa document by email. It includes your personal details, permitted entries, validity period, and the dates you may enter and leave Morocco.',
      },
      {
        question: 'Can I work or study on a Morocco tourist e-Visa?',
        answer:
          'No. A tourist e-Visa is only for leisure travel, sightseeing, or visiting friends and family. It does not permit employment or enrolment at a school or university.',
      },
      {
        question: 'How far in advance should I apply?',
        answer:
          'Apply at least two weeks before your intended travel date. This allows time for processing and any follow-up document requests.',
      },
      {
        question: 'Can I get a visa on arrival in Morocco?',
        answer:
          'Most nationalities that require a visa must obtain an e-Visa before departure. Visa on arrival is not available for travellers who need a visa — apply online in advance.',
      },
      {
        question: 'Do children need their own passport and visa?',
        answer:
          'Yes. Every traveller, including infants and children, must have their own valid passport and their own visa if their nationality requires one.',
      },
    ],
  },
  {
    id: 'eligibility',
    label: 'Eligibility & requirements',
    items: [
      {
        question: 'What are the Morocco e-Visa requirements for UK residence permit holders?',
        answer:
          'You typically need: a valid passport (6+ months validity from arrival), recent passport photos, proof of accommodation, return travel, travel insurance (minimum £30,000 medical cover), and evidence of sufficient funds. UK residence permit holders may also need a Share Code from HM Home Office or a qualifying supporting visa/permit under Morocco’s waiver program.',
      },
      {
        question: 'What documents are required for minors applying from the UK?',
        answer:
          'Minors generally need: a completed visa application signed by both parents or legal guardians, the child’s passport (valid 6+ months), a full birth certificate, a parental consent letter, copies of both parents’ passports, travel and accommodation proof, travel insurance, and a school letter if travelling during term time. Sole-custody or single-parent travel may require additional court orders.',
      },
      {
        question: 'Is travel insurance mandatory for a Morocco e-Visa?',
        answer:
          'Yes, for most applicants who require a visa. Insurance must cover medical expenses and emergencies, be valid for your entire stay in Morocco, and include at least £30,000 of medical coverage (or equivalent in another currency).',
      },
      {
        question: 'What are the entry requirements when I arrive in Morocco?',
        answer:
          'Be prepared to show: your printed e-Visa, passport, proof of accommodation, return ticket, travel insurance, and evidence of sufficient funds (commonly cited as around €70 per day). Immigration officers may ask additional questions about your trip.',
      },
    ],
  },
  {
    id: 'process',
    label: 'Application process',
    items: [
      {
        question: 'How do I apply for a Morocco e-Visa with Hydra?',
        answer:
          'Select your nationality and destination on our Morocco visa page, complete the guided application form, upload your passport photo and supporting documents, review your details, and pay the visa and service fees securely online. We submit your application and notify you by email when it is approved.',
      },
      {
        question: 'How will I receive my approved e-Visa?',
        answer:
          'Your approved e-Visa is sent to the email address on your application. Download and print a copy before travel, and keep a digital copy on your phone as a backup.',
      },
      {
        question: 'Can I apply for family members or co-travellers?',
        answer:
          'Yes. You can add multiple travellers to one checkout session. Each person needs their own passport and, where required, their own supporting documents.',
      },
    ],
  },
  {
    id: 'rejections',
    label: 'Rejections & reapplications',
    items: [
      {
        question: 'What should I do if my Morocco visa application is rejected?',
        answer:
          'Review the reason given for the rejection, correct any missing or unclear documents (financial proof, travel purpose, photo quality, or supporting permit validity), and submit a new application. Ensure all information matches your passport and supporting documents exactly.',
      },
    ],
  },
  {
    id: 'entry-exit',
    label: 'Entry & exit',
    items: [
      {
        question: 'Are vaccinations required to enter Morocco?',
        answer:
          'No vaccinations are mandatory for entry, but Hepatitis A and Typhoid are recommended because both can spread through food and water. Consult your doctor before travel.',
      },
      {
        question: 'Do I need to print my Morocco e-Visa?',
        answer:
          'Yes — immigration officials commonly ask for a printed copy on arrival. Also keep a digital copy on your phone in case of loss or delay.',
      },
      {
        question: 'What is the validity and length of stay on a Morocco e-Visa?',
        answer:
          'The standard tourist e-Visa is valid for 180 days from the date of issue, allows a single entry, and permits a maximum stay of 30 days in Morocco.',
      },
    ],
  },
];

/** Flat FAQ list for the product catalog generator. */
export function getMoroccoEvisaFaqs(): MoroccoFaqItem[] {
  return MOROCCO_FAQ_CATEGORIES.flatMap((category) => category.items);
}
