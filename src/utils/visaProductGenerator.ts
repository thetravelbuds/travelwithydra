import { ALL_COUNTRIES } from './countries';
import { VisaProduct, generateStandardFAQs, generateCloudinaryUrls } from '../types/visaProduct';
import { getCountryNameFromCode } from '../lib/api/visaRequirements';
import { getVisaFeeForCountry, VISA_FEES } from '../data/visaFees';
import { isSchengenCountry } from './schengenCountries';
import { isUnitedStates } from './unitedStatesVisa';
import { SCHENGEN_REQUIRED_DOCUMENTS } from '../config/schengenPricing';
import { getMoroccoEvisaFaqs } from '../config/moroccoEvisaContent';
import { getTurkeyEvisaFaqs } from '../config/turkeyEvisaContent';
import { getEgyptEvisaFaqs } from '../config/egyptEvisaContent';
import { getUkVisaFaqs } from '../config/ukVisaContent';
import { getUsaVisaFaqs } from '../config/usaVisaContent';
import { getCanadaVisaFaqs } from '../config/canadaVisaContent';
import { getAustraliaVisaFaqs } from '../config/australiaVisaContent';
import { getNewZealandVisaFaqs } from '../config/newZealandVisaContent';
import { getSchengenFaqs } from '../config/schengenVisaContent';
import { isCanadaDestination } from '../config/canadaVisaContent';
import { isAustraliaDestination } from '../config/australiaVisaContent';
import { isNewZealandDestination } from '../config/newZealandVisaContent';

/**
 * Generate visa product data for a specific country
 */
export const generateVisaProductForCountry = (
  countryCode: string,
  cloudName: string = 'drdpxs3je'
): VisaProduct | null => {
  // Get country name from code
  const countryName = getCountryNameFromCode(countryCode);
  if (!countryName) return null;

  // Find country in our database
  const country = ALL_COUNTRIES.find(c => c.name === countryName);
  if (!country) return null;

  // Determine visa type based on country (in a real app, this would come from your visa requirements database)
  // This is a simplified example - you would replace this with actual data from your database
  const visaTypes: Record<string, VisaProduct['visaType']> = {
    // Visa-free examples
    'United States': 'visa-free',
    'Canada': 'visa-free',
    'United Kingdom': 'visa-free',
    'Japan': 'visa-free',
    'Singapore': 'visa-free',
    'New Zealand': 'visa-free',
    
    // eVisa examples
    'India': 'evisa',
    'Turkey': 'evisa',
    'Egypt': 'evisa',
    'Vietnam': 'evisa',
    'Cambodia': 'evisa',
    'Myanmar': 'evisa',
    
    'Morocco': 'evisa',
    'Malaysia': 'evisa',
    'Indonesia': 'evisa',
    'United Arab Emirates': 'evisa',
    'Kenya': 'evisa',
    'Saudi Arabia': 'evisa',
    
    // Visa on arrival examples
    'Thailand': 'visa-on-arrival',
    'Nepal': 'visa-on-arrival',
    'Laos': 'visa-on-arrival',
    
    // ETA examples
    'Sri Lanka': 'eta',
    'Australia': 'eta', // Note: Australia uses ETA
    
    // Visa required examples
    'China': 'visa-required',
    'Russia': 'visa-required',
    'Brazil': 'visa-required',
    'South Africa': 'visa-required'
  };

  // Countries we sell eVisas for use the eVisa product type
  for (const entry of VISA_FEES) {
    const match = ALL_COUNTRIES.find((c) => c.code.toLowerCase() === entry.countryCode);
    if (match) {
      visaTypes[match.name] = 'evisa';
    }
  }

  const isMorocco = country.code.toLowerCase() === 'ma';
  const isTurkey = country.code.toLowerCase() === 'tr';
  const isEgypt = country.code.toLowerCase() === 'eg';
  const isUk = country.code.toLowerCase() === 'gb';
  const isCanada = isCanadaDestination(country.code);
  const isAustralia = isAustraliaDestination(country.code);
  const isNewZealand = isNewZealandDestination(country.code);

  // Embassy sticker / TRV visas — not eVisa products
  if (isUk) visaTypes['United Kingdom'] = 'visa-required';
  if (isUnitedStates(country.code)) visaTypes['United States'] = 'visa-required';
  if (isCanada) visaTypes['Canada'] = 'visa-required';
  if (isAustralia) visaTypes['Australia'] = 'eta';
  if (isNewZealand) visaTypes['New Zealand'] = 'eta';

  // Assign visa types to all countries
  for (const c of ALL_COUNTRIES) {
    if (!visaTypes[c.name]) {
      visaTypes[c.name] = 'visa-required';
    }
  }

  // Default visa type if not specified in the map above
  let visaType: VisaProduct['visaType'] = visaTypes[country.name] || 'visa-required';
  const schengen = isSchengenCountry(country.code);
  const us = isUnitedStates(country.code);
  
  // Determine length of stay based on visa type
  let lengthOfStay = '';
  switch (visaType) {
    case 'visa-free':
      lengthOfStay = '90 days';
      break;
    case 'evisa':
      lengthOfStay = isMorocco
        ? '30 days per visit'
        : isTurkey
          ? 'Up to 30 or 90 days (nationality-dependent)'
          : isEgypt
            ? '30 days per visit'
            : '30 days';
      break;
    case 'visa-on-arrival':
      lengthOfStay = '15 days';
      break;
    case 'eta':
      lengthOfStay = '90 days';
      break;
    case 'visa-required':
      lengthOfStay = schengen
        ? "Visa officer's decision (7 days to 1 year)"
        : us
          ? 'As determined at U.S. entry'
          : isUk
            ? 'Up to 6 months per visit'
            : isCanada
              ? 'Up to 6 months per visit'
              : 'Varies';
      break;
  }

  // Determine visa validity based on visa type
  let visaValidity = '';
  switch (visaType) {
    case 'visa-free':
      visaValidity = '6 months from entry';
      break;
    case 'evisa':
      visaValidity = isMorocco
        ? '180 days from issue'
        : isTurkey
          ? '180 days from issue'
          : isEgypt
            ? '90 days from issue'
            : '90 days from issue';
      break;
    case 'visa-on-arrival':
      visaValidity = '15 days from entry';
      break;
    case 'eta':
      visaValidity = '1 year from issue';
      break;
    case 'visa-required':
      visaValidity = schengen
        ? "Visa officer's decision (up to 1 year typical)"
        : us
          ? 'As per visa foil validity'
          : isUk
            ? 'As per vignette (typically 6 months)'
            : isCanada
              ? 'Up to 10 years (multiple entry, at discretion)'
              : '90 days from issue';
      break;
    default:
      visaValidity = 'Varies';
      break;
  }

  // Determine entry type based on visa type
  let entryType: VisaProduct['entryType'] = 'single';
  if (['visa-free', 'eta'].includes(visaType)) {
    entryType = 'multiple';
  } else if (schengen || us || isCanada) {
    entryType = 'multiple';
  }

  // Generate processing time based on visa type
  const processingTime = {
    normal: us
      ? 'Interview wait times vary by embassy'
      : isUk
        ? 'Usually 3 weeks after biometrics'
        : isCanada
          ? 'Typically 75–90 days after biometrics'
          : isAustralia
            ? 'Usually within hours to 48 hours'
            : isNewZealand
              ? 'Usually minutes to 72 hours'
              : schengen
                ? 'At least 15 working days'
                : visaType === 'visa-required'
                  ? '10-15 business days'
                  : visaType === 'evisa'
                    ? isTurkey
                      ? 'Often within 24–48 hours'
                      : '3-5 business days'
                    : visaType === 'eta'
                      ? '24-48 hours'
                      : 'Immediate',
    express:
      schengen || us || isUk || isCanada
        ? undefined
        : visaType === 'evisa'
          ? '1 business day (add-on)'
          : visaType !== 'visa-free'
            ? '1-2 business days'
            : undefined,
  };

  const faqs = isMorocco
    ? getMoroccoEvisaFaqs()
    : isTurkey
      ? getTurkeyEvisaFaqs()
      : isEgypt
        ? getEgyptEvisaFaqs()
        : isUk
          ? getUkVisaFaqs()
          : isCanada
            ? getCanadaVisaFaqs()
            : isAustralia
              ? getAustraliaVisaFaqs()
              : isNewZealand
                ? getNewZealandVisaFaqs()
                : us
                  ? getUsaVisaFaqs()
                  : schengen
                    ? getSchengenFaqs(country.name)
                    : generateStandardFAQs(country.name, visaType, lengthOfStay);
  
  // Add country-specific FAQs
  switch (country.name) {
    case 'Morocco':
      break;
    case 'Japan':
      if (!schengen) {
        faqs.push(
          {
            question: 'Do I need to show proof of funds when entering Japan?',
            answer: 'While not always checked, it\'s recommended to have proof of sufficient funds for your stay in Japan, such as cash, credit cards, or bank statements.'
          },
          {
            question: 'Can I use my foreign driver\'s license in Japan?',
            answer: 'Most visitors cannot use their foreign driver\'s license in Japan. You\'ll need an International Driving Permit (IDP) issued in your home country before arrival.'
          }
        );
      }
      break;
  }

  const visaPrice = schengen ? 0 : getVisaFeeForCountry(country.name);

  const schengenDocuments = schengen
    ? [
        'Valid passport (6+ months validity)',
        'Passport-sized photograph',
        ...SCHENGEN_REQUIRED_DOCUMENTS.map((doc) => doc.name),
        'Proof of sufficient funds',
        'Completed Schengen application form',
      ]
    : [];

  const moroccoDocuments = isMorocco
    ? [
        { name: 'Passport', description: 'Valid 6+ months from arrival; clear bio-data page scan.' },
        {
          name: 'Passport photograph',
          description: 'Recent colour photo meeting Morocco e-Visa specifications.',
        },
        {
          name: 'Supporting permit or visa (if required)',
          description:
            'Qualifying UK residence permit, Share Code, or multi-entry visa under Morocco’s waiver program.',
        },
        {
          name: 'Travel insurance',
          description: 'Medical cover for your full stay — minimum £30,000 recommended.',
        },
        {
          name: 'Accommodation proof',
          description: 'Hotel booking or host invitation letter.',
        },
        {
          name: 'Return travel',
          description: 'Return or onward flight confirmation.',
        },
      ]
    : [];

  const turkeyDocuments = isTurkey
    ? [
        { name: 'Passport', description: 'Valid 60+ days beyond visa end; clear bio-data scan.' },
        {
          name: 'Supporting visa or permit (if required)',
          description: 'Valid US, UK, Schengen, or Ireland visa/residence on arrival date.',
        },
        { name: 'Email address', description: 'For delivery of your approved e-Visa.' },
      ]
    : [];

  const egyptDocuments = isEgypt
    ? [
        { name: 'Passport', description: 'Valid 6+ months from arrival with a blank page.' },
        { name: 'Passport photograph', description: 'Recent colour photo on white background.' },
        { name: 'Travel itinerary', description: 'Return flights and intended entry dates.' },
        { name: 'Accommodation', description: 'Hotel booking or host address in Egypt.' },
      ]
    : [];

  const ukDocuments = isUk
    ? [
        { name: 'Valid passport', description: 'Blank page for visa vignette.' },
        { name: 'Financial evidence', description: 'Bank statements covering 3–6 months.' },
        { name: 'Employment or study proof', description: 'Letter confirming your role and return.' },
        { name: 'Travel & accommodation plans', description: 'Itinerary, bookings, or host invitation.' },
      ]
    : [];

  const usDocuments = us
    ? [
        { name: 'Valid passport', description: '6+ months validity recommended beyond stay.' },
        { name: 'DS-160 confirmation', description: 'Barcode page from your online application.' },
        { name: 'Interview appointment letter', description: 'Embassy or consulate confirmation.' },
        { name: 'Financial & ties evidence', description: 'Funds and documents showing intent to return home.' },
      ]
    : [];

  const canadaDocuments = isCanada
    ? [
        { name: 'Valid passport', description: 'Valid for your entire intended stay in Canada.' },
        { name: 'Digital photograph', description: '35 × 45 mm, white background, IRCC specifications.' },
        { name: 'Family Information (IMM 5645)', description: 'Required for every applicant including children.' },
        { name: 'Proof of funds', description: 'Bank statements, payslips, and tax records.' },
        { name: 'Employment or study proof', description: 'Letter confirming role and return to home country.' },
        { name: 'Travel itinerary', description: 'Flights, accommodation, or host invitation.' },
      ]
    : [];

  const australiaDocuments = isAustralia
    ? [
        { name: 'Valid passport', description: 'Valid for your entire stay in Australia.' },
        { name: 'Digital photograph', description: 'Required for ETA; government photo specifications.' },
        { name: 'Email address', description: 'For visa grant notification.' },
        { name: 'Funds & itinerary', description: 'If requested — return tickets and financial evidence.' },
      ]
    : [];

  const newZealandDocuments = isNewZealand
    ? [
        { name: 'Valid passport', description: 'Valid 3+ months beyond planned departure from NZ.' },
        { name: 'Digital photograph', description: 'Passport-style photo via app or web upload.' },
        { name: 'Onward travel proof', description: 'Return or onward ticket required at check-in.' },
        { name: 'Proof of funds', description: 'Bank or card evidence if requested.' },
      ]
    : [];

  const structuredDocuments =
    moroccoDocuments.length ? moroccoDocuments
    : turkeyDocuments.length ? turkeyDocuments
    : egyptDocuments.length ? egyptDocuments
    : ukDocuments.length ? ukDocuments
    : usDocuments.length ? usDocuments
    : canadaDocuments.length ? canadaDocuments
    : australiaDocuments.length ? australiaDocuments
    : newZealandDocuments.length ? newZealandDocuments
    : schengen ? SCHENGEN_REQUIRED_DOCUMENTS.map((d) => ({ name: d.name, description: d.description }))
    : [];

  // Generate a product object with all required properties
  const product: VisaProduct = {
    countryCode: country.code,
    countryName: country.name,
    visaType: visaType,
    visaValidity: visaValidity,
    lengthOfStay: lengthOfStay,
    entryType: isMorocco || isEgypt ? 'single' : entryType,
    processingTime:
      isMorocco || isTurkey || isEgypt
        ? { normal: isTurkey ? 'Often within 24–48 hours' : '3-5 business days', express: '1 business day (add-on)' }
        : processingTime,
    faqs: faqs,
    images: generateCloudinaryUrls(country.code, cloudName)
  };

  // Add any additional properties needed for the UI
  return {
    ...product,
    id: `visa-${country.code}`,
    name: `${country.name} Visa`,
    price: visaPrice,
    currency: 'GBP', // Changed to GBP to match the service fee
    requirements: structuredDocuments.length
      ? structuredDocuments.map((d) => d.name)
      : [
      'Valid passport with at least 6 months validity',
      'Completed application form',
      visaType !== 'visa-free' ? 'Passport-sized photograph' : '',
      visaType === 'visa-required' ? 'Proof of accommodation' : '',
      visaType === 'visa-required' ? 'Proof of sufficient funds' : '',
      visaType === 'visa-required' ? 'Return ticket' : '',
      visaType === 'visa-required' ? 'Travel insurance' : '',
    ].filter(Boolean),
    documents: structuredDocuments.length
      ? structuredDocuments.map((d) => d.name)
      : schengen
      ? schengenDocuments
      : [
      'Passport',
      visaType !== 'visa-free' ? 'Passport-sized photograph' : '',
      visaType === 'visa-required' ? 'Travel itinerary' : '',
      visaType === 'visa-required' ? 'Hotel reservations' : '',
      visaType === 'visa-required' ? 'Bank statements' : '',
      visaType === 'visa-required' ? 'Travel insurance certificate' : '',
    ].filter(Boolean),
    documentsRequired: structuredDocuments.length ? structuredDocuments : undefined,
  } as VisaProduct;
};

/**
 * Generate visa product data for all countries
 */
export const generateAllVisaProducts = (
  cloudName: string = 'drdpxs3je'
): VisaProduct[] => {
  const products: VisaProduct[] = [];
  
  // Generate a visa product for each country in the ALL_COUNTRIES list
  ALL_COUNTRIES.forEach(country => {
    const product = generateVisaProductForCountry(country.code, cloudName);
    if (product) {
      products.push(product);
    }
  });
  
  return products;
};

/**
 * Get a list of all visa product paths
 */
export const getAllVisaProductPaths = (): string[] => {
  return ALL_COUNTRIES.map(country => `/visa/${country.code}`);
};
