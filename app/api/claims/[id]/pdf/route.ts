import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateClaimPdf } from '@/lib/pdf'

type Params = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const { id } = await params

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ success: false, error: 'ID inválido.' }, { status: 400 })
  }

  try {
    const claim = await prisma.claim.findUnique({ where: { id } })

    if (!claim) {
      return NextResponse.json({ success: false, error: 'Reclamo no encontrado.' }, { status: 404 })
    }

    const pdfBytes = await generateClaimPdf(claim)

    const filename = `libro-reclamaciones-${claim.claimNumber}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBytes.length),
        // Evitar que el PDF sea cacheado por proxies intermedios
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[GET /api/claims/[id]/pdf] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar el PDF.' },
      { status: 500 }
    )
  }
}
