import React from 'react'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { EventRundown } from '@/lib/db/queries/events'

interface RundownSectionProps {
  rundowns: EventRundown[]
}

export function RundownSection({ rundowns }: RundownSectionProps) {
  const getRundownIcon = (activity: string) => {
    const act = activity.toLowerCase()
    if (act.includes('registrasi')) return '/images/icon-calendar.png'
    if (act.includes('pemanasan')) return '/images/icon-community.png'
    if (act.includes('walk')) return '/images/icon-walking-shoe.png'
    if (act.includes('panggung') || act.includes('hiburan')) return '/images/icon-gift.png'
    if (act.includes('sembako') || act.includes('penyerahan')) return '/images/icon-donation-package.png'
    return '/images/icon-calendar.png'
  }

  return (
    <section id="rundown" className="py-16 sm:py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <p className="text-xs font-bold tracking-widest uppercase text-brand-green mb-2">
            RUNDOWN ACARA
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-text-dark border-l-4 border-brand-green pl-3.5">
            Rangkaian Kegiatan
          </h2>
        </div>

        {/* Rundown Steps (Horizontal on Desktop, Vertical on Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 sm:gap-4 relative items-start">
          {rundowns.map((item, idx) => {
            const timeLabel = `${item.start_time.slice(0, 5).replace(':', '.')} – ${item.end_time.slice(0, 5).replace(':', '.')}`
            const isLast = idx === rundowns.length - 1

            return (
              <div key={item.id} className="flex flex-col items-center text-center relative group">
                {/* Connecting arrow for desktop */}
                {!isLast && (
                  <div className="hidden md:block absolute top-7 -right-3 z-10 text-brand-green/50">
                    <ArrowRight className="w-5 h-5 stroke-[2]" />
                  </div>
                )}

                {/* Circle Icon */}
                <div className="w-16 h-16 rounded-full bg-brand-green text-white flex items-center justify-center p-3 shadow-md mb-4 group-hover:scale-110 group-hover:bg-brand-green-leaf transition-all duration-200">
                  <Image
                    src={getRundownIcon(item.activity)}
                    alt={item.activity}
                    width={32}
                    height={32}
                    className="w-7 h-7 object-contain brightness-0 invert"
                  />
                </div>

                {/* Time Badge */}
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-off-white text-brand-green-dark border border-brand-light-gray mb-2">
                  {timeLabel}
                </span>

                {/* Activity Name */}
                <h3 className="text-sm sm:text-base font-bold text-brand-text-dark leading-snug">
                  {item.activity}
                </h3>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
