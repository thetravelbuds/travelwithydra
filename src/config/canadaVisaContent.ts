/** Canada visitor visa (TRV) and eTA product page content. */

import { PLATFORM_NAME } from './brand';
import type { VisaGuideContent, VisaGuideFaqItem } from '../types/visaGuideContent';

export const CANADA_DESTINATION_CODE = 'ca';

export function isCanadaDestination(countryCode?: string | null): boolean {
  const code = (countryCode || '').toLowerCase().trim();
  return code === CANADA_DESTINATION_CODE || code === 'canada';
}

export const CANADA_VISA_QUICK_FACTS = {
  visitorVisaType: 'Temporary Resident Visa (TRV) — sticker in passport',
  etaType: 'Electronic Travel Authorization (eTA) — for visa-exempt travellers arriving by air',
  lengthOfStay: 'Up to 6 months per visit (officer decides at border)',
  visitorValidity: 'Up to 10 years (multiple entry, at officer discretion)',
  etaValidity: 'Up to 5 years or until passport expiry',
  processingTime: 'Typically 75–90 days for TRV; eTA often within minutes',
  applyBeforeTravel: 'Apply at least 3–4 months before travel for a visitor visa',
  governmentFeeTrv: 'CAD $100 application fee + CAD $85 biometrics (per person)',
  governmentFeeEta: 'CAD $7',
} as const;

export const CANADA_VISA_GUIDE: VisaGuideContent = {
  processTitle: 'How to get your Canada visitor visa',
  processSubtitle: `${CANADA_VISA_QUICK_FACTS.applyBeforeTravel}. ${CANADA_VISA_QUICK_FACTS.processingTime}.`,
  stepBadgeClass: 'bg-primary-600',
  applicationSteps: [
    {
      title: 'Confirm whether you need a TRV or eTA',
      description:
        'British and many other passport holders flying to Canada need only an eTA (CAD $7, online). Visa-required nationalities need a Temporary Resident Visa (TRV) before travel.',
    },
    {
      title: 'Complete the online application',
      description:
        'Create an IRCC account, answer eligibility questions, and upload supporting documents. Hydra helps you prepare a consistent application and tailored document checklist.',
    },
    {
      title: 'Pay government fees',
      description:
        'Visitor visa: CAD $100 application fee plus CAD $85 biometrics. eTA: CAD $7. Fees are paid through the official IRCC portal.',
    },
    {
      title: 'Provide biometrics (TRV applicants)',
      description:
        'Book an appointment at a Visa Application Centre (VAC) to submit fingerprints and a photograph. Biometrics are valid for 10 years.',
    },
    {
      title: 'Wait for a decision',
      description:
        'IRCC reviews your application. Processing times vary by nationality, application volume, and complexity — often 75–90 days for visitor visas.',
    },
    {
      title: 'Receive your visa or eTA',
      description:
        'Approved TRVs are placed as a sticker in your passport (collect from the VAC or via courier). Approved eTAs are linked electronically to your passport.',
    },
  ],
  coreDocuments: [
    {
      name: 'Valid passport',
      description:
        'Current and any previous passports showing travel history. Must be valid for your entire intended stay.',
    },
    {
      name: 'Digital photograph',
      description: '35 × 45 mm on a plain white background meeting IRCC photo specifications.',
    },
    {
      name: 'Family Information form (IMM 5645)',
      description: 'Required for every applicant, including children.',
    },
    {
      name: 'Proof of funds',
      description:
        'Bank statements (typically 6 months), payslips, and tax returns showing you can support your trip without working in Canada.',
    },
    {
      name: 'Employment or study proof',
      description:
        'Employer letter, offer letter, NOC, business registration, or enrolment letter demonstrating ties to your home country.',
    },
    {
      name: 'Travel plans',
      description: 'Itinerary, flight reservations, and accommodation proof or a host invitation letter.',
    },
    {
      name: 'Previous visas (if any)',
      description: 'Copies of prior Canada, U.S., or Schengen visas can strengthen your application.',
    },
  ],
  entrySectionTitle: 'At the VAC and Canadian border',
  entryRequirements: [
    'Attend your biometrics appointment with passport and appointment letter (TRV route).',
    'Collect your passport with the visa sticker once approved, and verify name, dates, and entries.',
    'At Canadian border services, officers decide your permitted length of stay (up to 6 months typical).',
    'Carry proof of funds, return travel, and accommodation even after your visa is granted.',
    'eTA holders must travel with the same passport used in the application.',
  ],
  borderTip:
    'A visa or eTA allows you to travel to Canada — it does not guarantee entry. Border officers assess your purpose, funds, and intent to leave at the end of your visit.',
  rejectionReasons: [
    {
      name: 'Insufficient funds',
      description: 'Bank statements do not convincingly cover flights, accommodation, and daily expenses.',
    },
    {
      name: 'Weak ties to home country',
      description: 'Limited employment, family, or property evidence suggesting you may not return home.',
    },
    {
      name: 'Incomplete or inconsistent application',
      description: 'Missing documents, conflicting answers, or unclear travel purpose.',
    },
    {
      name: 'Previous immigration violations',
      description: 'Overstays, refusals, or criminal history affecting admissibility.',
    },
  ],
  faqCategories: [
    {
      id: 'general',
      label: 'General information',
      items: [
        {
          question: 'Do I need a visa to visit Canada?',
          answer:
            'It depends on your nationality. Many passport holders need a visitor visa (TRV). Citizens of visa-exempt countries (including the UK) generally need an eTA when arriving by air. Land or sea entry may have different rules.',
        },
        {
          question: 'How long can I stay in Canada?',
          answer:
            'Visitor visas typically allow stays of up to 6 months per visit. The Canada Border Services Agency officer decides the exact duration when you arrive.',
        },
        {
          question: 'What types of Canada visas exist?',
          answer:
            'Common routes include the visitor visa (tourism, family, short business), transit visa (layovers under 48 hours), work permit, and study permit. This page focuses on short-term visitor travel.',
        },
        {
          question: 'What is the difference between a TRV and an eTA?',
          answer:
            'A TRV is a physical sticker in your passport for visa-required nationals. An eTA is an electronic authorization linked to your passport for visa-exempt air travellers — faster and cheaper (CAD $7).',
        },
      ],
    },
    {
      id: 'eligibility',
      label: 'Eligibility & requirements',
      items: [
        {
          question: 'What are the eligibility requirements for a Canada visitor visa?',
          answer:
            'You need a valid passport, no serious criminal or immigration violations, sufficient funds for your stay, strong ties to your home country, and convincing proof you will leave Canada after your visit.',
        },
        {
          question: 'Is there a minimum bank balance?',
          answer:
            'IRCC does not publish a fixed amount. Your funds should realistically cover flights, accommodation, insurance, and daily expenses for your entire trip length.',
        },
        {
          question: 'Do I need travel insurance?',
          answer:
            'Travel insurance is not mandatory for a Canada visa application, but it is strongly recommended to cover medical emergencies and trip disruption abroad.',
        },
        {
          question: 'What if I have a criminal record?',
          answer:
            'You may still be admissible through deemed rehabilitation, individual rehabilitation, a record suspension, or a temporary resident permit. Rehabilitation applications can take over a year — start early.',
        },
      ],
    },
    {
      id: 'process',
      label: 'Application process',
      items: [
        {
          question: 'How long does Canada visa processing take?',
          answer:
            'Visitor visas often take 75–90 days, though times vary by nationality and season. Factors include application volume, complexity, holidays, and prior refusals. Check IRCC processing-time tools for current estimates.',
        },
        {
          question: 'Do I need an interview?',
          answer:
            'Interviews are not usually mandatory, but IRCC may request one to clarify your application. You must still attend a VAC for biometrics on the TRV route.',
        },
        {
          question: 'What are biometrics?',
          answer:
            'Fingerprints and a digital photograph collected at a Visa Application Centre. They help verify your identity and are also checked on entry to Canada.',
        },
        {
          question: `How does ${PLATFORM_NAME} help with a Canada visa?`,
          answer:
            'We provide a personalised document checklist, guided form preparation, appointment support, and organised document packets for your VAC submission.',
        },
      ],
    },
    {
      id: 'fees',
      label: 'Fees & validity',
      items: [
        {
          question: 'What are the Canada visitor visa fees?',
          answer:
            'The government application fee is CAD $100 per person, plus CAD $85 for biometrics. Multiple-entry visas valid up to 10 years may be granted at the officer’s discretion. Hydra service fees are shown at checkout.',
        },
        {
          question: 'How will I receive my visa?',
          answer:
            'After approval, your passport is returned with a visa sticker from the VAC — by courier or in person. Double-check your name, passport number, and validity dates before travelling.',
        },
      ],
    },
    {
      id: 'entry-exit',
      label: 'Entry & stay rules',
      items: [
        {
          question: 'Can I work or study on a visitor visa?',
          answer:
            'No. A visitor visa does not permit employment or enrolment at a Canadian school. You may apply for a work permit in limited circumstances while in Canada, but cannot convert a visit visa into a work visa automatically.',
        },
        {
          question: 'Can I extend my stay in Canada?',
          answer:
            'You may apply to extend visitor status from inside Canada before your authorized stay ends. Extensions are not guaranteed.',
        },
      ],
    },
  ],
};

export function getCanadaVisaFaqs(): VisaGuideFaqItem[] {
  return CANADA_VISA_GUIDE.faqCategories.flatMap((category) => category.items);
}
