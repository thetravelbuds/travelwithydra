/** Egypt e-Visa product page content. */

import { PLATFORM_NAME } from './brand';
import type { VisaGuideContent, VisaGuideFaqItem } from '../types/visaGuideContent';

export const EGYPT_DESTINATION_CODE = 'eg';

export function isEgyptDestination(countryCode?: string | null): boolean {
  return (countryCode || '').toLowerCase().trim() === EGYPT_DESTINATION_CODE;
}

export const EGYPT_EVISA_QUICK_FACTS = {
  entryType: 'Single entry (multiple-entry available for some nationalities)',
  lengthOfStay: '30 days maximum per visit',
  visaValidity: '90 days from issue',
  applicationChannel: '100% online — apply before you travel',
  applyBeforeTravel: 'Apply at least 7 days before departure',
} as const;

export const EGYPT_VISA_GUIDE: VisaGuideContent = {
  processTitle: 'How to get your Egypt e-Visa',
  processSubtitle: `${EGYPT_EVISA_QUICK_FACTS.applicationChannel}. ${EGYPT_EVISA_QUICK_FACTS.applyBeforeTravel}.`,
  stepBadgeClass: 'bg-primary-600',
  applicationSteps: [
    {
      title: 'Confirm you need an e-Visa',
      description:
        'Most visitors who are not visa-exempt must obtain an e-Visa before flying to Egypt. Check your nationality above to see requirements and fees.',
    },
    {
      title: 'Complete the online application',
      description:
        'Enter passport details, travel dates, and accommodation information. Upload a passport scan and photo where required. Hydra saves your progress as you go.',
    },
    {
      title: 'Document review & submission',
      description:
        'We verify passport validity, photo format, and travel dates before your application is sent to Egypt’s e-Visa system.',
    },
    {
      title: 'Download your approved e-Visa',
      description:
        'Approved visas are delivered by email. Print a copy for the airline and immigration — keep a backup on your phone.',
    },
  ],
  coreDocuments: [
    {
      name: 'Passport',
      description:
        'Valid at least 6 months from your date of arrival in Egypt, with at least one blank page.',
    },
    {
      name: 'Passport photograph',
      description: 'Recent colour photo meeting Egypt e-Visa specifications (white background).',
    },
    {
      name: 'Travel itinerary',
      description: 'Return or onward flight details and intended dates of entry and exit.',
    },
    {
      name: 'Accommodation information',
      description: 'Hotel reservation or address where you will stay in Egypt.',
    },
    {
      name: 'Email address',
      description: 'Used to deliver your e-Visa approval — must remain accessible during travel.',
    },
  ],
  entrySectionTitle: 'At the border',
  entryRequirements: [
    'Printed Egypt e-Visa approval letter or QR code document.',
    'Passport matching the application (minimum 6 months validity).',
    'Return or onward ticket (may be requested).',
    'Proof of accommodation.',
    'Sufficient funds for your stay (may be requested).',
  ],
  borderTip:
    'Apply before departure — visa on arrival is not guaranteed for all nationalities and can involve longer queues. Tourist e-Visas do not allow employment in Egypt.',
  faqCategories: [
    {
      id: 'general',
      label: 'General information',
      items: [
        {
          question: 'Do I need a visa to visit Egypt?',
          answer:
            'Most nationalities require a visa for tourism. Some regional passport holders may be exempt for short stays. Use our checker with your nationality to confirm.',
        },
        {
          question: 'What types of Egypt e-Visa are available?',
          answer:
            'Tourist single-entry visas are most common (30-day stay). Some nationalities may apply for multiple-entry visas for repeated visits within the validity period.',
        },
        {
          question: 'How long is an Egypt e-Visa valid?',
          answer:
            'Single-entry tourist e-Visas are typically valid for 90 days from the date of issue. You must enter Egypt within that window. Maximum stay is usually 30 days per entry.',
        },
        {
          question: 'Can I extend my stay in Egypt?',
          answer:
            'Extensions are handled by Egyptian immigration authorities in-country and are not guaranteed. Plan your trip within the permitted stay on your e-Visa.',
        },
      ],
    },
    {
      id: 'eligibility',
      label: 'Requirements',
      items: [
        {
          question: 'What are the passport requirements?',
          answer:
            'Your passport should be valid for at least 6 months from arrival and have at least one blank page for entry stamps.',
        },
        {
          question: 'Are vaccinations required?',
          answer:
            'No mandatory vaccinations for most travellers, but check official health guidance before travel. Yellow fever certificate may apply if arriving from certain countries.',
        },
        {
          question: 'Do children need their own e-Visa?',
          answer:
            'Yes. Each traveller, including infants, needs their own passport and visa if their nationality requires one.',
        },
      ],
    },
    {
      id: 'process',
      label: 'Application process',
      items: [
        {
          question: `How do I apply with ${PLATFORM_NAME}?`,
          answer:
            'Choose Egypt as your destination, complete the guided application, upload documents, pay government and service fees, and submit. We email you when your visa is approved.',
        },
        {
          question: 'How long does processing take?',
          answer:
            'Many applications are processed within a few business days. Apply at least one week before travel to allow for review or additional document requests.',
        },
        {
          question: 'What if my application is refused?',
          answer:
            'Review the refusal reason, correct any document or eligibility issues, and submit a new application. Ensure passport scans are clear and dates match your booking.',
        },
      ],
    },
    {
      id: 'entry-exit',
      label: 'Entry & travel',
      items: [
        {
          question: 'Which airports accept Egypt e-Visas?',
          answer:
            'Major international airports including Cairo, Hurghada, Sharm El Sheikh, and Luxor accept e-Visas for eligible nationalities. Confirm your arrival airport before booking.',
        },
        {
          question: 'Do I need printed copies?',
          answer:
            'Yes — airlines and immigration commonly require a printed e-Visa. Keep a digital copy as backup.',
        },
      ],
    },
  ],
};

export function getEgyptEvisaFaqs(): VisaGuideFaqItem[] {
  return EGYPT_VISA_GUIDE.faqCategories.flatMap((category) => category.items);
}
