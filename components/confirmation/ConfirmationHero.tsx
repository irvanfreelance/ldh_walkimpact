import React from 'react'
import Image from 'next/image'
import { Clock } from 'lucide-react'

interface ConfirmationHeroProps {
  contactName: string
  status?: string
}

export function ConfirmationHero({ contactName, status = 'paid' }: ConfirmationHeroProps) {
  const isPending = status !== 'paid'

  return (
    <div className="text-center space-y-4 max-w-xl mx-auto mb-8">
      {/* Icon */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto relative flex items-center justify-center animate-fade-up">
        {isPending ? (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center shadow-lg">
            <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 animate-pulse" />
          </div>
        ) : (
          <Image
            src="/images/icon-success-check.png"
            alt="Pendaftaran Berhasil"
            width={96}
            height={96}
            className="w-full h-full object-contain drop-shadow-lg"
            priority
          />
        )}
      </div>

      {/* Headline */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-text-dark font-heading leading-tight tracking-tight">
        {isPending ? (
          <>
            Pendaftaran Diterima, <br />
            <span className="text-brand-green">Selesaikan Pembayaran.</span>
          </>
        ) : (
          <>
            Kamu Sudah Jadi <br />
            <span className="text-brand-green">Bagian dari Dampak.</span>
          </>
        )}
      </h1>

      {/* Subhead */}
      <p className="text-sm sm:text-base text-brand-text-muted">
        {isPending ? (
          <>
            Halo, <strong className="text-brand-text-dark">{contactName}</strong>! Silakan selesaikan pembayaran agar nomor BIB dan e-tiket resmi Anda dapat langsung diterbitkan.
          </>
        ) : (
          <>
            Terima kasih, <strong className="text-brand-text-dark">{contactName}</strong>! Pendaftaranmu berhasil dikonfirmasi dan lunas.
          </>
        )}
      </p>
    </div>
  )
}
