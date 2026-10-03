import React from 'react'

export interface BadgeProps {
  variant?: 'default' | 'warning' | 'danger' | 'muted' | 'success'
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'default', className = '', children }: BadgeProps) {
  const variants = {
    default: 'bg-brand-green/15 text-brand-green-dark border-brand-green/30',
    warning: 'bg-brand-amber/15 text-[#9E6200] border-brand-amber/30',
    danger: 'bg-red-50 text-red-700 border-red-200',
    muted: 'bg-brand-light-gray text-brand-text-muted border-brand-light-gray',
    success: 'bg-[#2ECC71]/15 text-[#197A3E] border-[#2ECC71]/30',
  }

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
