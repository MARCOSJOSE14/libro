import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Ejecutando seed...')

  const existing = await prisma.claim.findFirst()
  if (existing) {
    console.log('ℹ️  Ya existen reclamos. Seed omitido.')
    return
  }

  await prisma.claimSequence.create({ data: { year: 2024, sequence: 1 } })

  // Plazo: 30 días hábiles desde la fecha de incidente de ejemplo
  const responseDeadline = new Date('2024-12-27')

  await prisma.claim.create({
    data: {
      claimNumber:      'REC-2024-000001',
      firstName:        'Juan Carlos',
      lastName:         'García López',
      documentType:     'DNI',
      documentNumber:   '12345678',
      email:            'juan.garcia@ejemplo.com',
      phone:            '987654321',
      address:          'Av. Arequipa 1234, Miraflores, Lima',
      productType:      'SERVICIO',
      claimType:        'RECLAMO',
      claimedAmount:    150.00,
      incidentDate:     new Date('2024-11-15'),
      description:      'El servicio de internet contratado no funciona correctamente desde hace 15 días. He llamado al servicio técnico en múltiples ocasiones sin solución.',
      consumerRequest:  'Solicito la reparación inmediata del servicio o la devolución del monto pagado por los días sin servicio.',
      responseDeadline,
      submitterIp:      '127.0.0.1',
    },
  })

  console.log('✅ Seed completado exitosamente')
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
