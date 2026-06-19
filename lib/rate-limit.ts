/**
 * Rate limiting en memoria para Route Handlers de Next.js.
 * Para producción con múltiples instancias, reemplazar con Redis (Upstash, etc.).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Map IP → contador de solicitudes
const store = new Map<string, RateLimitEntry>()

// Limpiar entradas expiradas cada 5 minutos para evitar memory leak
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /** Máximo de solicitudes permitidas en el intervalo */
  limit: number
  /** Ventana de tiempo en milisegundos */
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 5, windowMs: 60_000 }
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(identifier)

  // Sin entrada o ventana expirada → nueva ventana
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    store.set(identifier, newEntry)
    return { success: true, remaining: config.limit - 1, resetAt: newEntry.resetAt }
  }

  // Dentro de la ventana
  if (entry.count >= config.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  return { success: true, remaining: config.limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Extrae el IP del cliente desde los headers de Next.js.
 * Considera proxies inversos (Vercel, Nginx, etc.).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
