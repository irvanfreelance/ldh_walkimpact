import React from 'react'
import { ArrowLeft, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react'
import { StepDataPesertaFormData } from './StepDataPeserta'
import { ParticipantCategory, ShirtSize, TicketTier } from '@/lib/db/queries/events'
import { formatIDR } from '@/lib/utils/format'

interface StepRingkasanProps {
  formData: StepDataPesertaFormData
  categories: ParticipantCategory[]
  shirtSizes: ShirtSize[]
  ticketTier: TicketTier | null
  onBack: () => void
  onSubmitPayment: () => void
  isSubmitting: boolean
  error: string | null
}

export function StepRingkasan({
  formData,
  categories,
  shirtSizes,
  ticketTier,
  onBack,
  onSubmitPayment,
  isSubmitting,
  error,
}: StepRingkasanProps) {
  const categoryLabel =
    categories.find((c) => c.id === formData.categoryId)?.label || 'Peserta'
  const unitPrice = ticketTier?.price || 75000
  const totalPrice = unitPrice * formData.ticketQty

  const getSizeCode = (sizeId: number) => {
    return shirtSizes.find((s) => s.id === sizeId)?.code || 'M'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-brand-text-dark font-heading">
            Ringkasan Pesanan
          </h2>
          <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5">
            Periksa kembali detail pendaftaran sebelum melakukan pembayaran.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="text-xs sm:text-sm font-bold text-brand-green hover:text-brand-green-leaf flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Ubah Data
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Participant Details Box */}
      <div className="bg-brand-off-white rounded-2xl p-5 border border-brand-light-gray space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-green">
          Data Pemesan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-brand-text-muted block text-xs">Nama Lengkap</span>
            <span className="font-bold text-brand-text-dark">{formData.contactName}</span>
          </div>

          <div>
            <span className="text-brand-text-muted block text-xs">Nomor WhatsApp</span>
            <span className="font-bold text-brand-text-dark">{formData.contactWhatsapp}</span>
          </div>

          <div>
            <span className="text-brand-text-muted block text-xs">Kategori</span>
            <span className="font-bold text-brand-text-dark">{categoryLabel}</span>
          </div>

          <div>
            <span className="text-brand-text-muted block text-xs">Komunitas / Instansi</span>
            <span className="font-bold text-brand-text-dark">
              {formData.communityName || '-'}
            </span>
          </div>
        </div>

        {/* Selected Shirt Sizes */}
        <div className="pt-2 border-t border-brand-light-gray/60">
          <span className="text-brand-text-muted block text-xs mb-2">Ukuran Kaos Peserta:</span>
          <div className="flex flex-wrap gap-2">
            {formData.shirtSizeIds.map((sizeId, idx) => (
              <span
                key={idx}
                className="bg-white border border-brand-light-gray px-3 py-1.5 rounded-lg text-xs font-bold text-brand-text-dark shadow-xs"
              >
                Tiket {idx + 1}: <span className="text-brand-green">{getSizeCode(sizeId)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Breakdown Box */}
      <div className="bg-white rounded-2xl p-5 border border-brand-light-gray shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-green">
          Rincian Biaya
        </h3>

        <div className="flex justify-between items-center text-sm py-1">
          <span className="text-brand-text-dark font-medium">
            Tiket Walk Impact 2026 ({formData.ticketQty}x)
          </span>
          <span className="font-bold text-brand-text-dark">
            {formatIDR(unitPrice)} × {formData.ticketQty}
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-brand-text-muted pb-2 border-b border-brand-light-gray">
          <div className="flex items-center gap-1.5 text-[#3A7D0A]">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
            Termasuk {formData.ticketQty} Kaos Event Resmi Walk Impact 2026
          </div>
          <div className="flex items-center gap-1.5 text-[#3A7D0A]">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
            Termasuk {formData.ticketQty} Paket Sembako untuk Masyarakat Pra-sejahtera
          </div>
        </div>

        <div className="flex justify-between items-center pt-1">
          <span className="text-base font-extrabold text-brand-text-dark">
            Total Pembayaran
          </span>
          <span className="text-2xl font-black font-heading text-brand-green-dark">
            {formatIDR(totalPrice)}
          </span>
        </div>
      </div>

      {/* Midtrans Payment Notice */}
      <div className="bg-[#F8FAF6] border border-brand-light-gray rounded-2xl p-4 flex items-start gap-3">
        <CreditCard className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
        <div className="text-xs text-brand-text-muted space-y-1">
          <p className="font-bold text-brand-text-dark">Metode Pembayaran Resmi via Midtrans</p>
          <p>
            Mendukung Virtual Account (BCA, Mandiri, BNI, BRI), QRIS (GoPay, OVO, ShopeePay, DANA, LinkAja).
          </p>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-brand-text-muted">
        <ShieldCheck className="w-4 h-4 text-brand-green" />
        <span>Transaksi aman & terenkripsi otomatis</span>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="sm:w-1/3 bg-brand-off-white hover:bg-brand-light-gray text-brand-text-dark font-bold text-sm py-4 rounded-xl border border-brand-light-gray transition-colors cursor-pointer"
        >
          ← Kembali
        </button>

        <button
          type="button"
          onClick={onSubmitPayment}
          disabled={isSubmitting}
          className="sm:w-2/3 bg-brand-green hover:bg-brand-green-leaf active:scale-[0.99] text-white font-extrabold text-base py-4 rounded-xl shadow-cta transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Memproses Pembayaran...</span>
            </>
          ) : (
            <span>Bayar Sekarang ({formatIDR(totalPrice)}) →</span>
          )}
        </button>
      </div>
    </div>
  )
}
