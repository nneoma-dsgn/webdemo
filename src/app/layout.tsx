import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import type { ReactNode } from 'react'
import '@/styles/tokens.css'
import '@/styles/app.css'
import '@/styles/login.css'
import { MenuProvider } from '@/components/Menu'

export const metadata: Metadata = {
  title: 'Circo',
  description: 'Nollywood and the world, in one place.',
}

export const viewport: Viewport = {
  themeColor: '#040404',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Hero trailers: warm up YouTube before the page needs it. */}
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://googlevideo.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Script src="https://www.youtube.com/iframe_api" strategy="afterInteractive" />
        <MenuProvider>{children}</MenuProvider>
      </body>
    </html>
  )
}
