import type { Metadata } from 'next'
import { ClaimForm } from '@/components/forms/ClaimForm'

export const metadata: Metadata = {
  title: 'Registrar Reclamo',
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">

      {/* Hero / Aviso importante */}
      <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            {/* Ícono de información */}
            <svg className="h-6 w-6 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-blue-900">¿Qué es el Libro de Reclamaciones?</h2>
            <p className="mt-1 text-sm text-blue-800">
              Conforme a la <strong>Ley N° 29571</strong> (Código de Protección y Defensa del
              Consumidor), todo establecimiento comercial está obligado a contar con un Libro de
              Reclamaciones. Al registrar su reclamo, la empresa tiene <strong>30 días hábiles</strong>{' '}
              para responder. Puede escalar su caso a INDECOPI si no recibe respuesta.
            </p>
          </div>
        </div>
      </div>

      {/* Diferencia entre Reclamo y Queja */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <h3 className="font-semibold text-orange-800">Reclamo</h3>
          <p className="mt-1 text-sm text-orange-700">
            Disconformidad relacionada con los productos o servicios adquiridos (producto defectuoso,
            servicio no brindado, cobro incorrecto, etc.).
          </p>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <h3 className="font-semibold text-purple-800">Queja</h3>
          <p className="mt-1 text-sm text-purple-700">
            Disconformidad relacionada con la atención al cliente o el trato recibido, sin que implique
            un problema con el producto o servicio en sí.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 animate-fade-in">
        <div className="mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-900">Formulario de Reclamación</h2>
          <p className="mt-1 text-sm text-gray-600">
            Los campos marcados con <span className="text-red-500 font-bold">*</span> son obligatorios.
          </p>
        </div>

        <ClaimForm />
      </div>
    </div>
  )
}
