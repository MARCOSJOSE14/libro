import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateClaimNumber, sanitizeString, calculateResponseDeadline } from '@/lib/utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { claimSchema } from '@/schemas/claim.schema'
import type { CreateClaimResponse, ApiErrorResponse } from '@/types/claim'

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateClaimResponse | ApiErrorResponse>> {
  // ── Rate limiting: 5 reclamos por minuto por IP ──────────────────
  const ip = getClientIp(request)
  const rl = rateLimit(ip, { limit: 5, windowMs: 60_000 })

  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: 'Demasiadas solicitudes. Por favor espere un momento.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  // ── Parsear body ─────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'El cuerpo de la solicitud no es JSON válido.' },
      { status: 400 }
    )
  }

  // ── Validar con Zod ──────────────────────────────────────────────
  const parsed = claimSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Los datos enviados no son válidos.',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    )
  }

  const data = parsed.data
  const now  = new Date()

  // ── Persistir en DB con auditoría ────────────────────────────────
  try {
    const claimNumber      = await generateClaimNumber()
    const responseDeadline = calculateResponseDeadline(now)

    // Transacción: crea el reclamo y el primer log de auditoría atómicamente
    const claim = await prisma.$transaction(async (tx) => {
      const created = await tx.claim.create({
        data: {
          claimNumber,
          firstName:       sanitizeString(data.firstName),
          lastName:        sanitizeString(data.lastName),
          documentType:    data.documentType,
          documentNumber:  sanitizeString(data.documentNumber),
          email:           data.email.toLowerCase().trim(),
          phone:           sanitizeString(data.phone),
          address:         sanitizeString(data.address),
          productType:     data.productType,
          claimType:       data.claimType,
          claimedAmount:   data.claimedAmount ?? null,
          incidentDate:    new Date(data.incidentDate),
          description:     sanitizeString(data.description),
          consumerRequest: sanitizeString(data.consumerRequest),
          responseDeadline,
          submitterIp:     ip,
          timezone:        'America/Lima',
        },
        select: { id: true, claimNumber: true, createdAt: true, responseDeadline: true },
      })

      // Registro de auditoría inicial — trazabilidad exigida por INDECOPI
      await tx.auditLog.create({
        data: {
          claimId:  created.id,
          action:   'CREATED',
          toStatus: 'PENDING',
          actor:    `${data.firstName} ${data.lastName} (${data.documentType}: ${data.documentNumber})`,
          actorIp:  ip,
          notes:    `Reclamo registrado vía formulario web. Plazo de respuesta: ${responseDeadline.toISOString()}`,
        },
      })

      return created
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id:              claim.id,
          claimNumber:     claim.claimNumber,
          createdAt:       claim.createdAt.toISOString(),
          responseDeadline: claim.responseDeadline.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/claims] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno al registrar el reclamo. Intente nuevamente.' },
      { status: 500 }
    )
  }
}
