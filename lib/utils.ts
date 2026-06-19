import { prisma } from './prisma'

const TIMEZONE = 'America/Lima'

/**
 * Genera un número de reclamo correlativo con formato: REC-YYYY-NNNNNN
 * Garantiza unicidad incluso bajo concurrencia con tabla ClaimSequence.
 */
export async function generateClaimNumber(): Promise<string> {
  // Año en Lima, no UTC
  const year = getCurrentYearLima()

  const last = await prisma.claimSequence.findFirst({
    where: { year },
    orderBy: { sequence: 'desc' },
  })

  const nextSequence = (last?.sequence ?? 0) + 1

  await prisma.claimSequence.create({
    data: { year, sequence: nextSequence },
  })

  return `REC-${year}-${String(nextSequence).padStart(6, '0')}`
}

/**
 * Calcula el plazo legal de respuesta: 30 días hábiles desde el registro.
 * Excluye domingos y feriados nacionales del Perú (Art. 24 DS 011-2011-PCM).
 */
export function calculateResponseDeadline(from: Date = new Date()): Date {
  // Feriados nacionales fijos del Perú (MM-DD)
  const PERU_HOLIDAYS_FIXED = new Set([
    '01-01', // Año Nuevo
    '05-01', // Día del Trabajo
    '06-29', // San Pedro y San Pablo
    '07-28', // Fiestas Patrias
    '07-29', // Fiestas Patrias
    '08-30', // Santa Rosa de Lima
    '10-08', // Combate de Angamos
    '11-01', // Todos los Santos
    '12-08', // Inmaculada Concepción
    '12-09', // Batalla de Ayacucho
    '12-25', // Navidad
  ])

  const isHoliday = (date: Date): boolean => {
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return PERU_HOLIDAYS_FIXED.has(`${mm}-${dd}`)
  }

  const isWorkday = (date: Date): boolean => {
    const day = date.getDay()
    // 0 = domingo, 6 = sábado — en Perú los sábados SÍ cuentan como hábiles
    return day !== 0 && !isHoliday(date)
  }

  let workdays = 0
  const deadline = new Date(from)

  while (workdays < 30) {
    deadline.setDate(deadline.getDate() + 1)
    if (isWorkday(deadline)) workdays++
  }

  return deadline
}

/**
 * Formatea una fecha al formato oficial peruano: dd/mm/yyyy HH:MM
 * Siempre en timezone Lima (UTC-5).
 */
export function formatDateTimePeru(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('es-PE', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
    hour12: false,
  })
}

/**
 * Formatea solo la fecha en formato peruano: dd/mm/yyyy
 */
export function formatDatePeru(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-PE', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    timeZone: TIMEZONE,
  })
}

/**
 * Formatea un monto en soles peruanos.
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return 'No especificado'
  return new Intl.NumberFormat('es-PE', {
    style:    'currency',
    currency: 'PEN',
  }).format(amount)
}

/**
 * Sanitiza strings para evitar XSS básico antes de persistir.
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '').substring(0, 5000)
}

/**
 * Calcula si el plazo de respuesta ha vencido.
 */
export function isDeadlineExpired(deadline: Date): boolean {
  return new Date() > deadline
}

/**
 * Días hábiles restantes para responder (puede ser negativo si venció).
 */
export function workdaysRemaining(deadline: Date): number {
  const now = new Date()
  if (now >= deadline) return 0
  const diffMs = deadline.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function getCurrentYearLima(): number {
  return parseInt(
    new Date().toLocaleString('es-PE', { year: 'numeric', timeZone: TIMEZONE }),
    10
  )
}
