'use client'

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'

import { claimSchema, type ClaimFormValues } from '@/schemas/claim.schema'
import { Button }   from '@/components/ui/Button'
import { Input }    from '@/components/ui/Input'
import { Select }   from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

// Opciones de selects
const DOCUMENT_TYPES = [
  { value: 'DNI',       label: 'DNI' },
  { value: 'CE',        label: 'Carné de Extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
]

const PRODUCT_TYPES = [
  { value: 'PRODUCTO', label: 'Producto' },
  { value: 'SERVICIO', label: 'Servicio' },
]

const CLAIM_TYPES = [
  { value: 'RECLAMO', label: 'Reclamo (incumplimiento)' },
  { value: 'QUEJA',   label: 'Queja (mala atención)' },
]

// Fecha máxima: hoy
const MAX_DATE = new Date().toISOString().split('T')[0]

export function ClaimForm() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      documentType: undefined,
      productType:  undefined,
      claimType:    undefined,
      acceptsDeclaration: false,
    },
  })

  const descriptionValue      = watch('description')      ?? ''
  const consumerRequestValue  = watch('consumerRequest')  ?? ''

  const onSubmit = async (data: ClaimFormValues) => {
    const loadingToast = toast.loading('Registrando su reclamo...')

    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        toast.error(result.error ?? 'Error al enviar el reclamo.', { id: loadingToast })
        return
      }

      toast.success('¡Reclamo registrado exitosamente!', { id: loadingToast })
      router.push(`/success/${result.data.id}`)
    } catch {
      toast.error('Error de conexión. Verifique su internet e intente nuevamente.', { id: loadingToast })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">

      {/* ── Datos del consumidor ── */}
      <section aria-labelledby="section-consumer">
        <SectionHeader
          id="section-consumer"
          number="1"
          title="Datos del Consumidor"
        />

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nombres"
            required
            placeholder="Ej.: Juan Carlos"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Apellidos"
            required
            placeholder="Ej.: García López"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            name="documentType"
            control={control}
            render={({ field }) => (
              <Select
                label="Tipo de Documento"
                required
                options={DOCUMENT_TYPES}
                error={errors.documentType?.message}
                {...field}
                value={field.value ?? ''}
              />
            )}
          />
          <Input
            label="Número de Documento"
            required
            placeholder="Ingrese su número de documento"
            error={errors.documentNumber?.message}
            {...register('documentNumber')}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Correo Electrónico"
            type="email"
            required
            placeholder="correo@ejemplo.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Teléfono Celular"
            type="tel"
            required
            placeholder="9XXXXXXXX"
            hint="9 dígitos, comienza con 9"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <div className="mt-4">
          <Input
            label="Dirección"
            required
            placeholder="Av./Jr./Ca. Nombre, N°, Distrito, Provincia, Departamento"
            error={errors.address?.message}
            {...register('address')}
          />
        </div>
      </section>

      {/* ── Bien contratado ── */}
      <section aria-labelledby="section-product">
        <SectionHeader
          id="section-product"
          number="2"
          title="Identificación del Bien Contratado"
        />

        <div className="mt-4 sm:max-w-xs">
          <Controller
            name="productType"
            control={control}
            render={({ field }) => (
              <Select
                label="Tipo de Bien"
                required
                options={PRODUCT_TYPES}
                error={errors.productType?.message}
                {...field}
                value={field.value ?? ''}
              />
            )}
          />
        </div>
      </section>

      {/* ── Detalle del reclamo ── */}
      <section aria-labelledby="section-claim">
        <SectionHeader
          id="section-claim"
          number="3"
          title="Detalle de la Reclamación"
        />

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Controller
            name="claimType"
            control={control}
            render={({ field }) => (
              <Select
                label="Tipo de Reclamación"
                required
                options={CLAIM_TYPES}
                error={errors.claimType?.message}
                {...field}
                value={field.value ?? ''}
              />
            )}
          />
          <Input
            label="Monto Reclamado (S/)"
            type="number"
            placeholder="0.00"
            hint="Opcional — solo si aplica"
            min="0"
            step="0.01"
            error={errors.claimedAmount?.message}
            {...register('claimedAmount')}
          />
          <Input
            label="Fecha del Incidente"
            type="date"
            required
            max={MAX_DATE}
            error={errors.incidentDate?.message}
            {...register('incidentDate')}
          />
        </div>

        <div className="mt-4">
          <Textarea
            label="Descripción del Problema"
            required
            placeholder="Describa detalladamente lo ocurrido: qué pasó, cuándo, dónde y cómo afectó sus derechos como consumidor..."
            showCount
            maxLength={2000}
            value={descriptionValue}
            error={errors.description?.message}
            hint="Mínimo 20 caracteres. Sea específico."
            {...register('description')}
          />
        </div>

        <div className="mt-4">
          <Textarea
            label="Pedido del Consumidor"
            required
            placeholder="Indique qué solución espera recibir: devolución de dinero, cambio de producto, reparación, etc."
            showCount
            maxLength={1000}
            value={consumerRequestValue}
            error={errors.consumerRequest?.message}
            {...register('consumerRequest')}
          />
        </div>
      </section>

      {/* ── Declaración jurada ── */}
      <section aria-labelledby="section-declaration">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-700 focus:ring-blue-500 cursor-pointer"
              {...register('acceptsDeclaration')}
            />
            <span className="text-sm text-gray-700">
              <strong>Declaración Jurada:</strong> Declaro bajo juramento que la información
              proporcionada en este formulario es verdadera y exacta, y que actúo de buena fe
              al presentar este reclamo. Entiendo que proporcionar información falsa puede
              conllevar responsabilidades legales.
            </span>
          </label>
          {errors.acceptsDeclaration && (
            <p className="mt-2 text-xs text-red-600 ml-8" role="alert">
              {errors.acceptsDeclaration.message}
            </p>
          )}
        </div>
      </section>

      {/* ── Submit ── */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registrando reclamo...' : 'Enviar Reclamo'}
        </Button>
        <p className="text-center text-xs text-gray-500">
          Al enviar, acepta que sus datos serán tratados conforme a la{' '}
          <a href="#" className="underline hover:text-blue-700">
            política de privacidad
          </a>{' '}
          de la empresa.
        </p>
      </div>
    </form>
  )
}

// Componente interno para encabezados de sección
function SectionHeader({
  id,
  number,
  title,
}: {
  id: string
  number: string
  title: string
}) {
  return (
    <div className="flex items-center gap-3 border-b-2 border-blue-700 pb-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
        {number}
      </span>
      <h2 id={id} className="text-base font-semibold text-blue-900 uppercase tracking-wide">
        {title}
      </h2>
    </div>
  )
}
