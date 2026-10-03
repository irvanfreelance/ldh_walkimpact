import React from 'react'
import Image from 'next/image'

interface ConfirmationHeroProps {
  contactName: string
}

export function ConfirmationHero({ contactName }: ConfirmationHeroProps) {
  return (
    <div className="text-center space-y-4 max-w-xl mx-auto mb-8">
      {/* Green Checkmark Icon */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto relative flex items-center justify-center animate-fade-up">
        <Image
          src="/images/icon-success-check.png"
          alt="Pendaftaran Berhasil"
          width={96}
          height={96}
          className="w-full h-full object-contain drop-shadow-lg"
          priority
        />
      </div>

      {/* Headline */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-text-dark font-heading leading-tight tracking-tight">
        Kamu Sudah Jadi <br />
        <span className="text-brand-green">Bagian dari Dampak.</span>
      </h1>

      {/* Subhead */}
      <p className="text-sm sm:text-base text-brand-text-muted">
        Terima kasih, <strong className="text-brand-text-dark">{contactName}</strong>! Pendaftaranmu berhasil kami terima.
      </p>
    </div>
  )
}
