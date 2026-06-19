'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'

interface Props {
  claimId: string
  claimNumber: string
}

export function DownloadPdfButton({ claimId, claimNumber }: Props) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    const toastId = toast.loading('Generando PDF...')

    try {
      const response = await fetch(`/api/claims/${claimId}/pdf`)

      if (!response.ok) {
        throw new Error('No se pudo generar el PDF')
      }

      const blob = await response.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `libro-reclamaciones-${claimNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success('PDF descargado exitosamente', { id: toastId })
    } catch {
      toast.error('Error al generar el PDF. Intente nuevamente.', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      loading={loading}
      className="flex-1"
      size="md"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Descargar PDF
    </Button>
  )
}
