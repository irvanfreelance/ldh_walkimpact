import React from 'react'
import Image from 'next/image'
import { EventStat } from '@/lib/db/queries/events'

interface ImpactSectionProps {
  stats: EventStat[]
}

export function ImpactSection({ stats }: ImpactSectionProps) {
  // Icon mapping
  const getIcon = (iconName: string) => {
    if (iconName === 'footprints') return '/images/icon-walking-shoe.png'
    if (iconName === 'box') return '/images/icon-donation-package.png'
    if (iconName === 'users') return '/images/icon-community.png'
    return '/images/icon-donation-package.png'
  }

  return (
    <section id="dampak" className="py-16 sm:py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 sm:mb-12">
          <p className="text-xs font-bold tracking-widest uppercase text-brand-green mb-2">
            DAMPAK NYATA UNTUK BANDUNG
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-text-dark border-l-4 border-brand-green pl-3.5">
            Langkah Kecil, Dampak Besar
          </h2>
        </div>

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="bg-brand-off-white rounded-2xl p-6 sm:p-7 border border-brand-light-gray flex items-center gap-5 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-brand-light-gray/60 p-3">
                <Image
                  src={getIcon(stat.icon_name)}
                  alt={stat.label}
                  width={44}
                  height={44}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-brand-text-dark font-heading">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-brand-green mt-0.5">
                  {stat.label}
                </div>
                {stat.description && (
                  <p className="text-xs text-brand-text-muted mt-1 leading-snug">
                    {stat.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
