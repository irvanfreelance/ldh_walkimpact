import React from 'react'
import { Check } from 'lucide-react'

export interface StepIndicatorProps {
  steps?: string[]
  currentStep: number // 1, 2, 3
  className?: string
}

export function StepIndicator({
  steps = ['Data Peserta', 'Ringkasan', 'Konfirmasi'],
  currentStep,
  className = '',
}: StepIndicatorProps) {
  return (
    <div className={`flex items-center justify-between max-w-md w-full mx-auto ${className}`}>
      {steps.map((label, index) => {
        const stepNum = index + 1
        const isCompleted = currentStep > stepNum
        const isCurrent = currentStep === stepNum

        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-brand-green text-white shadow-sm'
                    : isCurrent
                    ? 'bg-brand-green text-white ring-4 ring-brand-green/20 shadow-md scale-105'
                    : 'bg-brand-light-gray text-brand-text-muted border border-brand-light-gray'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : stepNum}
              </div>
              <span
                className={`text-xs font-semibold text-center ${
                  isCurrent
                    ? 'text-brand-green font-bold'
                    : isCompleted
                    ? 'text-brand-text-dark font-medium'
                    : 'text-brand-text-muted'
                }`}
              >
                {label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mb-5 transition-colors duration-300 ${
                  currentStep > stepNum ? 'bg-brand-green' : 'bg-brand-light-gray'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
