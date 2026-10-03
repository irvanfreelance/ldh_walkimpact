import React from 'react'
import Image from 'next/image'
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface OrderSidebarProps {
  quota?: {
    maxQuota: number
    paidCount: number
    remaining: number
    percentage: number
  }
}

export function OrderSidebar({
  quota = {
    maxQuota: 750,
    paidCount: 630,
    remaining: 120,
    percentage: 84,
  },
}: OrderSidebarProps) {
  return (
    <div className="bg-white rounded-3xl shadow-card border border-brand-light-gray overflow-hidden">
      {/* Top Banner with runner graphic */}
      <div className="relative bg-hero-gradient p-6 text-white overflow-hidden min-h-[160px] flex items-center justify-between">
        <div className="absolute inset-0 bg-dot-white opacity-20 pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="text-2xl font-black font-heading leading-tight tracking-tight">
            WALK<br />
            IMPACT<br />
            2026
          </div>
          <div className="text-[11px] font-bold tracking-wider text-white/90 uppercase">
            Walk Together and Create Impact
          </div>
        </div>

        {/* Runner illustration */}
        <div className="relative z-10 w-28 h-28 -mr-2">
          <Image
            src="/images/runner.png"
            alt="Runner"
            width={120}
            height={120}
            className="w-full h-full object-contain drop-shadow-md"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        <h3 className="font-extrabold text-base text-brand-text-dark font-heading">
          Ringkasan Pendaftaran
        </h3>

        {/* Date & Location */}
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center shrink-0 text-brand-green">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-brand-text-dark">Sabtu, 7 November 2026</div>
              <div className="text-brand-text-muted">06.00 WIB – Selesai</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center shrink-0 text-brand-green">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-brand-text-dark">Pasar Modern Batununggal Indah</div>
              <div className="text-brand-text-muted">Bandung</div>
            </div>
          </div>
        </div>

        {/* Impact Reminder Card */}
        <div className="bg-[#FFF9EE] border border-[#F5A623]/30 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F5A623]/20 flex items-center justify-center shrink-0 text-[#B87A00]">
            <Image
              src="/images/icon-donation-package.png"
              alt="Paket Sembako"
              width={24}
              height={24}
              className="w-5 h-5 object-contain"
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-[#8A5800]">
              1 tiket = 1 paket sembako
            </div>
            <p className="text-[11px] text-[#8A5800]/85 leading-relaxed">
              Setiap pendaftaran Anda akan disalurkan menjadi 1 paket sembako untuk masyarakat yang membutuhkan.
            </p>
          </div>
        </div>

        {/* Quota Progress */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-brand-text-dark font-bold">Kuota Peserta</span>
            <span className="text-brand-green font-bold">{quota.percentage}%</span>
          </div>

          <ProgressBar
            value={quota.percentage}
            barClassName="bg-brand-green"
          />

          <div className="text-[11px] text-brand-text-muted font-medium">
            {quota.paidCount} / {quota.maxQuota} tempat terisi
          </div>
        </div>

        {/* Deadline Warning Badge */}
        <div className="bg-red-50 border border-red-200 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-red-700 text-xs font-semibold">
          <Clock className="w-4 h-4 text-red-600" />
          <span>Pendaftaran ditutup 23 Oktober 2026</span>
        </div>

        {/* WhatsApp Help */}
        <a
          href="https://wa.me/6281572225545?text=Halo%20Admin%20Walk%20Impact,%20saya%20butuh%20bantuan%20seputar%20pendaftaran"
          target="_blank"
          rel="noreferrer"
          className="w-full bg-brand-off-white hover:bg-brand-light-gray/70 border border-brand-light-gray rounded-xl p-3 flex items-center justify-between text-brand-text-dark transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/icon-whatsapp.png"
              alt="WhatsApp"
              width={26}
              height={26}
              className="w-6 h-6 object-contain"
            />
            <div className="text-left">
              <div className="text-xs font-bold text-brand-text-dark">Butuh bantuan pendaftaran?</div>
              <div className="text-[11px] text-brand-text-muted">Hubungi kami melalui WhatsApp</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-brand-green group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  )
}
