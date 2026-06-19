import type { Claim, DocumentType, ProductType, ClaimType, ClaimStatus, AuditAction } from '@prisma/client'

export type { DocumentType, ProductType, ClaimType, ClaimStatus, AuditAction }

export type ClaimRecord = Claim

export type CreateClaimPayload = {
  firstName: string
  lastName: string
  documentType: DocumentType
  documentNumber: string
  email: string
  phone: string
  address: string
  productType: ProductType
  claimType: ClaimType
  claimedAmount?: number | null
  incidentDate: string
  description: string
  consumerRequest: string
  acceptsDeclaration: boolean
}

export type CreateClaimResponse = {
  success: true
  data: {
    id: string
    claimNumber: string
    createdAt: string
    responseDeadline: string
  }
}

export type ApiErrorResponse = {
  success: false
  error: string
  details?: unknown
}

// ── Labels para UI y PDF ─────────────────────────────────────────────────────

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  DNI:       'DNI',
  CE:        'Carné de Extranjería',
  PASAPORTE: 'Pasaporte',
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  PRODUCTO: 'Producto',
  SERVICIO: 'Servicio',
}

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  RECLAMO: 'Reclamo',
  QUEJA:   'Queja',
}

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  PENDING:   'Pendiente',
  IN_REVIEW: 'En Revisión',
  RESPONDED: 'Respondido',
  RESOLVED:  'Resuelto',
  REJECTED:  'Rechazado',
  EXPIRED:   'Plazo Vencido',
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATED:        'Reclamo ingresado',
  STATUS_CHANGED: 'Estado actualizado',
  RESPONDED:      'Respuesta registrada',
  EXPORTED:       'Exportado para auditoría',
  VIEWED:         'Consultado por administrador',
}
