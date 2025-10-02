import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  api: {
    responseLimit: false,
  },
  experimental: {
    serverComponentsExternalPackages: ['jspdf', 'jspdf-autotable', 'xlsx']
  }
}

export default nextConfig
