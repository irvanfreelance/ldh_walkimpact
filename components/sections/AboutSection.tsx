import React from 'react'
import Image from 'next/image'
import { ShieldCheck, HeartHandshake, Users } from 'lucide-react'

export function AboutSection() {
  return (
    <section className="py-16 sm:py-20 bg-brand-off-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-card border border-brand-light-gray flex flex-col lg:flex-row items-center gap-10">
          {/* Left: LAZ Logo & Description */}
          <div className="flex-1 space-y-4 text-center lg:text-left">
            <div className="inline-block mb-1">
              <Image
                src="/images/logo-laz-darul-hikam.png"
                alt="LAZ Darul Hikam"
                width={140}
                height={55}
                className="h-12 w-auto object-contain mx-auto lg:mx-0"
              />
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-brand-green">
              Bekerja Sama dengan
            </p>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-text-dark font-heading">
              LAZ Darul Hikam
            </h2>

            <p className="text-sm sm:text-base text-brand-text-muted leading-relaxed max-w-xl">
              Penyaluran 1.000 paket sembako dilakukan melalui LAZ Darul Hikam, lembaga amil zakat terpercaya yang berpengalaman dalam program sosial kemanusiaan dan pemberdayaan masyarakat pra-sejahtera di Bandung.
            </p>
          </div>

          {/* Right: 3 Trust Badges */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0">
            <div className="bg-brand-off-white p-5 rounded-2xl border border-brand-light-gray/80 text-center flex-1 lg:w-36 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-brand-green/15 text-brand-green-dark flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6 text-brand-green-dark" />
              </div>
              <h3 className="text-xs font-bold text-brand-text-dark">Amanah Terpercaya</h3>
            </div>

            <div className="bg-brand-off-white p-5 rounded-2xl border border-brand-light-gray/80 text-center flex-1 lg:w-36 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-brand-green/15 text-brand-green-dark flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-brand-green-dark" />
              </div>
              <h3 className="text-xs font-bold text-brand-text-dark">Berpengalaman Sosial</h3>
            </div>

            <div className="bg-brand-off-white p-5 rounded-2xl border border-brand-light-gray/80 text-center flex-1 lg:w-36 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-brand-green/15 text-brand-green-dark flex items-center justify-center mb-3">
                <HeartHandshake className="w-6 h-6 text-brand-green-dark" />
              </div>
              <h3 className="text-xs font-bold text-brand-text-dark">Memberdayakan</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
