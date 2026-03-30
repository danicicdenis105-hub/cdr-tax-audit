// Multi-jurisdiction configuration for TerraNode
// Each jurisdiction defines its tax model, currency, locale, and telecom operators

export interface TaxComponent {
  name: string
  code: string
  rate: number
  appliedOn: 'ttc' | 'ht' // Whether the rate extracts from TTC or applies on HT
  description: string
}

export interface OperatorSeed {
  name: string
  licenseNumber: string
  region: string
  contactEmail: string
  contactPhone: string
  numberPrefixes: string
}

export interface JurisdictionConfig {
  code: string
  name: string
  flag: string
  currency: {
    code: string
    symbol: string
    locale: string
    decimals: number
  }
  taxes: {
    primary: TaxComponent    // Main VAT/TVA
    secondary: TaxComponent  // Sector-specific tax
    mtt?: TaxComponent       // Mobile Transaction Tax (optional, jurisdiction-specific)
  }
  // Formula: Amount HT = Amount TTC / (1 + primary.rate/100)
  // Secondary tax = Amount HT * (secondary.rate / 100)
  operators: OperatorSeed[]
  defaultRates: {
    voiceRate: number
    smsRate: number
    dataRate: number
    ussdRate: number  // per USSD session
  }
  // USSD codes used by mobile money services (for auto-detection)
  mobileMoneyUSSDCodes?: string[]
  dateFormat: string
}

export const JURISDICTIONS: Record<string, JurisdictionConfig> = {
  CAR: {
    code: 'CAR',
    name: 'Central African Republic',
    flag: '🇨🇫',
    currency: {
      code: 'XAF',
      symbol: 'FCFA',
      locale: 'fr-CF',
      decimals: 0,
    },
    taxes: {
      primary: {
        name: 'TVA (TTC)',
        code: 'TVA',
        rate: 26,
        appliedOn: 'ttc',
        description: 'Taxe sur la Valeur Ajoutée - Central African Republic',
      },
      secondary: {
        name: 'TICTECH',
        code: 'TICTECH',
        rate: 7,
        appliedOn: 'ht',
        description: 'Taxe sur les Technologies de Communication',
      },
    },
    operators: [
      {
        name: 'MOOV Africa CAR',
        licenseNumber: 'CAR-TEL-001',
        region: 'Bangui',
        contactEmail: 'regulatory@moov-africa.cf',
        contactPhone: '+236 70 00 00 00',
        numberPrefixes: '70,23670',
      },
      {
        name: 'Orange CAR',
        licenseNumber: 'CAR-TEL-002',
        region: 'Bangui',
        contactEmail: 'regulatory@orange.cf',
        contactPhone: '+236 72 00 00 00',
        numberPrefixes: '72,74,23672,23674',
      },
      {
        name: 'Telecel CAR',
        licenseNumber: 'CAR-TEL-003',
        region: 'Bangui',
        contactEmail: 'regulatory@telecel.cf',
        contactPhone: '+236 75 00 00 00',
        numberPrefixes: '75,76,23675,23676',
      },
      {
        name: 'Socatel',
        licenseNumber: 'CAR-TEL-004',
        region: 'Bangui',
        contactEmail: 'regulatory@socatel.cf',
        contactPhone: '+236 21 00 00 00',
        numberPrefixes: '21,22,23621,23622',
      },
      {
        name: 'Azur Telecom CAR',
        licenseNumber: 'CAR-TEL-005',
        region: 'Bangui',
        contactEmail: 'regulatory@azur.cf',
        contactPhone: '+236 77 00 00 00',
        numberPrefixes: '77,23677',
      },
    ],
    defaultRates: {
      voiceRate: 25,
      smsRate: 15,
      dataRate: 0.5,
      ussdRate: 10,   // XAF per USSD session
    },
    dateFormat: 'dmy',
  },

  MDG: {
    code: 'MDG',
    name: 'Madagascar',
    flag: '🇲🇬',
    currency: {
      code: 'MGA',
      symbol: 'Ar',
      locale: 'fr-MG',
      decimals: 0,
    },
    taxes: {
      primary: {
        name: 'TVA',
        code: 'TVA',
        rate: 20,
        appliedOn: 'ttc',
        description: 'Taxe sur la Valeur Ajoutée - Madagascar',
      },
      secondary: {
        name: "Droit d'Accise",
        code: 'EXCISE',
        rate: 8,
        appliedOn: 'ht',
        description: "Droit d'Accise sur les communications mobiles",
      },
      mtt: {
        name: 'Mobile Transaction Tax (MTT)',
        code: 'MTT',
        rate: 0.5,
        appliedOn: 'ht',
        description: 'Taxe sur les Transactions Mobiles — 0.5% on mobile money transaction value',
      },
    },
    operators: [
      {
        name: 'Telma (Yas)',
        licenseNumber: 'MDG-TEL-001',
        region: 'Antananarivo',
        contactEmail: 'regulatory@telma.mg',
        contactPhone: '+261 34 00 000 00',
        numberPrefixes: '034,038,26134,26138',
      },
      {
        name: 'Orange Madagascar',
        licenseNumber: 'MDG-TEL-002',
        region: 'Antananarivo',
        contactEmail: 'regulatory@orange.mg',
        contactPhone: '+261 32 00 000 00',
        numberPrefixes: '032,037,26132,26137',
      },
      {
        name: 'Airtel Madagascar',
        licenseNumber: 'MDG-TEL-003',
        region: 'Antananarivo',
        contactEmail: 'regulatory@airtel.mg',
        contactPhone: '+261 33 00 000 00',
        numberPrefixes: '033,26133',
      },
      {
        name: 'Blueline',
        licenseNumber: 'MDG-TEL-004',
        region: 'Antananarivo',
        contactEmail: 'regulatory@blueline.mg',
        contactPhone: '+261 39 00 000 00',
        numberPrefixes: '039,26139',
      },
    ],
    defaultRates: {
      voiceRate: 300,  // MGA per minute
      smsRate: 150,    // MGA per SMS
      dataRate: 5,     // MGA per MB
      ussdRate: 50,    // MGA per USSD session
    },
    // USSD short codes for mobile money services in Madagascar
    mobileMoneyUSSDCodes: ['*111#', '*144#', '*201#'],  // MVola, Orange Money, Airtel Money
    dateFormat: 'dmy',
  },
}

export function getJurisdiction(code: string): JurisdictionConfig {
  const j = JURISDICTIONS[code]
  if (!j) throw new Error(`Unknown jurisdiction: ${code}`)
  return j
}

export function getAllJurisdictions(): JurisdictionConfig[] {
  return Object.values(JURISDICTIONS)
}

export function formatCurrencyForJurisdiction(
  amount: number,
  jurisdictionCode: string
): string {
  const j = getJurisdiction(jurisdictionCode)
  try {
    return new Intl.NumberFormat(j.currency.locale, {
      style: 'currency',
      currency: j.currency.code,
      minimumFractionDigits: j.currency.decimals,
      maximumFractionDigits: j.currency.decimals,
    }).format(amount)
  } catch {
    // Fallback for locales not supported in all environments
    const formatted = amount.toFixed(j.currency.decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return `${formatted} ${j.currency.symbol}`
  }
}

// Calculate taxes for a given jurisdiction
export function calculateJurisdictionTaxes(
  amountTTC: number,
  jurisdictionCode: string,
  overridePrimaryRate?: number,
  overrideSecondaryRate?: number,
  options?: { isMobileMoney?: boolean; overrideMttRate?: number }
): {
  amountHT: number
  primaryTax: number
  secondaryTax: number
  mttTax: number
  totalTax: number
  primaryRate: number
  secondaryRate: number
  mttRate: number
} {
  const j = getJurisdiction(jurisdictionCode)
  const primaryRate = overridePrimaryRate ?? j.taxes.primary.rate
  const secondaryRate = overrideSecondaryRate ?? j.taxes.secondary.rate
  const mttRate = options?.overrideMttRate ?? (j.taxes.mtt?.rate ?? 0)

  const amountHT = amountTTC / (1 + primaryRate / 100)
  const primaryTax = amountTTC - amountHT
  const secondaryTax = amountHT * (secondaryRate / 100)
  // MTT applies only to mobile money transactions
  const mttTax = (options?.isMobileMoney && mttRate > 0) ? amountHT * (mttRate / 100) : 0
  const totalTax = primaryTax + secondaryTax + mttTax

  return { amountHT, primaryTax, secondaryTax, mttTax, totalTax, primaryRate, secondaryRate, mttRate }
}
