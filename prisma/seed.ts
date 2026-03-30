import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default settings — starts with CAR as active jurisdiction
  await prisma.settings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      activeJurisdiction: 'CAR',
      taxTTC: 26,          // Amount HT = Amount TTC / 1.26
      tictechRate: 7,      // TICTECH = 7% of Amount HT
      discrepancyThreshold: 5,
      criticalThreshold: 20,
      voiceRate: 25,       // XAF per minute
      smsRate: 15,         // XAF per message
      dataRate: 0.5,       // XAF per MB
      currency: 'xaf',
      dateFormat: 'dmy',
    },
  })

  // Create default admin user
  // Password: admin123 (bcrypt hash)
  await prisma.user.upsert({
    where: { email: 'admin@taxauthority.gov' },
    update: {},
    create: {
      email: 'admin@taxauthority.gov',
      name: 'Tax Administrator',
      passwordHash: '$2a$10$tjBNxES04rXwQtkvBMwdp.6qOxWgcJmSnEqLEAvJIBJn3PbIGeEuO',
      role: 'admin',
    },
  })

  // =============================================
  // Central African Republic telecom operators
  // =============================================
  const carOperators = [
    {
      id: 'car-moov',
      name: 'MOOV Africa CAR',
      licenseNumber: 'ARCEP-CAR-001',
      region: 'National',
      status: 'active',
      contactEmail: 'regulatory@moov-africa.cf',
      contactPhone: '+236 70 00 00 00',
      taxId: 'NIF-CAR-MOOV-001',
      numberPrefixes: '70,23670,0023670',
      jurisdiction: 'CAR',
    },
    {
      id: 'car-orange',
      name: 'Orange CAR',
      licenseNumber: 'ARCEP-CAR-002',
      region: 'National',
      status: 'active',
      contactEmail: 'regulatory@orange.cf',
      contactPhone: '+236 72 00 00 00',
      taxId: 'NIF-CAR-ORANGE-002',
      numberPrefixes: '72,23672,0023672,74,23674,0023674',
      jurisdiction: 'CAR',
    },
    {
      id: 'car-telecel',
      name: 'Telecel CAR',
      licenseNumber: 'ARCEP-CAR-003',
      region: 'National',
      status: 'active',
      contactEmail: 'regulatory@telecel.cf',
      contactPhone: '+236 75 00 00 00',
      taxId: 'NIF-CAR-TELECEL-003',
      numberPrefixes: '75,23675,0023675,76,23676,0023676',
      jurisdiction: 'CAR',
    },
    {
      id: 'car-socatel',
      name: 'Socatel',
      licenseNumber: 'ARCEP-CAR-004',
      region: 'National',
      status: 'active',
      contactEmail: 'regulatory@socatel.cf',
      contactPhone: '+236 21 00 00 00',
      taxId: 'NIF-CAR-SOCATEL-004',
      numberPrefixes: '21,23621,0023621,22,23622,0023622',
      jurisdiction: 'CAR',
    },
    {
      id: 'car-azur',
      name: 'Azur Telecom',
      licenseNumber: 'ARCEP-CAR-005',
      region: 'National',
      status: 'active',
      contactEmail: 'regulatory@azur.cf',
      contactPhone: '+236 77 00 00 00',
      taxId: 'NIF-CAR-AZUR-005',
      numberPrefixes: '77,23677,0023677',
      jurisdiction: 'CAR',
    },
  ]

  // =============================================
  // Madagascar telecom operators
  // =============================================
  const mdgOperators = [
    {
      id: 'mdg-telma',
      name: 'Telma (Yas)',
      licenseNumber: 'ARTEC-MDG-001',
      region: 'National',
      status: 'active',
      contactEmail: 'regulatory@telma.mg',
      contactPhone: '+261 34 00 000 00',
      taxId: 'NIF-MDG-TELMA-001',
      numberPrefixes: '034,038,26134,26138',
      jurisdiction: 'MDG',
    },
    {
      id: 'mdg-orange',
      name: 'Orange Madagascar',
      licenseNumber: 'ARTEC-MDG-002',
      region: 'National',
      status: 'active',
      contactEmail: 'regulatory@orange.mg',
      contactPhone: '+261 32 00 000 00',
      taxId: 'NIF-MDG-ORANGE-002',
      numberPrefixes: '032,037,26132,26137',
      jurisdiction: 'MDG',
    },
    {
      id: 'mdg-airtel',
      name: 'Airtel Madagascar',
      licenseNumber: 'ARTEC-MDG-003',
      region: 'National',
      status: 'active',
      contactEmail: 'regulatory@airtel.mg',
      contactPhone: '+261 33 00 000 00',
      taxId: 'NIF-MDG-AIRTEL-003',
      numberPrefixes: '033,26133',
      jurisdiction: 'MDG',
    },
    {
      id: 'mdg-blueline',
      name: 'Blueline',
      licenseNumber: 'ARTEC-MDG-004',
      region: 'National',
      status: 'active',
      contactEmail: 'regulatory@blueline.mg',
      contactPhone: '+261 39 00 000 00',
      taxId: 'NIF-MDG-BLUELINE-004',
      numberPrefixes: '039,26139',
      jurisdiction: 'MDG',
    },
  ]

  for (const operator of [...carOperators, ...mdgOperators]) {
    await prisma.telecomCompany.upsert({
      where: { id: operator.id },
      update: operator,
      create: operator,
    })
  }

  console.log('Seeding complete! 5 CAR operators + 4 Madagascar operators created.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
