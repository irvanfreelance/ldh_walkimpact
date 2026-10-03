'use client'

import React from 'react'
import Image from 'next/image'
import { Check, ShieldCheck } from 'lucide-react'
import { PaymentMethod } from '@/lib/db/queries/payments'

interface PaymentSelectorProps {
  paymentMethods: PaymentMethod[]
  selectedMethodId: number | null
  onSelectMethod: (method: PaymentMethod) => void
}

export function PaymentSelector({
  paymentMethods,
  selectedMethodId,
  onSelectMethod,
}: PaymentSelectorProps) {
  // Group methods by type
  const vaMethods = paymentMethods.filter(
    (m) => m.type === 'va' || m.type === 'bank_transfer'
  )
  const qrMethods = paymentMethods.filter((m) => m.type === 'qr_code')
  const ewalletMethods = paymentMethods.filter(
    (m) => m.type === 'E-Wallet' || m.type === 'e_wallet'
  )
  const otherMethods = paymentMethods.filter(
    (m) =>
      !['va', 'bank_transfer', 'qr_code', 'E-Wallet', 'e_wallet'].includes(m.type)
  )

  const renderMethodCard = (method: PaymentMethod) => {
    const isSelected =
      selectedMethodId !== null &&
      selectedMethodId !== undefined &&
      Number(selectedMethodId) === Number(method.id)

    return (
      <button
        key={method.id}
        type="button"
        onClick={() => onSelectMethod(method)}
        className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
          isSelected
            ? 'border-[#6DC230] bg-[#F0F9EB] shadow-xs ring-2 ring-[#6DC230]/20'
            : 'border-[#E2E8DF] bg-white hover:border-[#6DC230]/50 hover:bg-[#FAFCF8]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-9 rounded-lg bg-white border border-[#E8EDE3] p-1 flex items-center justify-center shrink-0">
            {method.logo_url ? (
              <img
                src={method.logo_url}
                alt={method.name}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            ) : (
              <span className="text-[10px] font-bold text-gray-400">
                {method.code.slice(0, 4)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs sm:text-sm text-[#1A2714] block truncate">
              {method.name}
            </span>
            <span className="text-[11px] text-gray-500 block">
              {method.provider}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isSelected ? (
            <div className="w-5 h-5 rounded-full bg-[#6DC230] text-white flex items-center justify-center shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-gray-300" />
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-green">
          Pilih Metode Pembayaran
        </h3>
        <p className="text-xs text-brand-text-muted mt-0.5">
          Pilih salah satu metode pembayaran yang Anda inginkan
        </p>
      </div>

      {/* QRIS / E-Wallet Section */}
      {(qrMethods.length > 0 || ewalletMethods.length > 0) && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-gray-700 block">
            QRIS & E-Wallet
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[...qrMethods, ...ewalletMethods].map(renderMethodCard)}
          </div>
        </div>
      )}

      {/* Virtual Account Section */}
      {vaMethods.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-gray-700 block">
            Virtual Account (VA Bank)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {vaMethods.map(renderMethodCard)}
          </div>
        </div>
      )}

      {/* Other Methods Section */}
      {otherMethods.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-gray-700 block">
            Metode Lainnya
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {otherMethods.map(renderMethodCard)}
          </div>
        </div>
      )}

      {/* Fallback if list is empty */}
      {paymentMethods.length === 0 && (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 text-center">
          Metode pembayaran otomatis akan dibuka saat checkout via Midtrans.
        </div>
      )}
    </div>
  )
}
