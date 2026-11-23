/** Site-wide SEO configuration and per-country eVisa page metadata. */

import { PLATFORM_NAME } from './brand';
import { getVisaProductPath } from './visaSlugs';

export const SITE_URL = 'https://travelwithydra.com';
export const SITE_NAME = PLATFORM_NAME;

export const DEFAULT_SEO = {
  title: `Morocco eVisa & Turkey eVisa Online | Apply with ${PLATFORM_NAME}`,
  description:
    `Apply for Morocco eVisa, Turkey eVisa, Malaysia eVisa and 40+ destinations online with ${PLATFORM_NAME}. Check requirements, fees, and processing times — then apply with guided support.`,
  keywords:
    'morocco evisa, turkey evisa, evisa, malaysia evisa, indonesia evisa, online visa application, travel visa',
};

/** High-intent destinations — used for sitemap priority, footer links, and landing internal links. */
export const PRIORITY_EVISA_DESTINATIONS = [
  { code: 'ma', name: 'Morocco', anchor: 'Morocco eVisa' },
  { code: 'tr', name: 'Turkey', anchor: 'Turkey eVisa' },
  { code: 'my', name: 'Malaysia', anchor: 'Malaysia eVisa' },
  { code: 'id', name: 'Indonesia', anchor: 'Indonesia eVisa' },
  { code: 'eg', name: 'Egypt', anchor: 'Egypt eVisa' },
  { code: 'ae', name: 'UAE', anchor: 'UAE eVisa' },
  { code: 'vn', name: 'Vietnam', anchor: 'Vietnam eVisa' },
] as const;

/** Unique SEO copy for priority countries (targets high-volume search queries). */
const VISA_SEO_OVERRIDES: Record<
  string,
  { title: string; description: string; keywords: string }
> = {
  ma: {
    title: `Morocco eVisa Application Online | Apply for Morocco eVisa — ${PLATFORM_NAME}`,
    description:
      `Apply for your Morocco eVisa online in minutes. See Morocco eVisa requirements, fees, processing time, documents, and insurance rules. ${PLATFORM_NAME} guides you through passport scan, upload, and payment.`,
    keywords:
      'morocco evisa, morocco e visa, morocco visa online, apply morocco evisa, morocco tourist visa, morocco evisa requirements, morocco evisa application',
  },
  tr: {
    title: `Turkey eVisa Application Online | Apply for Turkey eVisa — ${PLATFORM_NAME}`,
    description:
      `Get your Turkey eVisa online quickly. Check Turkey eVisa requirements, supporting visa rules, government fee, and processing time. Apply with passport OCR and step-by-step guidance from ${PLATFORM_NAME}.`,
    keywords:
      'turkey evisa, turkey e visa, turkey visa online, apply turkey evisa, turkish evisa, turkey evisa requirements, turkey evisa application',
  },
  my: {
    title: `Malaysia eVisa & MDAC Online | Malaysia Visa Application — ${PLATFORM_NAME}`,
    description:
      `Apply for Malaysia eVisa and travel authorization online. Requirements, fees, and fast processing with ${PLATFORM_NAME} — your guided Malaysia visa application.`,
    keywords: 'malaysia evisa, malaysia visa online, apply malaysia evisa, malaysia tourist visa',
  },
  id: {
    title: `Indonesia eVisa Application Online | Apply for Indonesia Visa — ${PLATFORM_NAME}`,
    description:
      'Apply for Indonesia eVisa online. Check Indonesia visa requirements, stay length, and fees. Complete your application with document upload and Hydra AI support.',
    keywords: 'indonesia evisa, indonesia visa online, apply indonesia evisa, bali visa',
  },
  eg: {
    title: `Egypt eVisa Application Online | Egypt Visa — ${PLATFORM_NAME}`,
    description:
      'Apply for Egypt eVisa online. View requirements, processing time, and government fees for your Egypt tourist or business visa application.',
    keywords: 'egypt evisa, egypt visa online, apply egypt evisa',
  },
  gb: {
    title: `UK Visitor Visa Application Online | Standard Visitor Visa — ${PLATFORM_NAME}`,
    description:
      `Apply for a UK Standard Visitor visa with guided forms, document checklists, and biometrics support from ${PLATFORM_NAME}.`,
    keywords: 'uk visitor visa, uk visa application, standard visitor visa, apply uk visa',
  },
  us: {
    title: `US Visitor Visa Application | B-1/B-2 Visa Guide — ${PLATFORM_NAME}`,
    description:
      `Prepare your U.S. B-1/B-2 visitor visa application — DS-160 guidance, document checklists, and interview preparation with ${PLATFORM_NAME}.`,
    keywords: 'us visitor visa, b1 b2 visa, ds-160, us visa application',
  },
  ca: {
    title: `Canada Visitor Visa Application | TRV & eTA Guide — ${PLATFORM_NAME}`,
    description:
      `Apply for a Canada visitor visa (TRV) or check eTA requirements. Fees, processing times, biometrics, and document checklists with ${PLATFORM_NAME}.`,
    keywords: 'canada visitor visa, canada trv, canada eta, apply canada visa',
  },
  au: {
    title: `Australia Visa from UK | ETA & eVisitor Guide — ${PLATFORM_NAME}`,
    description:
      `Get your Australia ETA, eVisitor, or visitor visa. Requirements, fees, processing time, and guided application support from ${PLATFORM_NAME}.`,
    keywords: 'australia visa uk, australia eta, evisitor 651, apply australia visa',
  },
  nz: {
    title: `New Zealand Visa from UK | NZeTA & Visitor Visa — ${PLATFORM_NAME}`,
    description:
      `Apply for New Zealand NZeTA or visitor visa online. IVL fees, documents, processing time, and traveller declaration guidance from ${PLATFORM_NAME}.`,
    keywords: 'new zealand visa, nzeta, new zealand visitor visa, apply nz visa',
  },
  ae: {
    title: `UAE eVisa Application Online | Dubai & UAE Visa — ${PLATFORM_NAME}`,
    description:
      `Apply for UAE eVisa online for Dubai and the Emirates. Requirements, fees, and guided application support from ${PLATFORM_NAME}.`,
    keywords: 'uae evisa, dubai visa online, apply uae evisa',
  },
  vn: {
    title: `Vietnam eVisa Application Online | Vietnam Visa — ${PLATFORM_NAME}`,
    description:
      'Apply for Vietnam eVisa online. Check Vietnam visa requirements, stay duration, and fees with step-by-step application guidance.',
    keywords: 'vietnam evisa, vietnam visa online, apply vietnam evisa',
  },
  ke: {
    title: `Kenya eVisa Application Online | Kenya Visa — ${PLATFORM_NAME}`,
    description:
      `Apply for Kenya eVisa online for tourism or business. Requirements, processing time, and fees — apply with ${PLATFORM_NAME}.`,
    keywords: 'kenya evisa, kenya visa online, apply kenya evisa',
  },
  lk: {
    title: `Sri Lanka ETA Application Online | Sri Lanka Visa — ${PLATFORM_NAME}`,
    description:
      `Apply for Sri Lanka ETA online. Electronic travel authorization requirements, fees, and fast application with ${PLATFORM_NAME}.`,
    keywords: 'sri lanka eta, sri lanka visa online, apply sri lanka eta',
  },
  sa: {
    title: `Saudi Arabia eVisa Application Online | Saudi Visa — ${PLATFORM_NAME}`,
    description:
      'Apply for Saudi Arabia eVisa online. Tourism and Umrah visa requirements, fees, and guided application support.',
    keywords: 'saudi arabia evisa, saudi visa online, apply saudi evisa',
  },
};

export interface PageSeo {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  noindex?: boolean;
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function getVisaPageSeo(countryCode: string, countryName: string): PageSeo {
  const code = countryCode.toLowerCase().trim();
  const canonicalPath = getVisaProductPath(code);
  const override = VISA_SEO_OVERRIDES[code];
  if (override) {
    return {
      ...override,
      canonicalPath,
    };
  }

  return {
    title: `${countryName} eVisa Application Online | ${countryName} Visa — ${PLATFORM_NAME}`,
    description: `Apply for your ${countryName} eVisa online with ${PLATFORM_NAME}. Check ${countryName} visa requirements, government fees, processing time, and required documents. Fast, guided online application.`,
    keywords: `${countryName.toLowerCase()} evisa, ${countryName.toLowerCase()} visa online, apply ${countryName.toLowerCase()} evisa`,
    canonicalPath,
  };
}

export const PRIORITY_EVISA_CODES = PRIORITY_EVISA_DESTINATIONS.map((d) => d.code);
