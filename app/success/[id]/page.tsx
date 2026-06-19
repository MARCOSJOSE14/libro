import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDateTimePeru, formatDatePeru } from '@/lib/utils'
import { CLAIM_TYPE_LABELS, DOCUMENT_TYPE_LABELS, PRODUCT_TYPE_LABELS } from '@/types/claim'
import { DownloadPdfButton } from './DownloadPdfButton'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Reclamo Registrado — ${id.slice(0, 8).toUpperCase()}` }
}

export default async function SuccessPage({ params }: Props) {
  const { id } = await params

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_REGEX.test(id)) notFound()

  const claim = await prisma.claim.findUnique({
    where: { id },
    select: {
      id: true,
      claimNumber: true,
      createdAt: true,
      responseDeadline: true,
      firstName: true,
      lastName: true,
      documentType: true,
      documentNumber: true,
      email: true,
      phone: true,
      productType: true,
      claimType: true,
      incidentDate: true,
      description: true,
      timezone: true,
    },
  })

  if (!claim) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">

      {/* Banner de éxito */}
      <div className="mb-8 flex flex-col items-center text-center animate-fade-in">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">¡Reclamo Registrado!</h1>
        <p className="mt-2 max-w-sm text-gray-600">
          Su reclamo ha sido registrado exitosamente con validez legal conforme a la Ley N.° 29571.
        </p>
      </div>

      {/* Tarjeta principal */}
      <div className="rounded-2xl border-2 border-blue-200 bg-white shadow-sm overflow-hidden animate-fade-in">

        <div className="bg-blue-900 px-6 py-5 text-white">
          <p className="text-xs uppercase tracking-widest text-blue-200">Número de Reclamo (N° de Folio)</p>
          <p className="mt-1 text-3xl font-bold tracking-wider font-mono">{claim.claimNumber}</p>
          <p className="mt-2 text-sm text-blue-200">
            Registrado el <strong className="text-white">{formatDateTimePeru(claim.createdAt)}</strong>
            <span className="ml-1 text-xs">(hora Lima)</span>
          </p>
        </div>

        {/* Plazo legal destacado */}
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 flex items-center gap-3">
          <svg className="h-5 w-5 flex-shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Plazo de respuesta: <strong>{formatDatePeru(claim.responseDeadline)}</strong>
            </p>
            <p className="text-xs text-amber-700">
              La empresa tiene 30 días hábiles para responder (Art. 24 DS 011-2011-PCM)
            </p>
          </div>
        </div>

        {/* Datos del reclamo */}
        <div className="divide-y divide-gray-100">
          <DataRow label="Nombre"         value={`${claim.firstName} ${claim.lastName}`} />
          <DataRow label="Documento"      value={`${DOCUMENT_TYPE_LABELS[claim.documentType]} ${claim.documentNumber}`} />
          <DataRow label="Correo"         value={claim.email} />
          <DataRow label="Teléfono"       value={claim.phone} />
          <DataRow label="Tipo de bien"   value={PRODUCT_TYPE_LABELS[claim.productType]} />
          <DataRow label="Tipo"           value={CLAIM_TYPE_LABELS[claim.claimType]} />
          <DataRow label="Fecha incidente" value={formatDatePeru(claim.incidentDate)} />
          <div className="px-6 py-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Descripción</p>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{claim.description}</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="border-t bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3">
          <DownloadPdfButton claimId={claim.id} claimNumber={claim.claimNumber} />
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Registrar otro reclamo
          </Link>
        </div>
      </div>

      {/* Información legal y derechos */}
      <div className="mt-6 space-y-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Sus derechos como consumidor (Ley N.° 29571):</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>La empresa tiene <strong>30 días hábiles</strong> para responder a su reclamo.</li>
            <li>Si no recibe respuesta oportuna, puede presentar una denuncia ante <strong>INDECOPI</strong>.</li>
            <li>La presentación de un reclamo no impide que acuda a otras vías (arbitraje, judicial).</li>
            <li>Conserve este número <strong>{claim.claimNumber}</strong> para su seguimiento.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-600">
          <p className="font-semibold text-gray-700 mb-1">Contacto INDECOPI:</p>
          <p>📞 Lima: <strong>224-7777</strong> · Provincias (gratuito): <strong>0800-4-4040</strong></p>
          <p>🌐 www.indecopi.gob.pe · Formulario virtual: <strong>formindecopi.indecopi.gob.pe</strong></p>
        </div>
      </div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 px-6 py-3">
      <span className="w-36 flex-shrink-0 text-xs font-medium text-gray-500 uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}
