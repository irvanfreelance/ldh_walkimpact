'use client'

import React, { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'

interface RegistrationCardProps {
  registrationNumber: string
  status?: string
}

export function RegistrationCard({ registrationNumber, status = 'paid' }: RegistrationCardProps) {
  const [copied, setCopied] = useState(false)
  const isPaid = status === 'paid'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(registrationNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-brand-light-gray shadow-card flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl mx-auto">
      <div className="text-center sm:text-left space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">
          Nomor Pendaftaran
        </span>
        <div className="flex items-center justify-center sm:justify-start gap-2.5">
          <span className="text-2xl sm:text-3xl font-black font-heading tracking-wide text-brand-green-dark">
            {registrationNumber}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            title="Salin nomor pendaftaran"
            className="p-1.5 rounded-lg text-brand-text-muted hover:text-brand-green hover:bg-brand-off-white transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-5 h-5 text-brand-green stroke-[2.5]" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {isPaid ? (
        <a
          href={`/api/registrations/${registrationNumber}/ticket`}
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto bg-white hover:bg-brand-off-white text-brand-text-dark border-2 border-brand-green hover:border-brand-green-leaf font-bold text-sm px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs group"
        >
          <Download className="w-4 h-4 text-brand-green group-hover:scale-110 transition-transform" />
          <span>Simpan Tiket (PDF)</span>
        </a>
      ) : (
        <div className="text-center sm:text-right text-xs text-amber-700 bg-amber-50 border border-amber-200/70 px-4 py-2.5 rounded-xl font-medium">
          <span>Tiket PDF terbit otomatis setelah pembayaran lunas</span>
        </div>
      )}
    </div>
  )
}
