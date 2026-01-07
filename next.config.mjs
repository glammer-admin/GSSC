/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Suprimir warning de deprecación de middleware -> proxy
  experimental: {
    suppressWarnings: ['middleware-to-proxy'],
  },
  // Configurar límite de tamaño para Server Actions
  serverActions: {
    bodySizeLimit: '10mb',
  },
}

export default nextConfig
