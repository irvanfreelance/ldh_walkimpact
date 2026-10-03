import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Walk Impact 2026 — Jalan Bersama, Ciptakan Dampak | LAZ Darul Hikam',
  description:
    'Event jalan santai sosial 7 KM di Bandung. 750 peserta, 1.000 paket sembako untuk keluarga pra-sejahtera. Daftar sekarang!',
  openGraph: {
    title: 'Walk Impact 2026 — Jalan Bersama, Ciptakan Dampak',
    description:
      'Event jalan santai sosial 7 KM di Bandung. 750 peserta, 1.000 paket sembako untuk keluarga pra-sejahtera.',
    url: 'https://walkimpact.id',
    siteName: 'Walk Impact 2026',
    images: [
      {
        url: '/images/hero-community-walk.png',
        width: 1200,
        height: 630,
        alt: 'Walk Impact 2026',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'
  const snapUrl = isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js'
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-test'

  return (
    <html lang="id" className="h-full scroll-smooth">
      <head>
        <Script
          src={snapUrl}
          data-client-key={clientKey}
          strategy="lazyOnload"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white text-brand-text-dark antialiased">
        {children}
      </body>
    </html>
  )
}
