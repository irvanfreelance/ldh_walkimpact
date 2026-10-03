'use client'

import React, { useEffect, useState } from 'react'

export interface CountdownTimerProps {
  targetDate?: string | Date | number
  className?: string
}

export function CountdownTimer({
  targetDate = '2026-11-07T06:00:00+07:00',
  className = '',
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const parseTargetTimestamp = (): number => {
      if (typeof targetDate === 'number') return targetDate
      if (targetDate instanceof Date) return targetDate.getTime()
      if (typeof targetDate === 'string') {
        const parsed = new Date(targetDate).getTime()
        if (!isNaN(parsed)) return parsed
      }
      return new Date('2026-11-07T06:00:00+07:00').getTime()
    }

    const targetTime = parseTargetTimestamp()

    const calculateTimeLeft = () => {
      const difference = targetTime - Date.now()
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div
      className={`bg-[#0F281E]/85 backdrop-blur-md border border-white/20 rounded-xl p-4 sm:p-5 text-white max-w-sm shadow-xl ${className}`}
    >
      <div className="text-xs uppercase tracking-wider text-white/80 font-semibold text-center mb-3">
        Menuju Hari Event
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-black/25 rounded-lg py-2 px-1">
          <div
            suppressHydrationWarning
            className="text-xl sm:text-2xl font-black font-heading tracking-tight"
          >
            {String(timeLeft.days).padStart(2, '0')}
          </div>
          <div className="text-[11px] text-white/70 font-medium">Hari</div>
        </div>
        <div className="bg-black/25 rounded-lg py-2 px-1">
          <div
            suppressHydrationWarning
            className="text-xl sm:text-2xl font-black font-heading tracking-tight"
          >
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className="text-[11px] text-white/70 font-medium">Jam</div>
        </div>
        <div className="bg-black/25 rounded-lg py-2 px-1">
          <div
            suppressHydrationWarning
            className="text-xl sm:text-2xl font-black font-heading tracking-tight"
          >
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className="text-[11px] text-white/70 font-medium">Menit</div>
        </div>
        <div className="bg-black/25 rounded-lg py-2 px-1">
          <div
            suppressHydrationWarning
            className="text-xl sm:text-2xl font-black font-heading tracking-tight text-brand-green-leaf"
          >
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-[11px] text-white/70 font-medium">Detik</div>
        </div>
      </div>
    </div>
  )
}
