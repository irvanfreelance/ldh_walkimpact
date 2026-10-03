import React from 'react'
import { Accordion } from '@/components/ui/Accordion'
import { EventFaq } from '@/lib/db/queries/events'

interface FAQSectionProps {
  faqs: EventFaq[]
}

export function FAQSection({ faqs }: FAQSectionProps) {
  // Split FAQs into two columns if there are 4+ items
  const mid = Math.ceil(faqs.length / 2)
  const leftFaqs = faqs.slice(0, mid)
  const rightFaqs = faqs.slice(mid)

  return (
    <section id="faq" className="py-16 sm:py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-12">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-brand-green mb-2">
              PERTANYAAN UMUM
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-text-dark border-l-4 border-brand-green pl-3.5">
              FAQ
            </h2>
          </div>
          <a
            href="https://wa.me/6281572225545?text=Halo%20panitia%20Walk%20Impact,%20saya%20punya%20pertanyaan%20lain"
            target="_blank"
            rel="noreferrer"
            className="mt-3 sm:mt-0 text-sm font-bold text-brand-green hover:text-brand-green-leaf transition-colors inline-flex items-center gap-1"
          >
            Tanya langsung ke panitia via WhatsApp →
          </a>
        </div>

        {/* 2-Column Accordion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
          <Accordion items={leftFaqs} defaultOpenIndex={0} />
          <Accordion items={rightFaqs} defaultOpenIndex={-1} />
        </div>
      </div>
    </section>
  )
}
