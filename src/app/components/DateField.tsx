'use client'

// app/book/_components/DateField.tsx
//
// A lightweight custom calendar popover — no external date library.
// Styled after the calendar inspiration image (clean month grid, rounded
// selected-day badge) but WITHOUT per-day pricing, since Safeway doesn't
// have fixed pricing until a request is confirmed by phone.

import { useEffect, useRef, useState } from 'react'

interface DateFieldProps {
  label: string
  value: string // ISO date string 'YYYY-MM-DD', or ''
  onChange: (isoDate: string) => void
  minDate?: Date
  error?: string
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDisplay(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function DateField({ label, value, onChange, minDate, error }: DateFieldProps) {
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => {
    const base = value ? new Date(value) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const floor = minDate ?? new Date(new Date().toDateString())

  // Build the grid: leading blanks + days of the month
  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const leadingBlanks = (firstDay.getDay() + 6) % 7 // Monday-first grid

  const cells: (Date | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ]

  return (
    <div className="relative" ref={wrapRef}>
      <label className="font-[family-name:var(--font-body)] mb-1.5 block text-sm font-medium text-[#0D1424]">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`font-[family-name:var(--font-body)] flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-sm transition-colors ${
          error ? 'border-red-300' : 'border-[#0D1424]/12 hover:border-[#0D1424]/25'
        } ${open ? 'border-[#0D1424]/40' : ''}`}
      >
        <span className={value ? 'text-[#0D1424]' : 'text-[#8A94A3]'}>
          {value ? formatDisplay(value) : 'Select a date'}
        </span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#8A94A3]">
          <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 6.5H14" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      {error && (
        <p className="font-[family-name:var(--font-body)] mt-1.5 text-xs text-red-500">{error}</p>
      )}

      {open && (
        <div className="absolute z-20 mt-2 w-[300px] rounded-2xl border border-[#0D1424]/10 bg-white p-4 shadow-[0_20px_50px_-12px_rgba(13,20,36,0.25)]">
          {/* Month nav */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#4B5768] transition-colors hover:bg-[#EEF1F5]"
              aria-label="Previous month"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[#0D1424]">
              {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#4B5768] transition-colors hover:bg-[#EEF1F5]"
              aria-label="Next month"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Weekday labels */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map(d => (
              <div key={d} className="font-[family-name:var(--font-body)] text-center text-[11px] font-medium text-[#8A94A3]">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={i} />
              const iso = toISO(date)
              const isPast = date < floor
              const isSelected = iso === value
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isPast}
                  onClick={() => { onChange(iso); setOpen(false) }}
                  className={`font-[family-name:var(--font-body)] flex h-9 w-9 items-center justify-center rounded-lg text-[13px] transition-colors ${
                    isSelected
                      ? 'bg-[#0D1424] font-semibold text-white'
                      : isPast
                      ? 'cursor-not-allowed text-[#0D1424]/20'
                      : 'text-[#0D1424] hover:bg-[#EEF1F5]'
                  }`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
