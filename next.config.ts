import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  // RUC como ruta base: https://dominio.com/10721468688
  basePath: '/10721468688',
}

export default nextConfig
