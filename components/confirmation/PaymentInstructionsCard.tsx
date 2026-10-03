'use client'

import React, { useState } from 'react'
import { Copy, Check, Clock, AlertCircle, ExternalLink, RefreshCw, Landmark, HelpCircle } from 'lucide-react'
import { formatIDR } from '@/lib/utils/format'

interface PaymentInstructionsCardProps {
  registrationNumber: string
  totalAmount: number
  adminFee?: number
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
  adminFee = 0,
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
  const [copiedVa, setCopiedVa] = useState(false)
  const [copiedAmount, setCopiedAmount] = useState(false)
  const [copiedBankAcc, setCopiedBankAcc] = useState(false)

  const isPaid = status === 'paid'
  if (isPaid) return null

  const handleCopy = (text: string, type: 'va' | 'amount' | 'acc') => {
    navigator.clipboard.writeText(text)
    if (type === 'va') {
      setCopiedVa(true)
      setTimeout(() => setCopiedVa(false), 2000)
    } else if (type === 'amount') {
      setCopiedAmount(true)
      setTimeout(() => setCopiedAmount(false), 2000)
    } else if (type === 'acc') {
      setCopiedBankAcc(true)
      setTimeout(() => setCopiedBankAcc(false), 2000)
    }
  }

  const codeUpper = (paymentMethodCode || '').toUpperCase()
  const typeLower = (paymentType || '').toLowerCase()

  const isManual =
    typeLower === 'manual_transfer' ||
    codeUpper.includes('MANUAL') ||
    codeUpper === 'BCA_MANUAL' ||
    codeUpper === 'MANDIRI_MANUAL'

  const manualBankName =
    bank || (codeUpper.includes('BCA') ? 'Bank BCA' : codeUpper.includes('MANDIRI') ? 'Bank Mandiri' : 'Bank Transfer')
  const manualAccountNumber =
    vaNumber || (codeUpper.includes('BCA') ? '7772445588' : '1310012345678')
  const manualAccountHolder = 'LAZ Darul Hikam'

  const isQris =
    !isManual &&
    (codeUpper.includes('QRIS') || typeLower === 'qr_code') &&
    Boolean(qrUrl && !qrUrl.startsWith('http://app.midtrans.com') && !qrUrl.startsWith('https://app.midtrans.com'))

  const isVA =
    !isManual &&
    Boolean(vaNumber)

  // Extract unique code (3 digits)
  const uniqueCode = adminFee > 0 ? adminFee : (totalAmount % 1000)

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-card space-y-6 animate-fade-up">
      {/* Header status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider">
                Menunggu Pembayaran
              </span>
              <span className="text-[11px] text-gray-500 font-bold">
                Metode: {isManual ? `${manualBankName} (Transfer Manual)` : (bank || paymentMethodCode?.replace('MIDTRANS_', '') || 'Midtrans')}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-brand-text-dark font-heading mt-1">
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

      {/* 1. MANUAL BANK TRANSFER INSTRUCTION BOX */}
      {isManual && (
        <div className="space-y-4">
          <div className="p-5 bg-[#F4F9EE] rounded-2xl border-2 border-brand-green/30 space-y-4">
            <div className="flex items-center gap-2 text-brand-green">
              <Landmark className="w-5 h-5" />
              <span className="font-extrabold text-sm uppercase tracking-wider">
                Instruksi Transfer Rekening Manual
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Silakan lakukan transfer ke rekening resmi <strong>{manualAccountHolder}</strong> di bawah ini. Pastikan nominal transfer tepat hingga <strong>3 digit terakhir</strong> agar pembayaran Anda dapat diverifikasi dengan cepat.
            </p>

            {/* Account Card */}
            <div className="bg-white rounded-xl border border-brand-light-gray p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="text-xs text-gray-500 font-medium">Bank Tujuan Transfer:</div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="text-lg sm:text-xl font-extrabold text-gray-900">{manualBankName}</div>
                  <div className="text-xs text-gray-500">Atas Nama: <strong className="text-gray-800">{manualAccountHolder}</strong></div>
                </div>
              </div>

              {/* Account Number Copy */}
              <div>
                <span className="text-xs font-bold text-gray-600 block mb-1">Nomor Rekening:</span>
                <div className="flex items-center justify-between bg-[#F8FAF6] border border-brand-light-gray p-3.5 rounded-xl">
                  <span className="text-xl sm:text-2xl font-mono font-black text-brand-text-dark tracking-wider">
                    {manualAccountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(manualAccountNumber.replace(/\s+/g, ''), 'acc')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-green text-white hover:bg-brand-green-leaf text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    {copiedBankAcc ? (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Rekening</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Exact Amount Copy */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-600">Nominal Transfer (Tepat):</span>
                  {uniqueCode > 0 && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Termasuk Kode Unik: +{uniqueCode}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between bg-amber-50/80 border-2 border-amber-300 p-3.5 rounded-xl">
                  <div>
                    <span className="text-xl sm:text-2xl font-mono font-black text-amber-950 tracking-wider">
                      {formatIDR(totalAmount)}
                    </span>
                    <span className="text-[11px] text-amber-800 block mt-0.5 font-medium">
                      (Wajib transfer persis angka di atas: <strong>{totalAmount}</strong>)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(totalAmount), 'amount')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    {copiedAmount ? (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Nominal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* WA Confirmation info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
              <span className="text-gray-600">
                Setelah transfer, silakan konfirmasi bukti transfer atau tunggu verifikasi admin:
              </span>
              <a
                href={`https://wa.me/6281572225545?text=Halo%20Admin%20Walk%20Impact,%20saya%20sudah%20melakukan%20transfer%20manual%20untuk%20nomor%20pendaftaran%20${registrationNumber}%20sebesar%20${totalAmount}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
              >
                <span>Konfirmasi via WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. QRIS Display - Only if user selected QRIS or has valid QR Code */}
      {isQris && qrUrl && (
        <div className="flex flex-col items-center justify-center text-center p-6 bg-[#F8FAF6] rounded-2xl border border-brand-light-gray space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-green">
            Scan QRIS dengan Aplikasi Mobile Banking / E-Wallet
          </span>

          <div className="bg-white p-4 rounded-2xl border-2 border-brand-green/30 shadow-md">
            <img
              src={qrUrl.startsWith('http') ? qrUrl : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`}
              alt="QRIS Code"
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
            />
          </div>

          <p className="text-xs text-brand-text-muted max-w-sm">
            Mendukung GoPay, BCA, Mandiri, BNI, BRI, OVO, Dana, LinkAja, ShopeePay, dan seluruh aplikasi yang mendukung QRIS.
          </p>
        </div>
      )}

      {/* 3. Virtual Account / Mandiri Bill Display (Midtrans) */}
      {isVA && (
        <div className="p-5 bg-[#F8FAF6] rounded-2xl border border-brand-light-gray space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green block">
              {bank === 'MANDIRI' || billKey ? 'Nomor Pembayaran Mandiri Bill (E-Channel)' : `Nomor Virtual Account (${bank || 'Bank Transfer'})`}
            </span>
            <span className="text-[11px] font-bold text-gray-400 font-mono">
              Bayar Sebelum 24 Jam
            </span>
          </div>

          <div className="flex items-center justify-between bg-white border border-brand-light-gray p-4 rounded-xl">
            <span className="text-xl sm:text-2xl font-mono font-black text-brand-text-dark tracking-wider">
              {vaNumber}
            </span>
            <button
              type="button"
              onClick={() => handleCopy((vaNumber || '').replace(/\s+/g, ''), 'va')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-off-white hover:bg-brand-green hover:text-white text-brand-green text-xs font-bold transition-all cursor-pointer"
            >
              {copiedVa ? (
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
            <div className="text-xs text-gray-600 space-y-1 pt-1 bg-white p-3 rounded-xl border border-brand-light-gray">
              <p>Perusahaan / Institusi: <strong>LAZ Darul Hikam ({billerCode})</strong></p>
              <p>Nomor Pelanggan / Bill Key: <strong className="font-mono">{billKey}</strong></p>
            </div>
          )}
        </div>
      )}

      {/* 4. Fallback Midtrans Popup or Redirect if VA not yet visible or user needs to pay */}
      {!isManual && !vaNumber && !isQris && (
        <div className="p-5 bg-[#F8FAF6] rounded-2xl border border-brand-light-gray text-center space-y-3">
          <p className="text-xs text-gray-600">
            Anda belum menyelesaikan pembayaran di pop-up Midtrans. Silakan klik tombol di bawah untuk melanjutkan instruksi pembayaran:
          </p>
          {paymentUrl && (
            <a
              href={paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-leaf text-white font-bold text-sm shadow-cta transition-colors"
            >
              <span>Lanjutkan Pembayaran via Midtrans</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}

      {/* Notification note */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-xs">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">{isManual ? 'Verifikasi Transfer Manual' : 'Konfirmasi Otomatis Realtime'}</p>
          <p>
            {isManual
              ? 'Setelah Anda melakukan transfer, admin akan memverifikasi mutasi bank dan mengubah status pendaftaran Anda menjadi LUNAS.'
              : 'Setelah transfer berhasil, halaman ini akan otomatis terupdate menjadi LUNAS dalam beberapa detik (tanpa perlu kirim bukti transfer).'}
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
