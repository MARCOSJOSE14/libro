import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // En Next.js 15 la opción se renombró de serverComponentsExternalPackages a serverExternalPackages
  serverExternalPackages: ['@prisma/client'],
}

export default nextConfig
