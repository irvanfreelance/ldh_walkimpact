import React from 'react'

export interface ProgressBarProps {
  value: number // 0 - 100
  label?: string
  className?: string
  barClassName?: string
}

export function ProgressBar({
  value,
  label,
  className = '',
  barClassName = 'bg-brand-green',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center text-xs font-semibold text-brand-text-muted mb-1.5">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barClassName}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
