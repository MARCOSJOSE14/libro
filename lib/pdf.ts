import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib'
import type { Claim } from '@prisma/client'
import {
  DOCUMENT_TYPE_LABELS,
  PRODUCT_TYPE_LABELS,
  CLAIM_TYPE_LABELS,
} from '@/types/claim'
import { formatDateTimePeru, formatDatePeru, formatCurrency } from './utils'

const COMPANY_NAME    = process.env.NEXT_PUBLIC_COMPANY_NAME    ?? 'Ramos Hernández Jean Pierre'
const COMPANY_RUC     = process.env.NEXT_PUBLIC_COMPANY_RUC     ?? '10721468688'
const COMPANY_ADDRESS = process.env.NEXT_PUBLIC_COMPANY_ADDRESS ?? 'Calle Chiclayo 211'
const COMPANY_PHONE   = process.env.NEXT_PUBLIC_COMPANY_PHONE   ?? '948345488'

const C = {
  red:       rgb(0.851, 0.063, 0.137),
  darkBlue:  rgb(0.071, 0.161, 0.427),
  midBlue:   rgb(0.145, 0.278, 0.620),
  lightGray: rgb(0.945, 0.945, 0.945),
  lineGray:  rgb(0.820, 0.820, 0.820),
  darkGray:  rgb(0.30, 0.30, 0.30),
  black:     rgb(0, 0, 0),
  white:     rgb(1, 1, 1),
}

interface TextOpts {
  x: number
  y: number
  size?: number
  font?: PDFFont
  color?: ReturnType<typeof rgb>
  maxWidth?: number
}

export async function generateClaimPdf(claim: Claim): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Libro de Reclamaciones - ${claim.claimNumber}`)
  doc.setAuthor(COMPANY_NAME)
  doc.setSubject(`Reclamación N° ${claim.claimNumber}`)
  doc.setCreationDate(new Date())
  doc.setLanguage('es-PE')

  const page = doc.addPage([595, 842]) // A4
  const H = page.getSize().height

  const bold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique)

  const text = (str: string, opts: TextOpts): number => {
    const { x, y, size = 10, font = regular, color = C.black, maxWidth } = opts
    if (!maxWidth) {
      page.drawText(String(str ?? ''), { x, y, size, font, color })
      return y
    }
    const words = String(str ?? '').split(' ')
    let line = ''
    let cy = y
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        page.drawText(line, { x, y: cy, size, font, color })
        line = word
        cy -= size + 3
      } else { line = test }
    }
    if (line) page.drawText(line, { x, y: cy, size, font, color })
    return cy
  }

  // ── ENCABEZADO ────────────────────────────────────────────────────────────
  // Franja tricolor (bandera del Perú)
  page.drawRectangle({ x: 0, y: H - 6, width: 198, height: 6, color: C.red })
  page.drawRectangle({ x: 198, y: H - 6, width: 199, height: 6, color: C.white })
  page.drawRectangle({ x: 397, y: H - 6, width: 198, height: 6, color: C.red })

  // Fondo del encabezado
  page.drawRectangle({ x: 0, y: H - 90, width: 595, height: 84, color: C.darkBlue })

  // Datos empresa (izquierda)
  text(COMPANY_NAME.toUpperCase(), { x: 30, y: H - 28, size: 13, font: bold, color: C.white })
  text(`RUC: ${COMPANY_RUC}`, { x: 30, y: H - 44, size: 8.5, font: regular, color: C.white })
  text(`Dir.: ${COMPANY_ADDRESS}`, { x: 30, y: H - 55, size: 8, font: regular, color: C.white })
  text(`Tel.: ${COMPANY_PHONE}`, { x: 30, y: H - 66, size: 8, font: regular, color: C.white })

  // Título (derecha)
  text('LIBRO DE', { x: 415, y: H - 28, size: 20, font: bold, color: C.white })
  text('RECLAMACIONES', { x: 389, y: H - 49, size: 20, font: bold, color: C.white })

  // Barra de número de reclamo
  page.drawRectangle({ x: 0, y: H - 116, width: 595, height: 26, color: C.red })
  text(`Nº FOLIO: ${claim.claimNumber}`, {
    x: 30, y: H - 107,
    size: 12, font: bold, color: C.white,
  })
  text(`Fecha y hora de registro: ${formatDateTimePeru(claim.createdAt)} (hora Lima)`, {
    x: 270, y: H - 107,
    size: 9, font: regular, color: C.white,
  })

  // Nota legal bajo el encabezado
  text(
    'Conforme al Art. 150° del Código de Protección y Defensa del Consumidor — Ley N.° 29571 y DS 011-2011-PCM',
    { x: 30, y: H - 130, size: 7, font: oblique, color: C.darkGray }
  )

  let y = H - 150

  // ── SECCIONES ─────────────────────────────────────────────────────────────
  y = section(page, bold, regular, '1. DATOS DEL CONSUMIDOR', y, [
    ['Apellidos y Nombres', `${claim.lastName} ${claim.firstName}`],
    ['Tipo de Documento',   DOCUMENT_TYPE_LABELS[claim.documentType]],
    ['N° de Documento',     claim.documentNumber],
    ['Correo Electrónico',  claim.email],
    ['Teléfono / Celular',  claim.phone],
    ['Domicilio',           claim.address],
  ])

  y -= 8

  y = section(page, bold, regular, '2. IDENTIFICACIÓN DEL BIEN CONTRATADO', y, [
    ['Tipo de Bien', PRODUCT_TYPE_LABELS[claim.productType]],
  ])

  y -= 8

  y = section(page, bold, regular, '3. DETALLE DE LA RECLAMACIÓN', y, [
    ['Tipo de Reclamación', CLAIM_TYPE_LABELS[claim.claimType]],
    ['Monto Reclamado',     formatCurrency(claim.claimedAmount ? Number(claim.claimedAmount) : null)],
    ['Fecha del Incidente', formatDatePeru(claim.incidentDate)],
    ['Plazo de Respuesta',  `${formatDatePeru(claim.responseDeadline)} (30 días hábiles)`],
  ])

  // Descripción
  y -= 10
  text('Descripción del Problema:', { x: 30, y, size: 9, font: bold, color: C.darkBlue })
  y -= 14
  page.drawRectangle({ x: 28, y: y - 58, width: 539, height: 63, color: C.lightGray })
  page.drawRectangle({ x: 28, y: y - 58, width: 3, height: 63, color: C.red })
  text(claim.description, { x: 38, y: y - 8, size: 8.5, font: regular, color: C.black, maxWidth: 520 })
  y -= 72

  // Pedido
  y -= 8
  text('Pedido del Consumidor:', { x: 30, y, size: 9, font: bold, color: C.darkBlue })
  y -= 14
  page.drawRectangle({ x: 28, y: y - 48, width: 539, height: 53, color: C.lightGray })
  page.drawRectangle({ x: 28, y: y - 48, width: 3, height: 53, color: C.midBlue })
  text(claim.consumerRequest, { x: 38, y: y - 8, size: 8.5, font: regular, color: C.black, maxWidth: 520 })
  y -= 60

  // ── FIRMAS ────────────────────────────────────────────────────────────────
  y -= 20
  page.drawLine({ start: { x: 30, y }, end: { x: 565, y }, thickness: 0.5, color: C.lineGray })
  y -= 12

  text('4. FIRMAS Y CONFORMIDAD', { x: 30, y, size: 9, font: bold, color: C.darkBlue })
  y -= 50

  // Firma consumidor
  page.drawRectangle({ x: 35, y: y - 8, width: 205, height: 48, color: C.lightGray })
  page.drawLine({ start: { x: 50, y: y + 22 }, end: { x: 228, y: y + 22 }, thickness: 0.5, color: C.lineGray })
  text('Firma del Consumidor', { x: 85, y: y + 8, size: 7.5, font: regular, color: C.darkGray })
  text(`${claim.firstName} ${claim.lastName}`, { x: 75, y: y - 4, size: 7.5, font: oblique, color: C.darkGray })

  // Firma empresa
  page.drawRectangle({ x: 355, y: y - 8, width: 205, height: 48, color: C.lightGray })
  page.drawLine({ start: { x: 370, y: y + 22 }, end: { x: 548, y: y + 22 }, thickness: 0.5, color: C.lineGray })
  text('Representante del Proveedor', { x: 380, y: y + 8, size: 7.5, font: regular, color: C.darkGray })
  text(COMPANY_NAME, { x: 375, y: y - 4, size: 7.5, font: oblique, color: C.darkGray })

  // ── PIE DE PÁGINA ─────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 36, color: C.darkBlue })
  text(
    'Documento con validez legal | Ley N.° 29571 — Código de Protección y Defensa del Consumidor',
    { x: 30, y: 22, size: 7, font: oblique, color: C.white }
  )
  text(
    `Generado el ${formatDateTimePeru(new Date())} · ${claim.claimNumber}`,
    { x: 30, y: 10, size: 7, font: regular, color: C.white }
  )
  text('INDECOPI: 224-7777 (Lima) / 0800-4-4040 (Provincias)', {
    x: 360, y: 10, size: 7, font: regular, color: C.white,
  })

  return doc.save()
}

// ── Helper: sección con filas ─────────────────────────────────────────────────
function section(
  page: PDFPage,
  bold: PDFFont,
  regular: PDFFont,
  title: string,
  startY: number,
  rows: [string, string][]
): number {
  let y = startY

  page.drawRectangle({ x: 28, y: y - 4, width: 539, height: 19, color: rgb(0.071, 0.161, 0.427) })
  page.drawText(title, { x: 34, y: y + 2, size: 8.5, font: bold, color: rgb(1, 1, 1) })
  y -= 19

  rows.forEach(([label, value], i) => {
    const bg = i % 2 === 0 ? rgb(0.972, 0.972, 0.972) : rgb(0.988, 0.988, 0.988)
    page.drawRectangle({ x: 28, y: y - 4, width: 539, height: 17, color: bg })
    page.drawText(`${label}:`, { x: 34,  y: y + 1, size: 8, font: bold,    color: rgb(0.30, 0.30, 0.30) })
    page.drawText(value || '-', { x: 205, y: y + 1, size: 8, font: regular, color: rgb(0, 0, 0) })
    y -= 17
  })

  return y
}
