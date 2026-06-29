import { SITE_URL, absoluteUrl } from '../config/seo';
import { PLATFORM_NAME } from '../config/brand';

export function buildVisaServiceJsonLd(countryCode: string, countryName: string) {
  const url = absoluteUrl(`/visa/${countryCode.toLowerCase()}`);
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
