/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Keep this for now, but fix errors before production
    ignoreBuildErrors: false,
  },
  images: {
    // Enable image optimization for Vercel
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
