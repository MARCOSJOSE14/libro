import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-6xl font-bold text-blue-900">404</p>
      <h2 className="mt-4 text-xl font-semibold text-gray-900">Página no encontrada</h2>
      <p className="mt-2 text-gray-600">
        El reclamo que busca no existe o el enlace es inválido.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
