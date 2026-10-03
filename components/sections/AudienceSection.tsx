import React from 'react'
import Image from 'next/image'

const AUDIENCE_ITEMS = [
  {
    title: 'Keluarga',
    description: 'Jalan santai bersama orang terkasih dari berbagai generasi.',
  },
  {
    title: 'Komunitas',
    description: 'Ajang kumpul komunitas hobi, olahraga, dan sosial Bandung.',
  },
  {
    title: 'Pelajar & Mahasiswa',
    description: 'Aksi kepedulian sosial nyata untuk generasi muda berdaya.',
  },
  {
    title: 'Pekerja',
    description: 'Refresh akhir pekan yang sehat dan sarat makna sosial.',
  },
  {
    title: 'Masyarakat Umum',
    description: 'Terbuka untuk siapa saja yang ingin berbagi kebaikan.',
  },
]

export function AudienceSection() {
  return (
    <section className="py-16 sm:py-20 bg-brand-off-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <p className="text-xs font-bold tracking-widest uppercase text-brand-green mb-2">
            UNTUK SIAPA?
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-text-dark border-l-4 border-brand-green pl-3.5">
            Semua Bisa Ikut Berjalan
          </h2>
        </div>

        {/* 5 Audience Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {AUDIENCE_ITEMS.map((item, index) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl p-5 border border-brand-light-gray text-center flex flex-col items-center hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200"
            >
              <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center p-3 mb-3 text-brand-green-dark">
                <Image
                  src="/images/icon-community.png"
                  alt={item.title}
                  width={40}
                  height={40}
                  className="w-8 h-8 object-contain"
                />
              </div>

              <h3 className="text-base font-bold text-brand-text-dark mb-1 font-heading">
                {item.title}
              </h3>

              <p className="text-xs text-brand-text-muted leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
