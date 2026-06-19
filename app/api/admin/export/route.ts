import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDateTimePeru, formatDatePeru } from '@/lib/utils'
import { DOCUMENT_TYPE_LABELS, PRODUCT_TYPE_LABELS, CLAIM_TYPE_LABELS, CLAIM_STATUS_LABELS } from '@/types/claim'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/export
 * Exporta todos los reclamos en formato CSV para auditorías INDECOPI.
 * Parámetros opcionales:
 *   ?from=2024-01-01  — fecha inicio (ISO)
 *   ?to=2024-12-31    — fecha fin (ISO)
 *   ?status=PENDING   — filtrar por estado
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // ── Autenticación ─────────────────────────────────────────────────
  const authError = requireAdmin(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const fromParam   = searchParams.get('from')
  const toParam     = searchParams.get('to')
  const statusParam = searchParams.get('status')

  // ── Filtros de búsqueda ───────────────────────────────────────────
  const where: Record<string, unknown> = {}

  if (fromParam || toParam) {
    where.createdAt = {
      ...(fromParam ? { gte: new Date(fromParam) } : {}),
      ...(toParam   ? { lte: new Date(`${toParam}T23:59:59`) } : {}),
    }
  }

  if (statusParam) {
    where.status = statusParam
  }

  try {
    const claims = await prisma.claim.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { auditLogs: { orderBy: { createdAt: 'asc' } } },
    })

    // Registrar la exportación en el audit log
    if (claims.length > 0) {
      await prisma.auditLog.createMany({
        data: claims.map((c) => ({
          claimId:  c.id,
          action:   'EXPORTED' as const,
          actor:    'Administrador (exportación INDECOPI)',
          actorIp:  request.headers.get('x-forwarded-for') ?? 'unknown',
          notes:    `Exportado en lote CSV. Filtros: from=${fromParam ?? 'todos'}, to=${toParam ?? 'todos'}, status=${statusParam ?? 'todos'}`,
        })),
      })
    }

    // ── Construir CSV ─────────────────────────────────────────────────
    const headers = [
      'N° Reclamo',
      'Fecha y Hora Registro (Lima)',
      'Tipo Reclamación',
      'Estado',
      'Apellidos',
      'Nombres',
      'Tipo Documento',
      'N° Documento',
      'Correo',
      'Teléfono',
      'Dirección',
      'Tipo Bien',
      'Monto Reclamado (S/)',
      'Fecha Incidente',
      'Descripción',
      'Pedido del Consumidor',
      'Respuesta Empresa',
      'Fecha Respuesta',
      'Plazo Vencimiento (30 días hábiles)',
      'Estado Plazo',
      'IP Solicitante',
    ]

    const rows = claims.map((c) => {
      const now = new Date()
      const deadlineExpired = now > c.responseDeadline
      const plazoEstado = c.respondedAt
        ? 'Respondido'
        : deadlineExpired
        ? 'VENCIDO'
        : 'Vigente'

      return [
        c.claimNumber,
        formatDateTimePeru(c.createdAt),
        CLAIM_TYPE_LABELS[c.claimType],
        CLAIM_STATUS_LABELS[c.status],
        c.lastName,
        c.firstName,
        DOCUMENT_TYPE_LABELS[c.documentType],
        c.documentNumber,
        c.email,
        c.phone,
        c.address,
        PRODUCT_TYPE_LABELS[c.productType],
        c.claimedAmount ? Number(c.claimedAmount).toFixed(2) : '',
        formatDatePeru(c.incidentDate),
        c.description.replace(/\n/g, ' '),
        c.consumerRequest.replace(/\n/g, ' '),
        (c.companyResponse ?? '').replace(/\n/g, ' '),
        c.respondedAt ? formatDateTimePeru(c.respondedAt) : '',
        formatDateTimePeru(c.responseDeadline),
        plazoEstado,
        c.submitterIp ?? '',
      ].map(escapeCsvCell)
    })

    // BOM UTF-8 para que Excel abra correctamente caracteres especiales
    const BOM = '﻿'
    const csv = BOM + [headers, ...rows].map((row) => row.join(',')).join('\r\n')

    const filename = `libro-reclamaciones-export-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/export] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar la exportación.' },
      { status: 500 }
    )
  }
}

function escapeCsvCell(value: string): string {
  const str = String(value ?? '')
  // Si contiene coma, salto de línea o comilla, encerrar en comillas dobles
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}
