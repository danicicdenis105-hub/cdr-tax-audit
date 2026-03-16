import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default settings — CAR tax model
  await prisma.settings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
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

  // Create Central African Republic telecom operators
  const operators = [
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
    },
  ]

  for (const operator of operators) {
    await prisma.telecomCompany.upsert({
      where: { id: operator.id },
      update: operator,
      create: operator,
    })
  }

  console.log('Seeding complete! 5 CAR operators created.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
