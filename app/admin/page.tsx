'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDateTimePeru, formatDatePeru, workdaysRemaining } from '@/lib/utils'
import { CLAIM_TYPE_LABELS, CLAIM_STATUS_LABELS, type ClaimStatus } from '@/types/claim'
import { Button } from '@/components/ui/Button'

// ── Tipos locales ────────────────────────────────────────────────────────────

interface ClaimSummary {
  id: string
  claimNumber: string
  firstName: string
  lastName: string
  documentType: string
  documentNumber: string
  email: string
  phone: string
  claimType: keyof typeof CLAIM_TYPE_LABELS
  productType: string
  status: ClaimStatus
  claimedAmount: number | null
  incidentDate: string
  responseDeadline: string
  respondedAt: string | null
  createdAt: string
}

interface Stats {
  PENDING?: number
  IN_REVIEW?: number
  RESPONDED?: number
  RESOLVED?: number
  REJECTED?: number
  EXPIRED?: number
}

const STATUS_COLORS: Record<ClaimStatus, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  IN_REVIEW: 'bg-blue-100 text-blue-800',
  RESPONDED: 'bg-indigo-100 text-indigo-800',
  RESOLVED:  'bg-green-100 text-green-800',
  REJECTED:  'bg-gray-100 text-gray-700',
  EXPIRED:   'bg-red-100 text-red-800',
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword]           = useState('')
  const [authError, setAuthError]         = useState('')
  const [authLoading, setAuthLoading]     = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        sessionStorage.setItem('adminToken', password)
        setAuthenticated(true)
      } else {
        setAuthError('Contraseña incorrecta.')
      }
    } finally {
      setAuthLoading(false)
    }
  }

  // Verificar si ya hay sesión activa
  useEffect(() => {
    const token = sessionStorage.getItem('adminToken')
    if (token) setAuthenticated(true)
  }, [])

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-900">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="mt-1 text-sm text-gray-500">Libro de Reclamaciones</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese la contraseña"
                required
                autoFocus
              />
            </div>
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <Button type="submit" fullWidth loading={authLoading}>
              Ingresar
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return <AdminDashboard />
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function AdminDashboard() {
  const [claims, setClaims]         = useState<ClaimSummary[]>([])
  const [stats, setStats]           = useState<Stats>({})
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [statusFilter, setFilter]   = useState('')
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected]     = useState<ClaimSummary | null>(null)
  const [exportLoading, setExportLoading] = useState(false)

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') ?? '' : ''

  const fetchClaims = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      })

      const res = await fetch(`/api/admin/claims?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.success) {
        setClaims(data.data.claims)
        setStats(data.data.stats)
        setTotalPages(data.data.pagination.totalPages)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, token])

  useEffect(() => { fetchClaims() }, [fetchClaims])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/admin/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `libro-reclamaciones-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExportLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken')
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header admin */}
      <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Panel Administrativo — Libro de Reclamaciones</h1>
          <p className="text-xs text-blue-200">
            {process.env.NEXT_PUBLIC_COMPANY_NAME} · RUC: {process.env.NEXT_PUBLIC_COMPANY_RUC}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            loading={exportLoading}
          >
            Exportar CSV (INDECOPI)
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-blue-800">
            Cerrar sesión
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* Estadísticas */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.entries(CLAIM_STATUS_LABELS) as [ClaimStatus, string][]).map(([key, label]) => (
            <div
              key={key}
              className={`rounded-xl border p-4 text-center cursor-pointer transition-all ${
                statusFilter === key ? 'ring-2 ring-blue-500' : ''
              } ${key === 'EXPIRED' ? 'border-red-200 bg-red-50' : 'bg-white'}`}
              onClick={() => setFilter(statusFilter === key ? '' : key)}
            >
              <p className="text-2xl font-bold text-gray-900">{stats[key] ?? 0}</p>
              <p className="mt-0.5 text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            placeholder="Buscar por N° reclamo, nombre, DNI, correo..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setFilter(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(CLAIM_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600 tracking-wide">
              <tr>
                {['N° Reclamo', 'Consumidor', 'Tipo', 'Fecha Registro', 'Plazo / Estado', 'Acciones'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Cargando reclamos...
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No se encontraron reclamos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => {
                  const daysLeft = workdaysRemaining(new Date(claim.responseDeadline))
                  const isUrgent = daysLeft <= 5 && claim.status === 'PENDING'

                  return (
                    <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700 whitespace-nowrap">
                        {claim.claimNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{claim.firstName} {claim.lastName}</p>
                        <p className="text-xs text-gray-500">{claim.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[claim.status]}`}>
                          {CLAIM_STATUS_LABELS[claim.status]}
                        </span>
                        <p className="mt-1 text-xs text-gray-500">{CLAIM_TYPE_LABELS[claim.claimType]}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {formatDateTimePeru(claim.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {claim.respondedAt ? (
                          <p className="text-xs text-green-700 font-medium">
                            ✓ Respondido {formatDatePeru(claim.respondedAt)}
                          </p>
                        ) : (
                          <p className={`text-xs font-medium ${isUrgent ? 'text-red-600' : 'text-gray-600'}`}>
                            {daysLeft > 0
                              ? `${daysLeft} días restantes`
                              : 'PLAZO VENCIDO'}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Vence: {formatDatePeru(claim.responseDeadline)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(claim)}
                          className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 transition-colors"
                        >
                          Ver / Responder
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-100"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-100"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Modal detalle/respuesta */}
      {selected && (
        <ClaimDetailModal
          claim={selected}
          token={token}
          onClose={() => setSelected(null)}
          onSuccess={() => { setSelected(null); fetchClaims() }}
        />
      )}
    </div>
  )
}

// ── Modal de detalle y respuesta ─────────────────────────────────────────────

function ClaimDetailModal({
  claim,
  token,
  onClose,
  onSuccess,
}: {
  claim: ClaimSummary
  token: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [response, setResponse]     = useState('')
  const [newStatus, setNewStatus]   = useState<ClaimStatus>('RESPONDED')
  const [respondedBy, setRespondedBy] = useState('Administrador')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const handleRespond = async () => {
    if (response.trim().length < 10) {
      setError('La respuesta debe tener al menos 10 caracteres.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/claims/${claim.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ response, status: newStatus, respondedBy }),
      })
      const data = await res.json()
      if (data.success) onSuccess()
      else setError(data.error ?? 'Error al guardar la respuesta.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    const res = await fetch(`/api/claims/${claim.id}/pdf`)
    if (!res.ok) return
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${claim.claimNumber}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header del modal */}
        <div className="sticky top-0 bg-blue-900 px-6 py-4 text-white flex items-center justify-between rounded-t-2xl">
          <div>
            <p className="text-xs text-blue-200">Detalle del Reclamo</p>
            <h2 className="text-lg font-bold">{claim.claimNumber}</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPdf}
              className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
            >
              PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Datos del consumidor */}
          <Section title="Datos del Consumidor">
            <Row label="Nombre"    value={`${claim.firstName} ${claim.lastName}`} />
            <Row label="Documento" value={`${claim.documentType} ${claim.documentNumber}`} />
            <Row label="Correo"    value={claim.email} />
            <Row label="Teléfono"  value={claim.phone} />
          </Section>

          {/* Datos del reclamo */}
          <Section title="Detalle del Reclamo">
            <Row label="Tipo"           value={CLAIM_TYPE_LABELS[claim.claimType]} />
            <Row label="Estado actual"  value={CLAIM_STATUS_LABELS[claim.status]} />
            <Row label="Fecha ingreso"  value={formatDateTimePeru(claim.createdAt)} />
            <Row label="Fecha incidente" value={formatDatePeru(claim.incidentDate)} />
            <Row label="Plazo respuesta" value={formatDatePeru(claim.responseDeadline)} />
          </Section>

          {/* Responder */}
          {!claim.respondedAt && (
            <Section title="Registrar Respuesta Formal">
              <p className="text-xs text-gray-500 mb-3">
                Esta respuesta quedará registrada con fecha y hora en el audit log para trazabilidad INDECOPI.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Respondido por
                  </label>
                  <input
                    type="text"
                    value={respondedBy}
                    onChange={(e) => setRespondedBy(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nuevo estado
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ClaimStatus)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="IN_REVIEW">En Revisión</option>
                    <option value="RESPONDED">Respondido</option>
                    <option value="RESOLVED">Resuelto</option>
                    <option value="REJECTED">Rechazado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Respuesta formal al consumidor <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={5}
                    placeholder="Escriba la respuesta formal que se enviará al consumidor y quedará registrada en el libro..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                  <p className="text-right text-xs text-gray-400 mt-0.5">{response.length}/5000</p>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button fullWidth onClick={handleRespond} loading={loading}>
                  Guardar Respuesta y Actualizar Estado
                </Button>
              </div>
            </Section>
          )}

          {claim.respondedAt && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-800">
                ✓ Respondido el {formatDateTimePeru(claim.respondedAt)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-blue-900 uppercase tracking-wide border-b border-blue-100 pb-1">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-32 flex-shrink-0 text-xs font-medium text-gray-500">{label}:</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}
