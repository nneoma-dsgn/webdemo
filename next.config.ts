import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Phones on the Mac's network (the iPhone hotspot hands out 172.20.10.x) can load dev assets.
  allowedDevOrigins: ['172.20.10.*'],
  devIndicators: { position: 'top-right' },
}

export default nextConfig
