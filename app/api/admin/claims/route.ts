import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import type { ClaimStatus } from '@prisma/client'

/**
 * GET /api/admin/claims
 * Lista todos los reclamos con filtros y paginación.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authError = requireAdmin(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit   = Math.min(100, parseInt(searchParams.get('limit') ?? '20'))
  const status  = searchParams.get('status') as ClaimStatus | null
  const search  = searchParams.get('search') ?? ''

  const where: Record<string, unknown> = {}

  if (status) where.status = status

  if (search) {
    where.OR = [
      { claimNumber:    { contains: search, mode: 'insensitive' } },
      { firstName:      { contains: search, mode: 'insensitive' } },
      { lastName:       { contains: search, mode: 'insensitive' } },
      { documentNumber: { contains: search, mode: 'insensitive' } },
      { email:          { contains: search, mode: 'insensitive' } },
    ]
  }

  try {
    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:  (page - 1) * limit,
        take:  limit,
        select: {
          id:               true,
          claimNumber:      true,
          firstName:        true,
          lastName:         true,
          documentType:     true,
          documentNumber:   true,
          email:            true,
          phone:            true,
          claimType:        true,
          productType:      true,
          status:           true,
          claimedAmount:    true,
          incidentDate:     true,
          responseDeadline: true,
          respondedAt:      true,
          createdAt:        true,
        },
      }),
      prisma.claim.count({ where }),
    ])

    // Estadísticas globales para el dashboard
    const stats = await prisma.claim.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    // Marcar automáticamente como EXPIRED los que vencieron
    const now = new Date()
    const expiredIds = claims
      .filter((c) => c.status === 'PENDING' && c.responseDeadline < now)
      .map((c) => c.id)

    if (expiredIds.length > 0) {
      await prisma.claim.updateMany({
        where: { id: { in: expiredIds } },
        data:  { status: 'EXPIRED' },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        claims,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: Object.fromEntries(stats.map((s) => [s.status, s._count.status])),
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/claims] Error:', error)
    return NextResponse.json({ success: false, error: 'Error interno.' }, { status: 500 })
  }
}
