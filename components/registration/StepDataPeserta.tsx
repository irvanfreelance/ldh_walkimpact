import React from 'react'
import Image from 'next/image'
import { User, MessageSquare, Users, Ticket, Building, Minus, Plus } from 'lucide-react'
import { ParticipantCategory, ShirtSize } from '@/lib/db/queries/events'
import { ShirtSizePicker } from './ShirtSizePicker'

export interface StepDataPesertaFormData {
  contactName: string
  contactWhatsapp: string
  contactEmail?: string
  categoryId: number | null
  ticketQty: number
  shirtSizeIds: number[]
  communityName: string
  paymentMethodId?: number | null
  paymentMethodCode?: string | null
}

interface StepDataPesertaProps {
  formData: StepDataPesertaFormData
  categories: ParticipantCategory[]
  shirtSizes: ShirtSize[]
  onChange: (updated: Partial<StepDataPesertaFormData>) => void
  onNext: () => void
  error: string | null
}

export function StepDataPeserta({
  formData,
  categories,
  shirtSizes,
  onChange,
  onNext,
  error,
}: StepDataPesertaProps) {
  const handleQtyChange = (newQty: number) => {
    if (newQty < 1 || newQty > 5) return

    // Adjust shirtSizeIds array to match new quantity
    const newSizes = [...formData.shirtSizeIds]
    const defaultSizeId = shirtSizes[1]?.id || shirtSizes[0]?.id || 1

    if (newQty > newSizes.length) {
      while (newSizes.length < newQty) {
        newSizes.push(defaultSizeId)
      }
    } else if (newQty < newSizes.length) {
      newSizes.splice(newQty)
    }

    onChange({ ticketQty: newQty, shirtSizeIds: newSizes })
  }

  const handleSizeChange = (slotIndex: number, sizeId: number) => {
    const updated = [...formData.shirtSizeIds]
    updated[slotIndex] = sizeId
    onChange({ shirtSizeIds: updated })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-brand-text-dark font-heading">
          Data Peserta
        </h2>
        <p className="text-xs sm:text-sm text-brand-text-muted mt-1">
          Lengkapi data untuk mendaftar Walk Impact 2026.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* 1. Nama Lengkap */}
      <div className="space-y-1.5">
        <label className="block text-xs sm:text-sm font-bold text-brand-text-dark">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-muted">
            <User className="w-5 h-5" />
          </div>
          <input
            type="text"
            required
            value={formData.contactName}
            onChange={(e) => {
              // Only allow letters, spaces, apostrophes, and dots
              const val = e.target.value.replace(/[^a-zA-Z\s'.]/g, '')
              onChange({ contactName: val })
            }}
            placeholder="Contoh: Ahmad Fauzan"
            maxLength={100}
            className="w-full pl-11 pr-4 py-3 bg-white border border-brand-light-gray rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all"
          />
        </div>
        <p className="text-[11px] text-brand-text-muted">
          Hanya huruf, spasi, titik, dan petik (min 3 karakter).
        </p>
      </div>

      {/* 2. Nomor WhatsApp */}
      <div className="space-y-1.5">
        <label className="block text-xs sm:text-sm font-bold text-brand-text-dark">
          Nomor WhatsApp <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Image
              src="/images/icon-whatsapp.png"
              alt="WA"
              width={20}
              height={20}
              className="w-5 h-5 object-contain"
            />
          </div>
          <input
            type="tel"
            required
            value={formData.contactWhatsapp}
            onChange={(e) => {
              // Only allow digits and leading plus
              const val = e.target.value.replace(/[^\d+]/g, '')
              onChange({ contactWhatsapp: val })
            }}
            placeholder="Contoh: 081234567890"
            maxLength={16}
            className="w-full pl-11 pr-4 py-3 bg-white border border-brand-light-gray rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all font-mono"
          />
        </div>
        <p className="text-[11px] text-brand-text-muted">
          Format: 08xxx / 628xxx (10-15 digit angka). Nomor aktif untuk notifikasi tiket.
        </p>
      </div>

      {/* 3. Kategori Peserta */}
      <div className="space-y-1.5">
        <label className="block text-xs sm:text-sm font-bold text-brand-text-dark">
          Kategori Peserta <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-muted">
            <Users className="w-5 h-5" />
          </div>
          <select
            required
            value={formData.categoryId || ''}
            onChange={(e) => onChange({ categoryId: Number(e.target.value) || null })}
            className="w-full pl-11 pr-8 py-3 bg-white border border-brand-light-gray rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all appearance-none cursor-pointer"
          >
            <option value="" disabled>
              Pilih kategori peserta
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-text-muted text-xs">
            ▼
          </div>
        </div>
      </div>

      {/* 4. Jumlah Tiket */}
      <div className="space-y-1.5">
        <label className="block text-xs sm:text-sm font-bold text-brand-text-dark">
          Jumlah Tiket <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div className="flex items-center border border-brand-light-gray rounded-xl overflow-hidden bg-white shadow-sm">
            <button
              type="button"
              onClick={() => handleQtyChange(formData.ticketQty - 1)}
              disabled={formData.ticketQty <= 1}
              className="px-4 py-2.5 text-brand-text-dark hover:bg-brand-off-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-bold text-sm text-brand-text-dark">
              {formData.ticketQty}
            </span>
            <button
              type="button"
              onClick={() => handleQtyChange(formData.ticketQty + 1)}
              disabled={formData.ticketQty >= 5}
              className="px-4 py-2.5 text-brand-text-dark hover:bg-brand-off-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-brand-text-muted">Maksimal 5 tiket per pesanan</span>
        </div>
      </div>

      {/* 5. Ukuran Kaos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs sm:text-sm font-bold text-brand-text-dark">
            Ukuran Kaos <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-brand-text-muted">Ukuran standar unisex</span>
        </div>

        <div className="space-y-3 p-4 bg-brand-off-white/80 rounded-2xl border border-brand-light-gray/60">
          {Array.from({ length: formData.ticketQty }).map((_, slotIdx) => (
            <ShirtSizePicker
              key={slotIdx}
              slotIndex={slotIdx}
              totalQty={formData.ticketQty}
              shirtSizes={shirtSizes}
              selectedSizeId={formData.shirtSizeIds[slotIdx] || null}
              onSelectSize={(sizeId) => handleSizeChange(slotIdx, sizeId)}
            />
          ))}
        </div>
      </div>

      {/* 6. Nama Komunitas / Instansi (Opsional) */}
      <div className="space-y-1.5">
        <label className="block text-xs sm:text-sm font-bold text-brand-text-dark">
          Nama Komunitas / Instansi <span className="text-xs text-brand-text-muted font-normal">(Opsional)</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-muted">
            <Building className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={formData.communityName}
            onChange={(e) => {
              // Strip harmful characters, allow alphanumerics, spaces, dots, dashes, parentheses
              const val = e.target.value.replace(/[^a-zA-Z0-9\s.,&()\-]/g, '')
              onChange({ communityName: val })
            }}
            placeholder="Contoh: Komunitas Sehat Bandung"
            maxLength={100}
            className="w-full pl-11 pr-4 py-3 bg-white border border-brand-light-gray rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          className="w-full bg-brand-green hover:bg-brand-green-leaf active:scale-[0.99] text-white font-extrabold text-base py-4 rounded-xl shadow-cta transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          Lanjut ke Ringkasan →
        </button>
      </div>
    </form>
  )
}
