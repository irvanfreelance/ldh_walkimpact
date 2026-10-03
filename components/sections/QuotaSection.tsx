'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface QuotaData {
  maxQuota: number
  paidCount: number
  remaining: number
  percentage: number
}

interface QuotaSectionProps {
  initialData?: QuotaData
  eventId?: number
}

export function QuotaSection({
  initialData = {
    maxQuota: 750,
    paidCount: 630,
    remaining: 120,
    percentage: 84,
  },
}: QuotaSectionProps) {
  const [quota, setQuota] = useState<QuotaData>(initialData)
  const [loading, setLoading] = useState(false)

  // Poll quota every 60s
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/quota')
        if (res.ok) {
          const data = await res.json()
          if (data && typeof data.paidCount === 'number') {
            setQuota(data)
          }
        }
      } catch (err) {
        console.warn('Could not refresh quota:', err)
      } finally {
        setLoading(false)
      }
    }

    const interval = setInterval(fetchQuota, 60000)
    return () => clearInterval(interval)
  }, [])

  const isFull = quota.remaining <= 0

  return (
    <section className="py-12 sm:py-16 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#0F281E] text-white p-8 sm:p-12 shadow-2xl border border-white/10">
          {/* Dot overlay */}
          <div className="absolute inset-0 bg-dot-white opacity-20 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Quota counter & progress */}
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green-leaf">
                Kuota Peserta
              </span>

              <h2 className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight">
                <span className="text-brand-green-leaf">{quota.paidCount}</span> dari {quota.maxQuota} tempat terisi
              </h2>

              {/* Progress bar */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <ProgressBar
                      value={quota.percentage}
                      barClassName={isFull ? 'bg-red-500' : 'bg-brand-green'}
                    />
                  </div>
                  <span className="text-lg font-black font-heading text-brand-green-leaf shrink-0">
                    {quota.percentage}%
                  </span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-white/80 font-medium">
                {isFull
                  ? 'Pendaftaran telah penuh. Terima kasih atas partisipasi luar biasa masyarakat Bandung!'
                  : 'Jadilah bagian dari dampak nyata untuk Bandung! Kuota terbatas 750 peserta.'}
              </p>
            </div>

            {/* Right Column: CTA Button */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col justify-center items-start lg:items-end gap-3">
              {isFull ? (
                <button
                  disabled
                  className="w-full sm:w-auto bg-gray-500 text-white font-bold text-base px-8 py-3.5 rounded-full cursor-not-allowed opacity-75"
                >
                  Kuota Penuh
                </button>
              ) : (
                <Link
                  href="/daftar"
                  className="w-full sm:w-auto bg-white hover:bg-brand-off-white text-brand-green-dark font-extrabold text-base px-8 py-3.5 rounded-full text-center shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  Daftar Sekarang →
                </Link>
              )}
              <span className="text-xs text-white/60 text-center lg:text-right">
                Pendaftaran ditutup 23 Oktober 2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
