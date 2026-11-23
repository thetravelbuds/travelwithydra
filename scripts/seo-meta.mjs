/**
 * Build-time SEO metadata for static HTML shells.
 * Keep titles/descriptions aligned with src/config/seo.ts.
 */
export const SITE_URL = 'https://travelwithydra.com';
export const SITE_NAME = 'Hydra';
export const BRAND_DISPLAY = 'Travel with Hydra';

export const DEFAULT_SEO = {
  path: '/',
  title: 'Morocco eVisa & Turkey eVisa Online | Apply with Hydra',
  description:
    'Apply for Morocco eVisa, Turkey eVisa, Malaysia eVisa and 40+ destinations online. Check requirements, fees, and processing times — guided applications with Hydra.',
  keywords:
    'morocco evisa, turkey evisa, evisa, online visa application, malaysia evisa, indonesia evisa',
};

/** Priority eVisa pages that get dedicated static HTML shells. */
export const VISA_SEO_PAGES = [
  {
    code: 'ma',
    name: 'Morocco',
    path: '/visa/ma',
    title: 'Morocco eVisa Application Online | Apply for Morocco eVisa — Hydra',
    description:
      'Apply for your Morocco eVisa online in minutes. See Morocco eVisa requirements, fees, processing time, documents, and insurance rules. Guided application with Hydra.',
    keywords:
      'morocco evisa, morocco e visa, morocco visa online, apply morocco evisa, morocco tourist visa, morocco evisa requirements, morocco evisa application',
    h1: 'Morocco eVisa Application Online',
    intro:
      'Apply for a Morocco eVisa online with Hydra. Check Morocco eVisa requirements, government fees, processing time, travel insurance rules, and required documents — then complete a guided application with passport scan and secure payment.',
    faqs: [
      {
        q: 'Do I need a visa to visit Morocco?',
        a: 'It depends on your nationality. British passport holders usually do not need a visa for short tourism visits. Many other nationalities must apply for a Morocco eVisa online before travel.',
      },
      {
        q: 'How do I apply for a Morocco eVisa online?',
        a: 'Choose your nationality on our Morocco eVisa page, complete the guided form, upload your passport and photo, pay securely, and receive your approved eVisa by email.',
      },
      {
        q: 'What documents are required for a Morocco eVisa?',
        a: 'Typically a passport valid 6+ months, passport photo, proof of accommodation, return ticket, travel insurance with at least £30,000 medical cover, and supporting residence or visa documents if applicable.',
      },
      {
        q: 'How long is a Morocco eVisa valid?',
        a: 'The standard tourist eVisa is usually valid for 180 days from issue, allows a single entry, and permits a stay of up to 30 days.',
      },
      {
        q: 'Is the Morocco eVisa process fully online?',
        a: 'Yes. You apply online, upload digital documents, and receive your eVisa by email — no embassy visit or passport mailing is required for the eVisa route.',
      },
    ],
  },
  {
    code: 'tr',
    name: 'Turkey',
    path: '/visa/tr',
    title: 'Turkey eVisa Application Online | Apply for Turkey eVisa — Hydra',
    description:
      'Get your Turkey eVisa online quickly. Check Turkey eVisa requirements, supporting visa rules, fees, and processing time. Apply with passport OCR and step-by-step guidance from Hydra.',
    keywords:
      'turkey evisa, turkey e visa, turkey visa online, apply turkey evisa, turkish evisa, turkey evisa requirements, turkey evisa application',
    h1: 'Turkey eVisa Application Online',
    intro:
      'Apply for a Turkey eVisa online with Hydra. Confirm eligibility (including supporting US, UK, Schengen, or Ireland visas where required), check fees and processing time, then submit a guided application with clear document checks.',
    faqs: [
      {
        q: 'Do I need a visa to visit Turkey?',
        a: 'It depends on your nationality. Some travellers are visa-exempt for short stays. Many others can apply for a Turkey eVisa online. Use the eligibility checker on this page for your passport.',
      },
      {
        q: 'Who needs a supporting US, UK, Schengen, or Ireland visa for Turkey eVisa?',
        a: 'Many nationalities that are not visa-exempt must hold a valid sticker visa or residence permit from the US, UK, a Schengen country, or Ireland. It must be valid on your arrival date in Turkey.',
      },
      {
        q: 'How long can I stay in Turkey on an eVisa?',
        a: 'Stay limits depend on nationality — commonly up to 30 or 90 days within the validity period shown on your eVisa approval.',
      },
      {
        q: 'How do I apply for a Turkey eVisa with Hydra?',
        a: 'Check eligibility, complete the online form, upload passport details and supporting documents if required, pay securely, and receive your approved Turkey eVisa by email.',
      },
      {
        q: 'How soon should I apply for a Turkey eVisa?',
        a: 'Apply at least 48 hours before departure. Applying earlier is recommended in case documents need correction.',
      },
    ],
  },
  {
    code: 'my',
    name: 'Malaysia',
    path: '/visa/my',
    title: 'Malaysia eVisa Application Online | Apply for Malaysia eVisa — Hydra',
    description:
      'Apply for Malaysia eVisa online. Check Malaysia visa requirements, fees, and processing time with guided support from Hydra.',
    keywords: 'malaysia evisa, malaysia visa online, apply malaysia evisa',
    h1: 'Malaysia eVisa Application Online',
    intro:
      'Apply for a Malaysia eVisa online with Hydra. Review requirements, fees, and documents, then complete a guided application.',
    faqs: [],
  },
  {
    code: 'id',
    name: 'Indonesia',
    path: '/visa/id',
    title: 'Indonesia eVisa Application Online | Apply for Indonesia eVisa — Hydra',
    description:
      'Apply for Indonesia eVisa online. Check Indonesia visa requirements, stay length, and fees with Hydra guidance.',
    keywords: 'indonesia evisa, bali visa, indonesia visa online',
    h1: 'Indonesia eVisa Application Online',
    intro:
      'Apply for an Indonesia eVisa online with Hydra — requirements, fees, and step-by-step document guidance.',
    faqs: [],
  },
  {
    code: 'eg',
    name: 'Egypt',
    path: '/visa/eg',
    title: 'Egypt eVisa Application Online | Apply for Egypt eVisa — Hydra',
    description:
      'Apply for Egypt eVisa online. View Egypt visa requirements, processing time, and government fees.',
    keywords: 'egypt evisa, egypt visa online, apply egypt evisa',
    h1: 'Egypt eVisa Application Online',
    intro: 'Apply for an Egypt eVisa online with Hydra. Check requirements, fees, and processing times.',
    faqs: [],
  },
  {
    code: 'ae',
    name: 'UAE',
    path: '/visa/ae',
    title: 'UAE eVisa Application Online | Dubai Visa — Hydra',
    description:
      'Apply for UAE eVisa online for Dubai and the Emirates. Requirements, fees, and guided application support from Hydra.',
    keywords: 'uae evisa, dubai visa online, apply uae evisa',
    h1: 'UAE eVisa Application Online',
    intro: 'Apply for a UAE eVisa online with Hydra for Dubai and the Emirates.',
    faqs: [],
  },
  {
    code: 'vn',
    name: 'Vietnam',
    path: '/visa/vn',
    title: 'Vietnam eVisa Application Online | Apply for Vietnam eVisa — Hydra',
    description:
      'Apply for Vietnam eVisa online. Check Vietnam visa requirements, stay duration, and fees.',
    keywords: 'vietnam evisa, vietnam visa online, apply vietnam evisa',
    h1: 'Vietnam eVisa Application Online',
    intro: 'Apply for a Vietnam eVisa online with Hydra — requirements, fees, and guided steps.',
    faqs: [],
  },
];

export const STATIC_SEO_PAGES = [
  {
    path: '/visa-checker',
    title: 'Visa Eligibility Checker | Do I Need an eVisa? — Hydra',
    description:
      'Check if you need a Morocco eVisa, Turkey eVisa, or another visa. Instant eligibility results by passport and destination.',
    keywords: 'visa checker, do i need a visa, morocco evisa, turkey evisa',
  },
  {
    path: '/visa/browse',
    title: 'Browse eVisa Destinations | Morocco, Turkey & More — Hydra',
    description:
      'Browse eVisa destinations including Morocco eVisa, Turkey eVisa, Malaysia, Indonesia, Egypt, UAE, and Vietnam.',
    keywords: 'evisa destinations, morocco evisa, turkey evisa',
  },
  {
    path: '/pricing',
    title: 'Pricing | Hydra eVisa Assistance Plans',
    description:
      'Simple pricing for Hydra eVisa assistance — Morocco, Turkey, and 40+ destinations. Free basic plan available.',
    keywords: 'evisa pricing, hydra pricing, visa application fees',
  },
];

/** Legacy URL aliases seen in Search Console — consolidate onto /visa/{cc}. */
export const LEGACY_REDIRECTS = [
  { from: '/en/morocco-e-visa', to: '/visa/ma' },
  { from: '/en/morocco-e-visa/', to: '/visa/ma' },
  { from: '/en-US/morocco-e-visa', to: '/visa/ma' },
  { from: '/en-US/morocco-e-visa/', to: '/visa/ma' },
  { from: '/en/turkey-e-visa', to: '/visa/tr' },
  { from: '/en/turkey-e-visa/', to: '/visa/tr' },
  { from: '/en-US/turkey-e-visa', to: '/visa/tr' },
  { from: '/en-US/turkey-e-visa/', to: '/visa/tr' },
  { from: '/en/malaysia-e-visa', to: '/visa/my' },
  { from: '/en/malaysia-e-visa/', to: '/visa/my' },
  { from: '/en/indonesia-e-visa', to: '/visa/id' },
  { from: '/en/indonesia-e-visa/', to: '/visa/id' },
  { from: '/en/egypt-e-visa', to: '/visa/eg' },
  { from: '/en/egypt-e-visa/', to: '/visa/eg' },
  { from: '/en/vietnam-e-visa', to: '/visa/vn' },
  { from: '/en/vietnam-e-visa/', to: '/visa/vn' },
  { from: '/en/united-arab-emirates-e-visa', to: '/visa/ae' },
  { from: '/en/united-arab-emirates-e-visa/', to: '/visa/ae' },
];
