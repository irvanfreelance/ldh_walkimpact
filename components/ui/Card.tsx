import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  className?: string
  children: React.ReactNode
}

export function Card({ hover = true, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg p-6 shadow-card border border-brand-light-gray ${
        hover ? 'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
