import { z } from 'zod'

// Regex para teléfono peruano: 9 dígitos, comienza con 9
const PERU_PHONE_REGEX = /^9\d{8}$/

// Regex para DNI peruano: exactamente 8 dígitos
const DNI_REGEX = /^\d{8}$/

// Regex para Carné de Extranjería: alfanumérico, 9-12 caracteres
const CE_REGEX = /^[A-Z0-9]{6,12}$/i

// Regex para pasaporte: alfanumérico 6-9 caracteres
const PASSPORT_REGEX = /^[A-Z0-9]{6,9}$/i

export const claimSchema = z
  .object({
    // --- Datos del consumidor ---
    firstName: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .regex(/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'-]+$/i, 'El nombre solo puede contener letras'),

    lastName: z
      .string()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(100, 'El apellido no puede exceder 100 caracteres')
      .regex(/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'-]+$/i, 'El apellido solo puede contener letras'),

    documentType: z.enum(['DNI', 'CE', 'PASAPORTE'], {
      required_error: 'Seleccione el tipo de documento',
    }),

    documentNumber: z.string().min(1, 'Ingrese el número de documento'),

    email: z
      .string()
      .min(1, 'El correo electrónico es requerido')
      .email('Ingrese un correo electrónico válido')
      .max(255, 'El correo no puede exceder 255 caracteres'),

    phone: z
      .string()
      .min(1, 'El teléfono es requerido')
      .regex(PERU_PHONE_REGEX, 'Ingrese un número celular peruano válido (9 dígitos, comienza con 9)'),

    address: z
      .string()
      .min(10, 'Ingrese una dirección más completa (mínimo 10 caracteres)')
      .max(500, 'La dirección no puede exceder 500 caracteres'),

    // --- Información del bien ---
    productType: z.enum(['PRODUCTO', 'SERVICIO'], {
      required_error: 'Seleccione el tipo de bien',
    }),

    // --- Detalle del reclamo ---
    claimType: z.enum(['RECLAMO', 'QUEJA'], {
      required_error: 'Seleccione el tipo de reclamo',
    }),

    claimedAmount: z
      .string()
      .optional()
      .transform((val) => (val === '' || val === undefined ? null : parseFloat(val)))
      .refine(
        (val) => val === null || (!isNaN(val) && val >= 0 && val <= 999999999),
        { message: 'Ingrese un monto válido' }
      ),

    incidentDate: z
      .string()
      .min(1, 'La fecha del incidente es requerida')
      .refine((val) => {
        const date = new Date(val)
        const now = new Date()
        return !isNaN(date.getTime()) && date <= now
      }, 'La fecha del incidente no puede ser en el futuro'),

    description: z
      .string()
      .min(20, 'Describa el problema con al menos 20 caracteres')
      .max(2000, 'La descripción no puede exceder 2000 caracteres'),

    consumerRequest: z
      .string()
      .min(10, 'Indique su pedido con al menos 10 caracteres')
      .max(1000, 'El pedido no puede exceder 1000 caracteres'),

    acceptsDeclaration: z
      .boolean()
      .refine((val) => val === true, {
        message: 'Debe declarar que la información es verdadera para continuar',
      }),
  })
  // Validación cruzada: número de documento según tipo
  .superRefine((data, ctx) => {
    const { documentType, documentNumber } = data

    if (documentType === 'DNI' && !DNI_REGEX.test(documentNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['documentNumber'],
        message: 'El DNI debe contener exactamente 8 dígitos',
      })
    }

    if (documentType === 'CE' && !CE_REGEX.test(documentNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['documentNumber'],
        message: 'El Carné de Extranjería debe tener entre 6 y 12 caracteres alfanuméricos',
      })
    }

    if (documentType === 'PASAPORTE' && !PASSPORT_REGEX.test(documentNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['documentNumber'],
        message: 'El pasaporte debe tener entre 6 y 9 caracteres alfanuméricos',
      })
    }
  })

export type ClaimFormValues = z.infer<typeof claimSchema>
