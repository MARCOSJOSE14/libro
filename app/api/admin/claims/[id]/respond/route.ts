import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { getClientIp } from '@/lib/rate-limit'
import type { ClaimStatus } from '@prisma/client'

const respondSchema = z.object({
  response: z.string().min(10, 'La respuesta debe tener al menos 10 caracteres').max(5000),
  status: z.enum(['IN_REVIEW', 'RESPONDED', 'RESOLVED', 'REJECTED']),
  respondedBy: z.string().min(2).max(255).optional().default('Administrador'),
})

type Params = { params: Promise<{ id: string }> }

/**
 * POST /api/admin/claims/[id]/respond
 * Registra la respuesta formal de la empresa al reclamo.
 * Esta acción queda grabada en el audit log para trazabilidad INDECOPI.
 */
export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const authError = requireAdmin(request)
  if (authError) return authError

  const { id } = await params

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = respondSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Datos inválidos.', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { response, status, respondedBy } = parsed.data
  const ip = getClientIp(request)

  try {
    const claim = await prisma.claim.findUnique({ where: { id } })
    if (!claim) {
      return NextResponse.json({ success: false, error: 'Reclamo no encontrado.' }, { status: 404 })
    }

    const now = new Date()

    // Actualizar reclamo y crear audit log en una transacción
    await prisma.$transaction([
      prisma.claim.update({
        where: { id },
        data: {
          status:          status as ClaimStatus,
          companyResponse: response,
          respondedAt:     now,
          respondedBy,
        },
      }),
      prisma.auditLog.create({
        data: {
          claimId:    id,
          action:     'RESPONDED',
          fromStatus: claim.status,
          toStatus:   status as ClaimStatus,
          actor:      respondedBy,
          actorIp:    ip,
          notes:      `Respuesta registrada. Estado cambiado de ${claim.status} a ${status}.`,
        },
      }),
    ])

    return NextResponse.json({ success: true, message: 'Respuesta registrada exitosamente.' })
  } catch (error) {
    console.error('[POST /api/admin/claims/[id]/respond] Error:', error)
    return NextResponse.json({ success: false, error: 'Error interno.' }, { status: 500 })
  }
}
