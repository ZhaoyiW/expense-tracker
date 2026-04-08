'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import {
  format, parse, isValid, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, addDays, addMonths, subMonths,
  isSameMonth, isSameDay, isToday,
} from 'date-fns'

interface DatePickerInputProps {
  value: string            // 'yyyy-MM-dd'
  onChange: (v: string) => void
  className?: string
  required?: boolean
}

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function buildCalendarDays(viewDate: Date): Date[] {
  const start = startOfWeek(startOfMonth(viewDate))
  const end   = endOfWeek(endOfMonth(viewDate))
  const days: Date[] = []
  let cur = start
  while (cur <= end) {
    days.push(cur)
    cur = addDays(cur, 1)
  }
  return days
}

export function DatePickerInput({ value, onChange, className, required }: DatePickerInputProps) {
  const parsed  = value ? parse(value, 'yyyy-MM-dd', new Date()) : new Date()
  const selected = isValid(parsed) ? parsed : new Date()

  const [open, setOpen]           = useState(false)
  const [viewDate, setViewDate]   = useState(() => startOfMonth(selected))
  const ref = useRef<HTMLDivElement>(null)

  // Keep view in sync when value changes externally
  useEffect(() => {
    if (value) {
      const d = parse(value, 'yyyy-MM-dd', new Date())
      if (isValid(d)) setViewDate(startOfMonth(d))
    }
  }, [value])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selectDay = (d: Date) => {
    onChange(format(d, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const days = buildCalendarDays(viewDate)

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`${className ?? ''} flex items-center justify-between gap-2 text-left`}
      >
        <span className={value ? 'text-mo-text' : 'text-mo-muted'}>
          {value ? format(selected, 'MMM d, yyyy') : 'Pick a date'}
        </span>
        <CalendarDays size={15} className="text-mo-muted shrink-0" />
      </button>

      {/* Calendar popup */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 right-0 w-72 bg-mo-card border border-mo-border rounded-2xl shadow-fab p-3"
          style={{ animation: 'dropdownIn2 150ms cubic-bezier(0.4,0,0.2,1)' }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3 px-0.5">
            <button
              type="button"
              onClick={() => setViewDate(d => subMonths(d, 1))}
              className="p-1.5 rounded-xl hover:bg-mo-accent-light text-mo-muted active:scale-95"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-mo-text">
              {format(viewDate, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(d => addMonths(d, 1))}
              className="p-1.5 rounded-xl hover:bg-mo-accent-light text-mo-muted active:scale-95"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DOW.map(d => (
              <span key={d} className="text-center text-2xs font-semibold text-mo-muted py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map((d, i) => {
              const inMonth  = isSameMonth(d, viewDate)
              const isSel    = isSameDay(d, selected)
              const isToday_ = isToday(d)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(d)}
                  className={[
                    'mx-auto flex items-center justify-center w-8 h-8 rounded-xl text-xs font-medium transition-colors active:scale-95',
                    isSel
                      ? 'bg-brand text-white shadow-soft'
                      : isToday_ && inMonth
                        ? 'bg-brand-subtle text-brand-dark font-semibold'
                        : inMonth
                          ? 'text-mo-text hover:bg-mo-accent-light'
                          : 'text-mo-muted/40 hover:bg-mo-accent-light',
                  ].join(' ')}
                >
                  {format(d, 'd')}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
