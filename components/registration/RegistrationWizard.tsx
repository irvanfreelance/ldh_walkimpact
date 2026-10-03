'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { StepDataPeserta, StepDataPesertaFormData } from './StepDataPeserta'
import { StepRingkasan } from './StepRingkasan'
import { OrderSidebar } from './OrderSidebar'
import { ParticipantCategory, ShirtSize, TicketTier } from '@/lib/db/queries/events'
import { PaymentMethod } from '@/lib/db/queries/payments'

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: unknown) => void
          onPending?: (result: unknown) => void
          onError?: (result: unknown) => void
          onClose?: () => void
        }
      ) => void
    }
  }
}

interface RegistrationWizardProps {
  categories: ParticipantCategory[]
  shirtSizes: ShirtSize[]
  ticketTier: TicketTier | null
  paymentMethods?: PaymentMethod[]
  quota?: {
    maxQuota: number
    paidCount: number
    remaining: number
    percentage: number
  }
}

const DRAFT_STORAGE_KEY = 'walkimpact_registration_draft_v1'

export function RegistrationWizard({
  categories,
  shirtSizes,
  ticketTier,
  paymentMethods = [],
  quota,
}: RegistrationWizardProps) {
  const router = useRouter()
  const defaultMethod = paymentMethods[0] || null

  const [step, setStep] = useState<1 | 2>(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const [formData, setFormData] = useState<StepDataPesertaFormData>({
    contactName: '',
    contactWhatsapp: '',
    categoryId: categories[0]?.id ? Number(categories[0].id) : null,
    ticketQty: 1,
    shirtSizeIds: [Number(shirtSizes[1]?.id || shirtSizes[0]?.id || 1)],
    communityName: '',
    paymentMethodId: defaultMethod?.id ? Number(defaultMethod.id) : null,
    paymentMethodCode: defaultMethod?.code || null,
  })

  // Restore draft from localStorage on initial mount BEFORE saving
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          setFormData((prev) => ({
            contactName: typeof parsed.contactName === 'string' ? parsed.contactName : prev.contactName,
            contactWhatsapp: typeof parsed.contactWhatsapp === 'string' ? parsed.contactWhatsapp : prev.contactWhatsapp,
            categoryId: parsed.categoryId ? Number(parsed.categoryId) : prev.categoryId,
            ticketQty: parsed.ticketQty ? Number(parsed.ticketQty) : prev.ticketQty,
            shirtSizeIds: Array.isArray(parsed.shirtSizeIds) && parsed.shirtSizeIds.length > 0 ? parsed.shirtSizeIds : prev.shirtSizeIds,
            communityName: typeof parsed.communityName === 'string' ? parsed.communityName : prev.communityName,
            paymentMethodId: parsed.paymentMethodId ? Number(parsed.paymentMethodId) : prev.paymentMethodId,
            paymentMethodCode: parsed.paymentMethodCode || prev.paymentMethodCode,
          }))
        }
      }
    } catch (e) {
      console.warn('Could not restore draft from localStorage:', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Auto-save form data to localStorage ONLY after initial load completes
  React.useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData))
    } catch (e) {
      console.warn('Could not save draft to localStorage:', e)
    }
  }, [formData, isLoaded])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethodId: Number(method.id),
      paymentMethodCode: method.code,
    }))
  }

  const handleUpdateForm = (updated: Partial<StepDataPesertaFormData>) => {
    setFormData((prev) => ({ ...prev, ...updated }))
    setError(null)
  }

  const validateStep1 = (): boolean => {
    // 1. Regex Nama Lengkap: Letters, spaces, apostrophes, and dots only. Min 3, max 100
    const name = formData.contactName.trim()
    const nameRegex = /^[a-zA-Z\s'.]{3,100}$/
    if (!name || !nameRegex.test(name)) {
      setError('Nama lengkap hanya boleh berisi huruf, spasi, titik, atau petik (3 - 100 karakter)')
      return false
    }

    // 2. Regex WhatsApp: Format Indonesia (08xxx / 628xxx / +628xxx), 10 - 15 digit total
    const wa = formData.contactWhatsapp.trim()
    const waRegex = /^(?:08|\+628|628)[1-9][0-9]{7,12}$/
    if (!wa || !waRegex.test(wa)) {
      setError('Nomor WhatsApp tidak valid. Gunakan format 08xx / 628xx aktif (10-15 digit)')
      return false
    }

    // 3. Kategori Peserta
    if (!formData.categoryId) {
      setError('Silakan pilih kategori peserta')
      return false
    }

    // 4. Ukuran Kaos
    if (formData.shirtSizeIds.length !== formData.ticketQty) {
      setError('Pilihan ukuran kaos harus lengkap untuk setiap tiket')
      return false
    }

    // 5. Regex Nama Komunitas jika diisi (opsional)
    if (formData.communityName && formData.communityName.trim().length > 0) {
      const comm = formData.communityName.trim()
      const commRegex = /^[a-zA-Z0-9\s.,&()\-]{2,100}$/
      if (!commRegex.test(comm)) {
        setError('Format nama komunitas/instansi tidak valid (gunakan huruf, angka, tanda baca standar)')
        return false
      }
    }

    return true
  }

  const handleProceedToSummary = () => {
    if (validateStep1()) {
      setError(null)
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToStep1 = () => {
    setError(null)
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePayment = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal memproses pendaftaran. Silakan periksa kembali data Anda.')
        setIsSubmitting(false)
        return
      }

      const {
        registrationNumber,
        isSnapModal,
        snapToken,
        redirectUrl,
      } = data

      // Clear draft on successful order creation
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      } catch (e) {
        // ignore
      }

      // If Midtrans returned a Snap modal token and fallback was activated
      if (
        isSnapModal &&
        snapToken &&
        typeof window !== 'undefined' &&
        window.snap &&
        !snapToken.startsWith('demo_')
      ) {
        window.snap.pay(snapToken, {
          onSuccess: () => {
            router.push(`/konfirmasi?order_id=${registrationNumber}`)
          },
          onPending: () => {
            // User generated a VA or pending code in Snap
            router.push(`/konfirmasi?order_id=${registrationNumber}`)
          },
          onError: () => {
            setError('Pembayaran gagal atau ditolak oleh bank. Silakan coba metode pembayaran lain.')
            setIsSubmitting(false)
          },
          onClose: () => {
            // User closed the popup without completing
            setIsSubmitting(false)
            setError(
              `Anda menutup jendela pembayaran. Ingin melanjutkan pembayaran atau melihat instruksi nomor VA/QRIS? Klik tombol di bawah atau selesaikan di halaman status: /konfirmasi?order_id=${registrationNumber}`
            )
          },
        })
      } else {
        // Core API direct charge succeeded (VA / QRIS generated) or fallback redirect
        router.push(`/konfirmasi?order_id=${registrationNumber}`)
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError('Terjadi kendala jaringan saat memproses pesanan. Silakan coba lagi.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Title & Subtitle */}
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-text-dark font-heading leading-tight">
          Satu Langkah Lagi <br className="hidden sm:inline" />
          untuk <span className="text-brand-green">Membuat Dampak.</span>
        </h1>
        <p className="text-sm sm:text-base text-brand-text-muted">
          Bersama Walk Impact 2026, setiap langkah kita menjadi lebih berarti untuk masyarakat yang membutuhkan.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-10">
        <StepIndicator currentStep={step} />
      </div>

      {/* Main Grid: Form on Left, Sticky Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-9 shadow-card border border-brand-light-gray">
          {step === 1 ? (
            <StepDataPeserta
              formData={formData}
              categories={categories}
              shirtSizes={shirtSizes}
              onChange={handleUpdateForm}
              onNext={handleProceedToSummary}
              error={error}
            />
          ) : (
            <StepRingkasan
              formData={formData}
              categories={categories}
              shirtSizes={shirtSizes}
              ticketTier={ticketTier}
              paymentMethods={paymentMethods}
              onBack={handleBackToStep1}
              onSelectPaymentMethod={handleSelectPaymentMethod}
              onSubmitPayment={handlePayment}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}
        </div>

        {/* Right Column: Sticky Sidebar */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <OrderSidebar quota={quota} />
        </div>
      </div>
    </div>
  )
}
