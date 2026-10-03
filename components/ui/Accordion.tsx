'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface AccordionItem {
  id: number | string
  question: string
  answer: string
}

export interface AccordionProps {
  items: AccordionItem[]
  defaultOpenIndex?: number
  className?: string
}

export function Accordion({ items, defaultOpenIndex = 0, className = '' }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex)

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, idx) => {
        const isOpen = openIndex === idx
        return (
          <div
            key={item.id}
            className="border border-brand-light-gray rounded-md overflow-hidden bg-white shadow-sm transition-all"
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between p-4 text-left font-semibold text-brand-text-dark hover:bg-brand-off-white/60 transition-colors"
            >
              <span className="text-sm sm:text-base pr-4">{item.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-brand-green shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div
                className="px-4 pb-4 pt-1 text-sm text-brand-text-muted leading-relaxed border-t border-brand-light-gray/50 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: item.answer }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
