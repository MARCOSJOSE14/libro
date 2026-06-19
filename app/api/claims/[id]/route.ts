import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiErrorResponse } from '@/types/claim'

type Params = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id } = await params

  // Validar que el ID parezca un UUID para evitar queries innecesarias
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json<ApiErrorResponse>(
      { success: false, error: 'ID de reclamo inválido.' },
      { status: 400 }
    )
  }

  try {
    const claim = await prisma.claim.findUnique({
      where: { id },
    })

    if (!claim) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: 'Reclamo no encontrado.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: claim })
  } catch (error) {
    console.error('[GET /api/claims/[id]] Error:', error)
    return NextResponse.json<ApiErrorResponse>(
      { success: false, error: 'Error interno al obtener el reclamo.' },
      { status: 500 }
    )
  }
}
