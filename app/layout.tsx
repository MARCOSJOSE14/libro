import type { Metadata } from 'next'
import Image from 'next/image'
import { Toaster } from 'react-hot-toast'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Libro de Reclamaciones',
    template: '%s | Libro de Reclamaciones',
  },
  description:
    'Registre su reclamo o queja de forma rápida y segura conforme al Código de Protección al Consumidor (Ley N° 29571).',
  robots: { index: false, follow: false }, // no indexar en buscadores
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {/* Toasts globales */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              borderRadius: '10px',
              background: '#1e3a8a',
              color: '#fff',
            },
            success: { style: { background: '#15803d' } },
            error:   { style: { background: '#b91c1c' } },
          }}
        />

        {/* Cabecera con franja de colores peruana */}
        <header className="sticky top-0 z-50 shadow-md">
          {/* Franja tricolor (rojo-blanco-rojo) — Bandera del Perú */}
          <div className="flex h-1.5">
            <div className="w-1/3 bg-peru-red" />
            <div className="w-1/3 bg-white border-y border-gray-200" />
            <div className="w-1/3 bg-peru-red" />
          </div>

          <div className="bg-white px-4 py-3">
            <div className="mx-auto flex max-w-4xl items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.jpeg"
                  alt="Logo de la empresa"
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                  priority
                />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                    {process.env.NEXT_PUBLIC_COMPANY_NAME ?? 'Mi Empresa S.A.C.'}
                  </p>
                  <h1 className="text-sm font-bold text-blue-900">Libro de Reclamaciones</h1>
                </div>
              </div>
              <span className="hidden sm:block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                Ley N° 29571
              </span>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-16 border-t bg-white py-8">
          <div className="mx-auto max-w-4xl px-4 text-center text-xs text-gray-500 space-y-1">
            <p>
              {process.env.NEXT_PUBLIC_COMPANY_NAME} — RUC: {process.env.NEXT_PUBLIC_COMPANY_RUC}
            </p>
            <p>
              Conforme al Artículo 150° del Código de Protección y Defensa del Consumidor — Ley N° 29571
            </p>
            <p>
              Para reclamos adicionales puede contactar a{' '}
              <strong>INDECOPI</strong>: 224-7777 (Lima) / 0800-4-4040 (Provincias gratuito)
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
