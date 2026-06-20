import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDateTimePeru, formatDatePeru } from '@/lib/utils'
import { CLAIM_TYPE_LABELS, CLAIM_STATUS_LABELS, PRODUCT_TYPE_LABELS } from '@/types/claim'

type Props = { params: Promise<{ claimNumber: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { claimNumber } = await params
  return { title: `Estado del Reclamo — ${claimNumber}` }
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  IN_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
  RESPONDED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  RESOLVED:  'bg-green-100 text-green-800 border-green-200',
  REJECTED:  'bg-red-100 text-red-800 border-red-200',
  EXPIRED:   'bg-gray-100 text-gray-800 border-gray-200',
}

const STATUS_ICONS: Record<string, string> = {
  PENDING:   '🕐',
  IN_REVIEW: '🔍',
  RESPONDED: '📩',
  RESOLVED:  '✅',
  REJECTED:  '❌',
  EXPIRED:   '⏰',
}

export default async function EstadoPage({ params }: Props) {
  const { claimNumber } = await params

  // Validar formato del número de reclamo
  const CLAIM_NUMBER_REGEX = /^REC-\d{4}-\d{6}$/
  if (!CLAIM_NUMBER_REGEX.test(claimNumber.toUpperCase())) notFound()

  const claim = await prisma.claim.findUnique({
    where: { claimNumber: claimNumber.toUpperCase() },
    select: {
      id:               true,
      claimNumber:      true,
      firstName:        true,
      lastName:         true,
      claimType:        true,
      productType:      true,
      status:           true,
      incidentDate:     true,
      responseDeadline: true,
      companyResponse:  true,
      respondedAt:      true,
      respondedBy:      true,
      createdAt:        true,
    },
  })

  if (!claim) notFound()

  const isResponded = !!claim.companyResponse
  const isExpired   = !isResponded && new Date() > claim.responseDeadline

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">

      {/* Encabezado */}
      <div className="mb-8 text-center animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900">Estado de su Reclamo</h1>
        <p className="mt-1 text-gray-500">Consulte el estado y la respuesta de la empresa</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-fade-in">

        {/* Header con número */}
        <div className="bg-blue-900 px-6 py-4 text-white">
          <p className="text-xs uppercase tracking-widest text-blue-200">N° de Folio</p>
          <p className="mt-1 text-2xl font-bold font-mono">{claim.claimNumber}</p>
          <p className="mt-1 text-sm text-blue-200">
            Registrado el {formatDateTimePeru(claim.createdAt)}
          </p>
        </div>

        {/* Estado actual */}
        <div className="px-6 py-5 border-b">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Estado actual</p>
          <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${STATUS_STYLES[claim.status]}`}>
            <span>{STATUS_ICONS[claim.status]}</span>
            {CLAIM_STATUS_LABELS[claim.status]}
          </span>
        </div>

        {/* Datos del reclamo */}
        <div className="divide-y divide-gray-100">
          <DataRow label="Consumidor"      value={`${claim.firstName} ${claim.lastName}`} />
          <DataRow label="Tipo"            value={CLAIM_TYPE_LABELS[claim.claimType]} />
          <DataRow label="Bien"            value={PRODUCT_TYPE_LABELS[claim.productType]} />
          <DataRow label="Fecha incidente" value={formatDatePeru(claim.incidentDate)} />
          <DataRow
            label="Plazo de respuesta"
            value={formatDatePeru(claim.responseDeadline)}
            highlight={isExpired ? 'red' : undefined}
          />
        </div>

        {/* Respuesta de la empresa */}
        {isResponded ? (
          <div className="px-6 py-5 bg-green-50 border-t border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-600 text-lg">✅</span>
              <div>
                <p className="font-semibold text-green-800">Respuesta de la empresa</p>
                <p className="text-xs text-green-600">
                  Respondido el {formatDateTimePeru(claim.respondedAt!)}
                  {claim.respondedBy ? ` por ${claim.respondedBy}` : ''}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-green-200 bg-white p-4">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {claim.companyResponse}
              </p>
            </div>
          </div>
        ) : isExpired ? (
          <div className="px-6 py-5 bg-red-50 border-t border-red-200">
            <p className="font-semibold text-red-800">⏰ El plazo de respuesta ha vencido</p>
            <p className="mt-1 text-sm text-red-700">
              Puede presentar una denuncia ante INDECOPI llamando al{' '}
              <strong>224-7777</strong> (Lima) o <strong>0800-4-4040</strong> (Provincias, gratuito).
            </p>
          </div>
        ) : (
          <div className="px-6 py-5 bg-amber-50 border-t border-amber-200">
            <p className="font-semibold text-amber-800">🕐 En espera de respuesta</p>
            <p className="mt-1 text-sm text-amber-700">
              La empresa tiene hasta el <strong>{formatDatePeru(claim.responseDeadline)}</strong> para responder
              (30 días hábiles según Ley N.° 29571).
            </p>
          </div>
        )}

        {/* Pie */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-center">
          <Link
            href="/"
            className="text-sm text-blue-700 hover:underline"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>

      {/* Info INDECOPI */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-500 text-center">
        ¿No está conforme con la respuesta? Contacte a{' '}
        <strong className="text-gray-700">INDECOPI</strong>:{' '}
        224-7777 (Lima) · 0800-4-4040 (Provincias gratuito)
      </div>
    </div>
  )
}

function DataRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: 'red'
}) {
  return (
    <div className="flex items-start gap-4 px-6 py-3">
      <span className="w-36 flex-shrink-0 text-xs font-medium text-gray-500 uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className={`text-sm ${highlight === 'red' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}
