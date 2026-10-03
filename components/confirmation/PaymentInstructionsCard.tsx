'use client'

import React, { useState } from 'react'
import { Copy, Check, Clock, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { formatIDR } from '@/lib/utils/format'

interface PaymentInstructionsCardProps {
  registrationNumber: string
  totalAmount: number
  status: string
  paymentType?: string | null
  paymentMethodCode?: string | null
  bank?: string | null
  vaNumber?: string | null
  billerCode?: string | null
  billKey?: string | null
  qrUrl?: string | null
  paymentUrl?: string | null
}

export function PaymentInstructionsCard({
  registrationNumber,
  totalAmount,
  status,
  paymentType,
  paymentMethodCode,
  bank,
  vaNumber,
  billerCode,
  billKey,
  qrUrl,
  paymentUrl,
}: PaymentInstructionsCardProps) {
  const [copied, setCopied] = useState(false)
  const isPaid = status === 'paid'

  if (isPaid) return null

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isQris =
    qrUrl ||
    paymentType === 'qris' ||
    paymentMethodCode?.toLowerCase().includes('qris')

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-card space-y-6 animate-fade-up">
      {/* Header status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block">
              Menunggu Pembayaran
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-brand-text-dark font-heading">
              Selesaikan Pembayaran Anda
            </h2>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-brand-text-muted block">Total Tagihan:</span>
          <span className="text-2xl font-black font-heading text-brand-green-dark">
            {formatIDR(totalAmount)}
          </span>
        </div>
      </div>

      {/* QRIS Display */}
      {isQris && (
        <div className="flex flex-col items-center justify-center text-center p-6 bg-[#F8FAF6] rounded-2xl border border-brand-light-gray space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-green">
            Scan QRIS dengan Aplikasi Mobile Banking / E-Wallet
          </span>

          {qrUrl ? (
            <div className="bg-white p-4 rounded-2xl border-2 border-brand-green/30 shadow-md">
              <img
                src={qrUrl.startsWith('http') ? qrUrl : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`}
                alt="QRIS Code"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
              />
            </div>
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-500">
              QRIS siap discan
            </div>
          )}

          <p className="text-xs text-brand-text-muted max-w-sm">
            Mendukung GoPay, BCA, Mandiri, BNI, BRI, OVO, Dana, LinkAja, ShopeePay, dan seluruh aplikasi yang mendukung QRIS.
          </p>
        </div>
      )}

      {/* Virtual Account Display */}
      {vaNumber && !isQris && (
        <div className="p-5 bg-[#F8FAF6] rounded-2xl border border-brand-light-gray space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-green block">
            Nomor Virtual Account ({bank || 'Bank Transfer'})
          </span>

          <div className="flex items-center justify-between bg-white border border-brand-light-gray p-4 rounded-xl">
            <span className="text-xl sm:text-2xl font-mono font-black text-brand-text-dark tracking-wider">
              {vaNumber}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(vaNumber.replace(/\s+/g, ''))}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-off-white hover:bg-brand-green hover:text-white text-brand-green text-xs font-bold transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin No. VA</span>
                </>
              )}
            </button>
          </div>

          {billerCode && billKey && (
            <div className="text-xs text-gray-600 space-y-1 pt-1">
              <p>Kode Perusahaan (Biller Code): <strong>{billerCode}</strong></p>
              <p>Kode Pembayaran (Bill Key): <strong>{billKey}</strong></p>
            </div>
          )}
        </div>
      )}

      {/* Payment URL fallback button */}
      {paymentUrl && !isQris && !vaNumber && (
        <div className="p-5 bg-[#F8FAF6] rounded-2xl border border-brand-light-gray text-center space-y-3">
          <p className="text-xs text-gray-600">
            Silakan klik tombol di bawah untuk melanjutkan instruksi pembayaran melalui portal resmi Midtrans:
          </p>
          <a
            href={paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-leaf text-white font-bold text-sm shadow-cta transition-colors"
          >
            <span>Buka Halaman Pembayaran Midtrans</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Notification note */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-xs">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Konfirmasi Otomatis Realtime</p>
          <p>
            Setelah transfer berhasil, halaman ini akan otomatis terupdate menjadi LUNAS dalam beberapa detik (tanpa perlu kirim bukti transfer).
          </p>
        </div>
      </div>

      {/* Refresh status button */}
      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-xs text-brand-green hover:underline flex items-center gap-1.5 font-bold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Cek Ulang Status Pembayaran</span>
        </button>
      </div>
    </div>
  )
}
