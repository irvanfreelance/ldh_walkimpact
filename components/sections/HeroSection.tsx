import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { ActiveEvent } from '@/lib/db/queries/events'
import { formatEventDate } from '@/lib/utils/format'

interface HeroSectionProps {
  event: ActiveEvent
}

export function HeroSection({ event }: HeroSectionProps) {
  // Safely compute ISO target date for CountdownTimer
  let targetDateIso = '2026-11-07T06:00:00+07:00'
  if (event.event_date) {
    try {
      const d = typeof event.event_date === 'string' ? new Date(event.event_date) : event.event_date
      if (!isNaN(d.getTime())) {
        const datePart = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
        const timePart = (event.start_time || '06:00:00').slice(0, 8)
        targetDateIso = `${datePart}T${timePart}+07:00`
      }
    } catch {
      targetDateIso = '2026-11-07T06:00:00+07:00'
    }
  }

  return (
    <section className="relative overflow-hidden bg-[#0A1F16] text-white pt-8 pb-16 lg:py-20 min-h-[580px] flex items-center">
      {/* Background Graphic Image from Asset */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/background-registration-success.png"
          alt="Walk Impact 2026 Atmosphere"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          quality={95}
        />
        {/* Rich emerald gradient overlay for brand aesthetic & high contrast text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F281E]/95 via-[#0F281E]/80 to-[#1B4D3E]/65" />
        {/* Subtle dot overlay */}
        <div className="absolute inset-0 bg-dot-white opacity-10 pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider text-white">
              7KM Charity Walk · Bandung
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-[1.08]">
              WALK<br />
              TOGETHER.<br />
              CREATE IMPACT.
            </h1>

            <p className="text-lg sm:text-xl font-medium text-white/90">
              7 kilometer. {event.max_quota} peserta. 1.000 paket sembako.
            </p>

            {/* Event Info Bar */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Image
                    src="/images/icon-calendar.png"
                    alt="Tanggal"
                    width={22}
                    height={22}
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <div>
                  <div className="text-sm font-bold">{formatEventDate(event.event_date)}</div>
                  <div className="text-xs text-white/80">06.00 – 12.00 WIB</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Image
                    src="/images/icon-location.png"
                    alt="Lokasi"
                    width={22}
                    height={22}
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <div>
                  <div className="text-sm font-bold">{event.venue_name}</div>
                  <div className="text-xs text-white/80">{event.venue_city}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/daftar"
                className="bg-white text-brand-green-dark hover:bg-brand-off-white font-extrabold text-base px-8 py-3.5 rounded-full text-center shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                Daftar Sekarang →
              </Link>
            </div>

            {/* Countdown Timer */}
            <div className="pt-3">
              <CountdownTimer targetDate={targetDateIso} />
            </div>
          </div>

          {/* Right Column: Hero Illustration */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 bg-brand-green-dark/40">
                <Image
                  src="/images/hero-community-walk.png"
                  alt="Komunitas Berjalan Bersama Walk Impact 2026"
                  width={600}
                  height={600}
                  priority
                  className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Floating Impact Badge */}
              <div className="absolute -bottom-4 -left-3 sm:-left-6 bg-white text-brand-text-dark px-4 py-2.5 rounded-xl shadow-xl border border-brand-light-gray flex items-center gap-3 animate-fade-up">
                <div className="w-10 h-10 rounded-lg bg-brand-green/20 flex items-center justify-center">
                  <Image
                    src="/images/icon-donation-package.png"
                    alt="Paket Sembako"
                    width={26}
                    height={26}
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-brand-green">1 Tiket Pendaftaran</div>
                  <div className="text-xs font-extrabold text-brand-text-dark">= 1 Paket Sembako</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
