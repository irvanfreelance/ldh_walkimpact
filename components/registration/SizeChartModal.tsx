'use client'

import React, { useEffect, useState } from 'react'
import { Ruler, X } from 'lucide-react'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']

const ROWS: { label: string; values: number[] }[] = [
  { label: 'Lebar Dada', values: [48, 50, 52, 54, 57, 60, 63, 66, 69] },
  { label: 'Panjang Baju', values: [66, 68, 70, 72, 74, 76, 78, 80, 82] },
  { label: 'Panjang Lengan Pendek', values: [20, 21, 22, 23, 24, 25, 26, 27, 28] },
]

export function SizeChartButton() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:text-brand-green-dark underline underline-offset-2 cursor-pointer"
      >
        <Ruler className="w-3.5 h-3.5" />
        Lihat Size Chart
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Size Chart Ukuran Jersey"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold font-heading text-brand-text-dark">
                  Size Chart
                </h3>
                <p className="text-sm text-brand-text-muted">Ukuran Jersey Dewasa (Unisex), dalam cm</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="p-1.5 rounded-full hover:bg-brand-off-white text-brand-text-dark cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-brand-text-muted mb-4">
              Ukuran yang telah dipilih dan disubmit tidak dapat diubah dan ditukar pada saat Race Pack Collection.
            </p>

            <div className="overflow-x-auto rounded-xl border border-brand-light-gray">
              <table className="w-full text-sm text-center whitespace-nowrap">
                <thead>
                  <tr className="bg-brand-green text-white">
                    <th className="text-left font-bold px-3 py-2.5">Ukuran</th>
                    {SIZES.map((s) => (
                      <th key={s} className="font-bold px-3 py-2.5">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? 'bg-brand-off-white' : 'bg-white'}>
                      <th scope="row" className="text-left font-semibold text-brand-text-dark px-3 py-2.5">
                        {row.label}
                      </th>
                      {row.values.map((v, idx) => (
                        <td key={SIZES[idx]} className="px-3 py-2.5 text-brand-text-dark">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
