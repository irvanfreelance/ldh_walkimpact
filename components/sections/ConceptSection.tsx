import React from 'react'
import Image from 'next/image'
import { EventConcept } from '@/lib/db/queries/events'

interface ConceptSectionProps {
  concepts: EventConcept[]
}

export function ConceptSection({ concepts }: ConceptSectionProps) {
  const getConceptIcon = (title: string) => {
    if (title.toLowerCase().includes('sehat')) return '/images/icon-walking-shoe.png'
    if (title.toLowerCase().includes('dampak')) return '/images/icon-donation-package.png'
    return '/images/icon-community.png'
  }

  return (
    <section id="tentang" className="py-16 sm:py-20 bg-brand-off-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 sm:mb-12">
          <p className="text-xs font-bold tracking-widest uppercase text-brand-green mb-2">
            TIGA KONSEP UTAMA
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-text-dark border-l-4 border-brand-green pl-3.5">
            Lebih dari Sekadar Jalan Sehat
          </h2>
        </div>

        {/* 3 Concept Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {concepts.map((concept) => (
            <div
              key={concept.id}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-card border border-brand-light-gray hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-5 p-3">
                <Image
                  src={getConceptIcon(concept.title)}
                  alt={concept.title}
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>

              <h3 className="text-xl font-bold text-brand-text-dark mb-2.5 font-heading">
                {concept.title}
              </h3>

              <div
                className="text-sm text-brand-text-muted leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: concept.body }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
