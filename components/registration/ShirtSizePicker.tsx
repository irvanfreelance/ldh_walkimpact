import React from 'react'
import { ShirtSize } from '@/lib/db/queries/events'

interface ShirtSizePickerProps {
  slotIndex: number
  totalQty: number
  shirtSizes: ShirtSize[]
  selectedSizeId: number | null
  onSelectSize: (sizeId: number) => void
}

export function ShirtSizePicker({
  slotIndex,
  totalQty,
  shirtSizes,
  selectedSizeId,
  onSelectSize,
}: ShirtSizePickerProps) {
  return (
    <div className="space-y-2">
      {totalQty > 1 && (
        <span className="text-xs font-semibold text-brand-text-muted">
          Peserta {slotIndex + 1}:
        </span>
      )}
      <div className="flex flex-wrap gap-2.5">
        {shirtSizes.map((size) => {
          const isSelected = selectedSizeId === size.id
          return (
            <button
              key={size.id}
              type="button"
              onClick={() => onSelectSize(size.id)}
              className={`w-12 h-10 sm:w-14 sm:h-11 rounded-xl text-sm font-bold transition-all flex items-center justify-center cursor-pointer ${
                isSelected
                  ? 'bg-brand-green text-white ring-2 ring-brand-green ring-offset-2 shadow-sm'
                  : 'bg-white text-brand-text-dark border border-brand-light-gray hover:border-brand-green/50 hover:bg-brand-off-white'
              }`}
            >
              {size.code}
            </button>
          )
        })}
      </div>
    </div>
  )
}
