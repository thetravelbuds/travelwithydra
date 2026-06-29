/** Schengen visa product page content — shared across all Schengen destinations. */

export interface SchengenContentItem {
  title: string;
  description: string;
}

export interface SchengenFaqItem {
  question: string;
  answer: string;
}

export interface SchengenFaqCategory {
  id: string;
  label: string;
  items: SchengenFaqItem[];
}

export interface SchengenPacketDocument {
  id: string;
  label: string;
  subtitle: string;
  accent: string;
}

export const SCHENGEN_VISA_QUICK_FACTS = {
  visaType: 'Sticker visa (short-stay Schengen)',
  lengthOfStay: 'Up to 90 days in any 180-day period',
  entryType: 'Multiple entry (at consular discretion)',
  processingTime: 'Typically 15 calendar days (up to 45 in complex cases)',
  applyBeforeTravel: 'Apply at least 30 days before your intended travel date',
} as const;

export const SCHENGEN_APPLICATION_PROCESS: SchengenContentItem[] = [
  {
    title: 'Gather your documents',
    description:
      'Requirements vary by your travel history, finances, and occupation. We provide a personalised checklist based on your application.',
  },
  {
    title: 'Complete your application online',
    description:
      'Fill in the Schengen form, upload your passport, travel bookings, and supporting documents. Our guided flow catches common errors before submission.',
  },
  {
    title: 'We book your appointment',
    description:
      'Hydra arranges your VFS or consulate appointment and prepares your document packet in the order required at the centre.',
  },
  {
    title: 'Attend your appointment',
    description:
      'Submit documents, pay embassy fees in person, and complete biometrics (fingerprints and photo) at the application centre.',
  },
  {
    title: 'Receive your visa',
    description:
      'Once approved, your passport is returned with a Schengen visa sticker. You are then ready to travel.',
  },
];

export const SCHENGEN_COMMON_DOCUMENTS: SchengenContentItem[] = [
  {
    title: 'Valid passport',
    description:
      'Issued within the last 10 years, valid at least 3 months beyond your planned departure, with at least two blank pages.',
  },
  {
    title: 'Passport photographs',
    description: 'Two recent photos meeting Schengen biometric specifications.',
  },
  {
    title: 'Completed Schengen application form',
    description: 'Signed and dated — generated through Hydra from your online answers.',
  },
  {
    title: 'Cover letter',
    description:
      'Outlines your personal details, purpose of visit, financial means, and intent to return home.',
  },
  {
    title: 'Travel insurance (minimum €30,000)',
    description: 'Valid across all Schengen states for your entire trip.',
  },
  {
    title: 'Flight reservations',
    description: 'Return or onward tickets and proof of intra-Schengen travel if applicable.',
  },
  {
    title: 'Accommodation proof',
    description: 'Hotel bookings or an invitation letter from your host.',
  },
  {
    title: 'Bank statements (last 3 months)',
    description: 'Showing sufficient funds to cover your stay.',
  },
  {
    title: 'Payslips (last 3 months)',
    description: 'Recent salary slips if you are employed.',
  },
  {
    title: 'Employer letter / no-objection letter',
    description:
      'Confirms your role, salary, approved leave, and that your employer has no objection to your trip.',
  },
  {
    title: 'Proof of UK residence',
    description: 'Valid BRP, visa, or Share Code if applying from the United Kingdom.',
  },
];

export const SCHENGEN_WHAT_YOU_GET: string[] = [
  'Completed Schengen visa application form',
  'Personalised document checklist for your situation',
  'Appointment booking at the VFS or consulate',
  'Document packet arranged in visa officer review order',
  'Guided upload and error checks before your appointment',
  'Email updates through each stage of the process',
];

/** Documents shown in the illustrative application packet preview (submission order). */
export const SCHENGEN_PACKET_PREVIEW_DOCUMENTS: SchengenPacketDocument[] = [
  {
    id: 'checklist',
    label: 'Application checklist',
    subtitle: 'Cover sheet & document index',
    accent: '#0d9488',
  },
  {
    id: 'form',
    label: 'Schengen visa form',
    subtitle: 'Completed & signed application',
    accent: '#2563eb',
  },
  {
    id: 'cover-letter',
    label: 'Cover letter',
    subtitle: 'Purpose of visit & ties to home',
    accent: '#7c3aed',
  },
  {
    id: 'passport',
    label: 'Passport copy',
    subtitle: 'Bio-data page & previous visas',
    accent: '#0891b2',
  },
  {
    id: 'photos',
    label: 'Photographs',
    subtitle: '2× Schengen-spec passport photos',
    accent: '#db2777',
  },
  {
    id: 'residence',
    label: 'UK residence proof',
    subtitle: 'BRP / visa / Share Code',
    accent: '#059669',
  },
  {
    id: 'flights',
    label: 'Flight reservations',
    subtitle: 'Return & onward itinerary',
    accent: '#ea580c',
  },
  {
    id: 'hotel',
    label: 'Accommodation',
    subtitle: 'Hotel booking or invitation',
    accent: '#ca8a04',
  },
  {
    id: 'insurance',
    label: 'Travel insurance',
    subtitle: '€30,000+ medical cover certificate',
    accent: '#16a34a',
  },
  {
    id: 'bank',
    label: 'Bank statements',
    subtitle: 'Last 3 months',
    accent: '#4f46e5',
  },
  {
    id: 'payslips',
    label: 'Payslips',
    subtitle: 'Last 3 months salary slips',
    accent: '#0e7490',
  },
  {
    id: 'employer',
    label: 'Employer letter',
    subtitle: 'No-objection & leave approval',
    accent: '#9333ea',
  },
  {
    id: 'appointment',
    label: 'Appointment confirmation',
    subtitle: 'VFS / consulate booking',
    accent: '#dc2626',
  },
];

export const SCHENGEN_REJECTION_REASONS: SchengenContentItem[] = [
  {
    title: 'Expired or soon-expiring passport',
    description: 'Applying with a passport that has expired or expires within 6 months of your return.',
  },
  {
    title: 'Insufficient funds',
    description: 'Bank statements or payslips do not show enough resources to support your stay.',
  },
  {
    title: 'Weak ties to home country',
    description: 'The consular officer is not convinced you will return after your visit.',
  },
  {
    title: 'Previous visa violations',
    description: 'Overstaying or breaching conditions on a prior Schengen or other visa.',
  },
  {
    title: 'Invalid or insufficient insurance',
    description: 'Travel medical insurance below €30,000 or not valid for all Schengen states.',
  },
  {
    title: 'Incomplete or inconsistent documents',
    description: 'Missing items, mismatched dates, or unclear travel purpose.',
  },
];

function withCountry(text: string, countryName: string): string {
  return text.replace(/\{\{country\}\}/g, countryName);
}

export function getSchengenFaqCategories(countryName: string): SchengenFaqCategory[] {
  const c = countryName;
  return [
    {
      id: 'general',
      label: 'General information',
      items: [
        {
          question: `Do UK residents need a visa to visit ${c}?`,
          answer: `Yes — most non-British UK residents need a Schengen short-stay visa to visit ${c}. British citizens can travel visa-free for tourism and short business visits of up to 90 days in any 180-day period.`,
        },
        {
          question: `How much does a ${c} Schengen visa cost from the UK?`,
          answer: `Government fees are typically €90 for adults, €45 for children aged 6–11, and free for children under 6. VFS or appointment centre service fees (around €40) are paid in person. Hydra charges a separate appointment booking and service fee shown at checkout.`,
        },
        {
          question: `Can I work or study on a ${c} tourist visa?`,
          answer: `No. A short-stay Schengen tourist visa does not permit employment or enrolment at a school or university in ${c} or elsewhere in the Schengen Area.`,
        },
        {
          question: 'How can I show strong ties to my home country?',
          answer:
            'Provide an employer letter confirming your role and approved leave, property ownership documents, family ties (marriage or birth certificates), business registration if self-employed, or school enrolment letters for students.',
        },
      ],
    },
    {
      id: 'eligibility',
      label: 'Eligibility & requirements',
      items: [
        {
          question: `What are the requirements for a ${c} Schengen visa from the UK?`,
          answer: `You typically need: a completed application form, passport photos, valid passport, cover letter, travel insurance (€30,000 minimum), flight and accommodation proof, bank statements and payslips, employer no-objection letter, and proof of UK residence. Additional documents may apply depending on your circumstances.`,
        },
        {
          question: 'What documents do minors need?',
          answer:
            'Minors need a consent letter signed by both parents or guardians, birth certificate, parents’ passport copies, proof of custody if applicable, and the standard travel and financial documents listed for adult applicants.',
        },
        {
          question: 'Is travel insurance mandatory?',
          answer:
            'Yes. Schengen visa rules require medical insurance with at least €30,000 coverage, valid in all Schengen countries for your entire trip.',
        },
        {
          question: 'Is a consular interview mandatory?',
          answer: `A separate interview is usually not required for standard ${c} short-stay applications. You attend the appointment centre for document submission and biometrics. An interview may be requested in exceptional cases.`,
        },
      ],
    },
    {
      id: 'process',
      label: 'Application process',
      items: [
        {
          question: `How do I apply for a ${c} visa with Hydra?`,
          answer:
            'Start your application on our website, complete the guided Schengen form, upload your documents, and pay the Hydra fees. We book your appointment and prepare your document packet. Attend the centre on your scheduled date for biometrics and embassy fee payment.',
        },
        {
          question: `What is the processing time for a ${c} visa?`,
          answer:
            'Decisions are usually made within 15 calendar days. Complex cases can take up to 45 days. Apply at least 30 days before travel to allow for processing and passport return.',
        },
        {
          question: 'What happens at the appointment centre?',
          answer:
            'You submit your documents in the order prepared by Hydra, pay government and centre fees (cash or card depending on location), and provide fingerprints and a photograph for biometrics.',
        },
      ],
    },
    {
      id: 'rejections',
      label: 'Rejections & appeals',
      items: [
        {
          question: `What can I do if my ${c} visa is refused?`,
          answer:
            'Review the refusal letter carefully. You may reapply with corrected documents or, for short-stay visas, submit a written appeal in French to the Deputy Director of Visas within the timeframe stated on your refusal notice. Consider addressing the specific grounds cited before reapplying.',
        },
      ],
    },
    {
      id: 'entry',
      label: 'Entry & exit',
      items: [
        {
          question: `How long can I stay in ${c} on a Schengen visa?`,
          answer:
            'A standard short-stay Schengen visa allows up to 90 days within any 180-day period across the Schengen Area. The exact validity and number of entries are decided by the consulate and printed on your visa sticker.',
        },
      ],
    },
  ];
}

export function getSchengenFaqs(countryName: string): SchengenFaqItem[] {
  return getSchengenFaqCategories(countryName).flatMap((cat) =>
    cat.items.map((item) => ({
      question: withCountry(item.question, countryName),
      answer: withCountry(item.answer, countryName),
    }))
  );
}
