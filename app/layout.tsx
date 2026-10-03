import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://walkimpact.darulhikam.or.id'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Walk Impact 2026 — Jalan Bersama, Ciptakan Dampak | LAZ Darul Hikam',
    template: '%s | Walk Impact 2026',
  },
  description:
    'Walk Impact 2026 adalah jalan santai keluarga & kemanusiaan 7 KM di Bandung. Setiap langkah bernilai 1 paket sembako untuk keluarga dhuafa. Amankan tiketmu sekarang!',
  keywords: [
    'Walk Impact 2026',
    'LAZ Darul Hikam',
    'Jalan Santai Bandung',
    'Fun Walk Bandung',
    'Donasi Sembako',
    'Event Amal Bandung',
    'Batununggal Indah Club',
  ],
  authors: [{ name: 'LAZ Darul Hikam', url: 'https://lazdarulhikam.org' }],
  creator: 'LAZ Darul Hikam',
  publisher: 'LAZ Darul Hikam',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon-32.png',
  },
  openGraph: {
    title: 'Walk Impact 2026 — Jalan Bersama, Ciptakan Dampak',
    description:
      'Event jalan santai 7 KM & aksi nyata berbagi 1.000 paket sembako di Bandung bersama LAZ Darul Hikam. Ikut melangkah bersama 750 peserta lainnya!',
    url: siteUrl,
    siteName: 'Walk Impact 2026',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Walk Impact 2026 — LAZ Darul Hikam',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Walk Impact 2026 — Jalan Bersama, Ciptakan Dampak',
    description:
      'Event jalan santai 7 KM & aksi nyata berbagi 1.000 paket sembako di Bandung bersama LAZ Darul Hikam. Daftar sekarang!',
    images: ['/images/og-image.png'],
  },
}

import { AuthProvider } from '@/components/providers/AuthProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'
  const snapUrl = isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js'
  const clientKey =
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
    process.env.MIDTRANS_CLIENT_KEY ||
    'SB-Mid-client-test'

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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
