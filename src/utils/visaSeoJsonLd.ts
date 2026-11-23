import { SITE_URL, absoluteUrl } from '../config/seo';
import { PLATFORM_NAME } from '../config/brand';
import { getVisaProductPath } from '../config/visaSlugs';

export function buildVisaServiceJsonLd(countryCode: string, countryName: string) {
  const url = absoluteUrl(getVisaProductPath(countryCode));
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${countryName} eVisa Application`,
    description: `Online ${countryName} eVisa application service with requirement checks, document upload, and guided processing.`,
    url,
    provider: {
      '@type': 'Organization',
      name: PLATFORM_NAME,
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'Country',
      name: countryName,
    },
    serviceType: 'Electronic visa application',
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: PLATFORM_NAME,
    url: SITE_URL,
    description:
      'Apply for eVisas online — Morocco, Turkey, Malaysia, Indonesia and 40+ destinations.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/visa-checker?destination={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqPageJsonLd(
  faqs: Array<{ question: string; answer: string }>
) {
  if (!faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildHowToJsonLd(
  countryName: string,
  steps: Array<{ title: string; description: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to apply for a ${countryName} eVisa online`,
    description: `Step-by-step guide to applying for a ${countryName} eVisa with ${PLATFORM_NAME}.`,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.description,
    })),
  };
}
