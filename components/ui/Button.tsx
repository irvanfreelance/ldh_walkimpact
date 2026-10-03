import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'on-dark' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const sizes = {
    sm: 'text-xs px-3.5 py-2 rounded-sm gap-1.5',
    md: 'text-sm sm:text-base px-6 py-3 rounded-md gap-2',
    lg: 'text-base sm:text-lg px-8 py-3.5 rounded-md gap-2.5',
  }

  const variants = {
    primary:
      'bg-brand-green hover:bg-brand-green-leaf text-white shadow-cta active:scale-[0.98]',
    secondary:
      'bg-brand-off-white hover:bg-brand-light-gray text-brand-green-dark border border-brand-light-gray',
    ghost:
      'bg-transparent hover:bg-brand-green/10 text-brand-green',
    outline:
      'border-2 border-brand-green text-brand-green hover:bg-brand-green/10',
    'on-dark':
      'bg-white text-brand-green-dark hover:bg-brand-off-white shadow-md active:scale-[0.98]',
  }

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
