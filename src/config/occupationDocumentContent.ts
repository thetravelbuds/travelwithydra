import type {
  OccupationChecklistConfig,
  OccupationDocumentItem,
  OccupationDocumentSection,
  OccupationProfile,
  OccupationProfileId,
} from '../types/occupationDocuments';

const PASSPORT_ITEMS: OccupationDocumentItem[] = [
  { id: 'passport-front', label: 'Passport — photo page' },
  { id: 'passport-back', label: 'Passport — back cover / endorsements page' },
];

const ADDRESS_PROOF: OccupationDocumentItem = {
  id: 'address-proof',
  label: 'Proof of address',
  hint: 'Utility bill, council tax, or tenancy agreement (usually within 3 months)',
};

const BANK_STATEMENTS_PERSONAL: OccupationDocumentItem = {
  id: 'bank-personal',
  label: 'Personal bank statements',
  hint: 'Last 6 months, showing regular income and sufficient balance',
};

const RESIDENCE_ID: OccupationDocumentItem = {
  id: 'residence-id',
  label: 'Proof of legal residence',
  hint: 'Valid visa, BRP, residence permit, or Share Code if applying from abroad',
};

function sharedAdditional(destinationLabel: string): OccupationDocumentSection {
  return {
    kind: 'additional',
    title: 'If this applies to you',
    subtitle: 'Include only when relevant to your trip',
    items: [
      {
        id: 'marriage-cert',
        label: 'Marriage certificate',
        hint: 'If you are married and travelling with or visiting a spouse',
      },
      {
        id: 'invitation-letter',
        label: 'Invitation letter from your host',
        hint: `If you are staying with friends or family in ${destinationLabel}`,
      },
      {
        id: 'sponsorship-letter',
        label: 'Sponsorship / financial support letter',
        hint: 'If someone else is funding your trip or your balance is below the typical threshold',
      },
    ],
  };
}

function sharedOptional(regionLabel: string): OccupationDocumentSection {
  return {
    kind: 'optional',
    title: 'Strengthen your application',
    subtitle: 'Not mandatory, but helpful for borderline cases',
    items: [
      {
        id: 'fixed-deposits',
        label: 'Fixed deposit or savings certificates',
      },
      {
        id: 'investments',
        label: 'Mutual fund or investment statements',
      },
      {
        id: 'equity',
        label: 'Stock or equity holdings summary',
      },
      {
        id: 'travel-history',
        label: `Previous ${regionLabel} visa stamps`,
        hint: 'Prior compliant travel strongly supports your application',
      },
      {
        id: 'travel-insurance',
        label: 'Travel insurance policy',
      },
      {
        id: 'itinerary',
        label: 'Detailed itinerary and accommodation bookings',
      },
    ],
  };
}

function schengenBaseItems(): OccupationDocumentItem[] {
  return [
    ...PASSPORT_ITEMS,
    {
      id: 'schengen-photos',
      label: 'Two passport photographs',
      hint: 'Biometric spec — white background, recent',
    },
    {
      id: 'schengen-form',
      label: 'Completed Schengen application form',
      hint: 'Signed and dated',
    },
    {
      id: 'schengen-insurance',
      label: 'Travel medical insurance',
      hint: 'Minimum €30,000 cover valid across all Schengen states',
    },
    {
      id: 'schengen-flights',
      label: 'Flight reservations',
      hint: 'Return or onward tickets matching your stated dates',
    },
    {
      id: 'schengen-accommodation',
      label: 'Accommodation proof',
      hint: 'Hotel bookings or host invitation with address',
    },
    {
      id: 'schengen-cover-letter',
      label: 'Cover letter',
      hint: 'Purpose of visit, finances, and intent to return home',
    },
    RESIDENCE_ID,
  ];
}

function buildProfile(
  id: OccupationProfileId,
  label: string,
  description: string,
  requiredItems: OccupationDocumentItem[],
  destinationLabel: string,
  regionLabel: string
): OccupationProfile {
  return {
    id,
    label,
    description,
    sections: [
      {
        kind: 'required',
        title: 'Must have',
        subtitle: 'Embassy or application centre will expect these',
        items: requiredItems,
      },
      sharedAdditional(destinationLabel),
      sharedOptional(regionLabel),
    ],
  };
}

export function getUkOccupationChecklist(): OccupationChecklistConfig {
  return buildStandardOccupationChecklist('the UK', 'Aligned with UK Standard Visitor visa guidance');
}

export function getCanadaOccupationChecklist(): OccupationChecklistConfig {
  return buildStandardOccupationChecklist('Canada', 'Aligned with IRCC Temporary Resident Visa (TRV) guidance');
}

function buildStandardOccupationChecklist(
  destinationLabel: string,
  sourceNote: string
): OccupationChecklistConfig {
  const regionLabel = 'Canada / UK / Schengen / US / AU / NZ';

  const profiles: OccupationProfile[] = [
    buildProfile(
      'employed',
      'Employed',
      'Salaried work with a regular employer',
      [
        ...PASSPORT_ITEMS,
        BANK_STATEMENTS_PERSONAL,
        {
          id: 'payslips',
          label: 'Recent payslips',
          hint: 'Last 3 months',
        },
        {
          id: 'employment-letter',
          label: 'Employer letter or employment contract',
          hint: 'Confirms role, salary, approved leave, and return to work',
        },
        {
          id: 'noc',
          label: 'No-objection letter (NOC)',
          hint: 'If your employer provides one — confirms they approve your travel',
        },
        ADDRESS_PROOF,
        RESIDENCE_ID,
      ],
      destinationLabel,
      'UK / Schengen / US / AU / CA / NZ'
    ),
    buildProfile(
      'business_owner',
      'Business owner',
      'Self-employed, director, or company founder',
      [
        ...PASSPORT_ITEMS,
        {
          id: 'company-registration',
          label: 'Company registration certificate',
          hint: 'Certificate of incorporation or business licence',
        },
        {
          id: 'bank-company',
          label: 'Company bank statements',
          hint: 'Last 6 months',
        },
        BANK_STATEMENTS_PERSONAL,
        ADDRESS_PROOF,
        RESIDENCE_ID,
      ],
      destinationLabel,
      'UK / Schengen / US / AU / CA / NZ'
    ),
    buildProfile(
      'student',
      'Student',
      'Enrolled at a school, college, or university',
      [
        ...PASSPORT_ITEMS,
        BANK_STATEMENTS_PERSONAL,
        ADDRESS_PROOF,
        {
          id: 'student-id',
          label: 'Student ID card',
        },
        {
          id: 'enrollment-letter',
          label: 'Enrolment or admission letter',
          hint: 'From your institution confirming active study',
        },
        {
          id: 'student-noc',
          label: 'No-objection letter from institution',
          hint: 'Confirms your leave of absence is approved',
        },
        RESIDENCE_ID,
      ],
      destinationLabel,
      'UK / Schengen / US / AU / CA / NZ'
    ),
    buildProfile(
      'unemployed',
      'Not currently employed',
      'Between jobs, homemaker, or seeking work',
      [
        ...PASSPORT_ITEMS,
        BANK_STATEMENTS_PERSONAL,
        ADDRESS_PROOF,
        {
          id: 'sponsor-id',
          label: 'Sponsor ID or passport copy',
          hint: 'If someone else is funding your trip',
        },
        {
          id: 'sponsor-bank',
          label: 'Sponsor bank statements',
          hint: 'Last 6 months, if sponsored',
        },
        {
          id: 'sponsor-employment',
          label: 'Sponsor employment proof',
          hint: 'Payslips or employer letter, if sponsored',
        },
        RESIDENCE_ID,
      ],
      destinationLabel,
      'UK / Schengen / US / AU / CA / NZ'
    ),
    buildProfile(
      'retired',
      'Retired',
      'Pensioner or no longer in active employment',
      [
        ...PASSPORT_ITEMS,
        BANK_STATEMENTS_PERSONAL,
        ADDRESS_PROOF,
        {
          id: 'savings-proof',
          label: 'Proof of savings, pension, or assets',
          hint: 'Pension statements, FDs, or property documents showing financial stability',
        },
        RESIDENCE_ID,
      ],
      destinationLabel,
      'UK / Schengen / US / AU / CA / NZ'
    ),
  ];

  return {
    destinationLabel,
    sourceNote,
    profiles,
  };
}

export function getSchengenOccupationChecklist(countryName: string): OccupationChecklistConfig {
  const destinationLabel = countryName;
  const base = schengenBaseItems();

  const profiles: OccupationProfile[] = [
    buildProfile(
      'employed',
      'Employed',
      'Salaried work with a regular employer',
      [
        ...base,
        BANK_STATEMENTS_PERSONAL,
        {
          id: 'payslips',
          label: 'Recent payslips',
          hint: 'Last 3 months',
        },
        {
          id: 'employment-letter',
          label: 'Employer letter / no-objection letter',
          hint: 'Role, salary, approved leave, and confirmation you will return to work',
        },
        ADDRESS_PROOF,
      ],
      destinationLabel,
      'Schengen / UK / US / AU / CA / NZ'
    ),
    buildProfile(
      'business_owner',
      'Business owner',
      'Self-employed, director, or company founder',
      [
        ...base,
        {
          id: 'company-registration',
          label: 'Company registration certificate',
        },
        {
          id: 'bank-company',
          label: 'Company bank statements',
          hint: 'Last 6 months',
        },
        BANK_STATEMENTS_PERSONAL,
        ADDRESS_PROOF,
      ],
      destinationLabel,
      'Schengen / UK / US / AU / CA / NZ'
    ),
    buildProfile(
      'student',
      'Student',
      'Enrolled at a school, college, or university',
      [
        ...base,
        BANK_STATEMENTS_PERSONAL,
        ADDRESS_PROOF,
        {
          id: 'student-id',
          label: 'Student ID card',
        },
        {
          id: 'enrollment-letter',
          label: 'Enrolment letter from your institution',
        },
        {
          id: 'student-noc',
          label: 'No-objection letter from school or university',
        },
      ],
      destinationLabel,
      'Schengen / UK / US / AU / CA / NZ'
    ),
    buildProfile(
      'unemployed',
      'Not currently employed',
      'Between jobs, homemaker, or seeking work',
      [
        ...base,
        BANK_STATEMENTS_PERSONAL,
        ADDRESS_PROOF,
        {
          id: 'sponsor-id',
          label: 'Sponsor ID or passport copy',
          hint: 'If someone else is funding your trip',
        },
        {
          id: 'sponsor-bank',
          label: 'Sponsor bank statements',
          hint: 'Last 6 months, if sponsored',
        },
        {
          id: 'sponsor-employment',
          label: 'Sponsor employment proof',
          hint: 'If sponsored',
        },
      ],
      destinationLabel,
      'Schengen / UK / US / AU / CA / NZ'
    ),
    buildProfile(
      'retired',
      'Retired',
      'Pensioner or no longer in active employment',
      [
        ...base,
        BANK_STATEMENTS_PERSONAL,
        ADDRESS_PROOF,
        {
          id: 'savings-proof',
          label: 'Proof of savings, pension, or assets',
          hint: 'Pension statements or investment documents',
        },
      ],
      destinationLabel,
      'Schengen / UK / US / AU / CA / NZ'
    ),
  ];

  return {
    destinationLabel,
    sourceNote: `Short-stay Schengen visa requirements for ${countryName}`,
    profiles,
  };
}
