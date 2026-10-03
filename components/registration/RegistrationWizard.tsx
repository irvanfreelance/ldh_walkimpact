'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { StepDataPeserta, StepDataPesertaFormData } from './StepDataPeserta'
import { StepRingkasan } from './StepRingkasan'
import { OrderSidebar } from './OrderSidebar'
import { ParticipantCategory, ShirtSize, TicketTier } from '@/lib/db/queries/events'

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
  quota?: {
    maxQuota: number
    paidCount: number
    remaining: number
    percentage: number
  }
}

export function RegistrationWizard({
  categories,
  shirtSizes,
  ticketTier,
  quota,
}: RegistrationWizardProps) {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2>(1)
  const [formData, setFormData] = useState<StepDataPesertaFormData>({
    contactName: '',
    contactWhatsapp: '',
    categoryId: categories[0]?.id || null,
    ticketQty: 1,
    shirtSizeIds: [shirtSizes[1]?.id || shirtSizes[0]?.id || 1],
    communityName: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdateForm = (updated: Partial<StepDataPesertaFormData>) => {
    setFormData((prev) => ({ ...prev, ...updated }))
    setError(null)
  }

  const validateStep1 = (): boolean => {
    if (!formData.contactName.trim() || formData.contactName.trim().length < 3) {
      setError('Nama lengkap minimal 3 karakter')
      return false
    }

    const wa = formData.contactWhatsapp.trim()
    const waRegex = /^(08|628|\+628)\d{8,13}$/
    if (!waRegex.test(wa)) {
      setError('Format nomor WhatsApp tidak valid (contoh: 08123456789)')
      return false
    }

    if (!formData.categoryId) {
      setError('Silakan pilih kategori peserta')
      return false
    }

    if (formData.shirtSizeIds.length !== formData.ticketQty) {
      setError('Pilihan ukuran kaos harus lengkap untuk setiap tiket')
      return false
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

      const { registrationNumber, snapToken, redirectUrl } = data

      // If window.snap is available from Midtrans
      if (typeof window !== 'undefined' && window.snap && snapToken && !snapToken.startsWith('demo_')) {
        window.snap.pay(snapToken, {
          onSuccess: () => {
            router.push(`/konfirmasi?order_id=${registrationNumber}`)
          },
          onPending: () => {
            router.push(`/konfirmasi?order_id=${registrationNumber}`)
          },
          onError: () => {
            setError('Pembayaran gagal atau dibatalkan. Silakan coba kembali.')
            setIsSubmitting(false)
          },
          onClose: () => {
            // User closed the popup, redirect to confirmation or keep on summary
            router.push(`/konfirmasi?order_id=${registrationNumber}`)
          },
        })
      } else {
        // In demo or fallback mode, direct to confirmation page
        router.push(redirectUrl || `/konfirmasi?order_id=${registrationNumber}`)
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
              onBack={handleBackToStep1}
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
