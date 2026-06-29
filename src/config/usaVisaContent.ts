/** United States B-1/B-2 visitor visa product page content. */

import { PLATFORM_NAME } from './brand';
import type { VisaGuideContent, VisaGuideFaqItem } from '../types/visaGuideContent';

export const USA_VISA_QUICK_FACTS = {
  visaType: 'B-1/B-2 visitor visa (sticker in passport)',
  lengthOfStay: 'Determined by U.S. Customs & Border Protection at entry (often up to 6 months)',
  processingTime: 'Varies by embassy — interview scheduling is often the longest step',
  applyBeforeTravel: 'Start at least 2–3 months before planned travel',
} as const;

export const USA_VISA_GUIDE: VisaGuideContent = {
  processTitle: 'How to get your U.S. visitor visa (B-1/B-2)',
  processSubtitle: `${USA_VISA_QUICK_FACTS.applyBeforeTravel}. ${USA_VISA_QUICK_FACTS.processingTime}.`,
  stepBadgeClass: 'bg-indigo-600',
  applicationSteps: [
    {
      title: 'Confirm you need a visa',
      description:
        'Citizens of Visa Waiver Program countries travel with ESTA instead of a visa. Most other nationalities need a B-1/B-2 visa for tourism or family visits.',
    },
    {
      title: 'Complete the DS-160 form',
      description:
        'The online non-immigrant visa application collects your travel plans, background, and employment history. Hydra helps you prepare accurate, consistent answers.',
    },
    {
      title: 'Pay the visa application fee',
      description:
        'The MRV (Machine Readable Visa) fee is paid before you can schedule your embassy interview. Keep your receipt number.',
    },
    {
      title: 'Schedule your embassy interview',
      description:
        'Book an appointment at the U.S. embassy or consulate responsible for your residence. Wait times vary by location and season.',
    },
    {
      title: 'Attend your interview',
      description:
        'Bring your passport, DS-160 confirmation, appointment letter, photo, and supporting documents. A consular officer decides whether to approve your visa.',
    },
    {
      title: 'Collect your passport with visa',
      description:
        'If approved, your passport is returned with a B-1/B-2 visa foil. Check the validity and number of entries before travelling.',
    },
  ],
  coreDocuments: [
    {
      name: 'Valid passport',
      description:
        'Valid for at least 6 months beyond your intended stay in the United States (unless country-specific exceptions apply).',
    },
    {
      name: 'DS-160 confirmation page',
      description: 'Barcode confirmation page from your completed online application.',
    },
    {
      name: 'Visa appointment confirmation',
      description: 'Proof of your scheduled interview at the U.S. embassy or consulate.',
    },
    {
      name: 'Passport photograph',
      description: 'One photo meeting U.S. visa specifications if not already uploaded digitally.',
    },
    {
      name: 'Financial evidence',
      description:
        'Bank statements, tax returns, or payslips showing you can fund your trip without unauthorized employment.',
    },
    {
      name: 'Ties to home country',
      description:
        'Employment letter, property documents, family records, or business ownership demonstrating you intend to return home.',
    },
    {
      name: 'Travel itinerary (optional but helpful)',
      description: 'Flight reservations, hotel bookings, and a brief outline of your U.S. visit.',
    },
  ],
  entrySectionTitle: 'At the embassy & port of entry',
  entryRequirements: [
    'Arrive at the embassy with organised documents — officers may not review everything but you should be prepared.',
    'Answer interview questions clearly and consistently with your DS-160 answers.',
    'If approved, verify visa class (B-1/B-2), validity dates, and entries on the foil.',
    'At U.S. border control (CBP), officers decide your admitted length of stay — the visa does not guarantee entry.',
    'Carry evidence of funds and return travel when entering the United States.',
  ],
  borderTip:
    'A visa allows you to travel to a U.S. port of entry; CBP officers make the final admission decision. Visitor visas do not permit employment or study in the United States.',
  faqCategories: [
    {
      id: 'general',
      label: 'General information',
      items: [
        {
          question: 'What is a B-1/B-2 visa?',
          answer:
            'B-2 covers tourism and visiting family. B-1 covers certain business activities that do not involve receiving U.S. salary. Many applicants receive a combined B-1/B-2 visa.',
        },
        {
          question: 'How long can I stay in the United States?',
          answer:
            'The visa validity period allows you to request entry during those dates. CBP stamps your I-94 on arrival with the actual permitted stay — often up to 6 months for tourists.',
        },
        {
          question: 'What is ESTA and do I need a visa instead?',
          answer:
            'ESTA is electronic authorisation for citizens of Visa Waiver Program countries. If you are not eligible for ESTA, you generally need a B-1/B-2 visa for short visits.',
        },
      ],
    },
    {
      id: 'eligibility',
      label: 'Eligibility & interview',
      items: [
        {
          question: 'What does the consular officer look for?',
          answer:
            'They assess whether you are a genuine temporary visitor with strong ties abroad, sufficient funds, and a credible travel purpose under U.S. immigration law.',
        },
        {
          question: 'Do I need to speak English?',
          answer:
            'Interviews are commonly conducted in English, but interpreters may be available at some posts. Prepare to explain your trip clearly in either language.',
        },
        {
          question: 'Can my relatives in the U.S. sponsor me?',
          answer:
            'They can provide invitation letters and support documents, but you must still demonstrate your own ties to your home country and intent to return.',
        },
      ],
    },
    {
      id: 'process',
      label: 'Application process',
      items: [
        {
          question: `How does ${PLATFORM_NAME} help with a U.S. visa?`,
          answer:
            'We guide you through DS-160 preparation, document checklists, interview preparation, and appointment scheduling support where included in your plan.',
        },
        {
          question: 'How long does the process take?',
          answer:
            'DS-160 and fee payment can be done in days, but interview wait times vary widely by embassy — from weeks to several months in busy locations.',
        },
        {
          question: 'What if my visa is refused under 214(b)?',
          answer:
            'A 214(b) refusal means the officer was not convinced you would return home. Strengthen financial and ties evidence, address inconsistencies, and reapply when your circumstances change.',
        },
      ],
    },
    {
      id: 'entry-exit',
      label: 'Travel & entry',
      items: [
        {
          question: 'When should I book flights?',
          answer:
            'Many travellers book refundable flights after receiving their visa. Booking before approval carries financial risk if refused.',
        },
        {
          question: 'Can I visit Canada or Mexico and return to the U.S.?',
          answer:
            'Automatic re-entry rules depend on your visa, nationality, and CBP admission. Check current guidance before planning side trips.',
        },
      ],
    },
  ],
};

export function getUsaVisaFaqs(): VisaGuideFaqItem[] {
  return USA_VISA_GUIDE.faqCategories.flatMap((category) => category.items);
}
