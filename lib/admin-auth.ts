import { NextRequest, NextResponse } from 'next/server'

/**
 * Autenticación básica HTTP para el panel de administración.
 * Para producción con múltiples usuarios, migrar a NextAuth.js.
 *
 * Uso: enviar header Authorization: Bearer <ADMIN_PASSWORD>
 * O acceder al panel web que lo gestiona automáticamente.
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD no está configurada en las variables de entorno')
    return NextResponse.json(
      { success: false, error: 'Panel de administración no configurado.' },
      { status: 503 }
    )
  }

  // Soportar Bearer token o Basic Auth
  const authHeader = request.headers.get('authorization') ?? ''

  // Bearer token (usado por el panel web)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    if (token === adminPassword) return null // autorizado
  }

  // Basic Auth (para herramientas como curl)
  if (authHeader.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString()
    const [, password] = decoded.split(':')
    if (password === adminPassword) return null // autorizado
  }

  return NextResponse.json(
    { success: false, error: 'No autorizado.' },
    {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer realm="Admin Panel"' },
    }
  )
}

/**
 * Verifica la contraseña desde el lado del cliente del panel admin.
 * Retorna true si la contraseña es correcta.
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const response = await fetch('/api/admin/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return response.ok
}
