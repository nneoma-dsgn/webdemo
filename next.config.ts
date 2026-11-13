import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Dev only: phones on the same local network (home Wi-Fi or an iPhone hotspot) can load the
  // dev server's assets. Private address ranges only.
  allowedDevOrigins: ['10.*.*.*', '172.*.*.*', '192.168.*.*'],
  devIndicators: { position: 'top-right' },
}

export default nextConfig
