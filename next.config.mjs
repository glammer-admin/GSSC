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
}

export default nextConfig
