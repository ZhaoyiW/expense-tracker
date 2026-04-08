'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { format, addMonths, subMonths, parseISO } from 'date-fns'

interface MonthSelectorProps {
  value: string           // 'yyyy-MM' or 'all'
  onChange: (month: string) => void
  allowAllTime?: boolean  // show "All Time" option in dropdown
}

const MONTHS      = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function currentYYYYMM() {
  return format(new Date(), 'yyyy-MM')
}

export function MonthSelector({ value, onChange, allowAllTime }: MonthSelectorProps) {
  const isAll = value === 'all'
  // When in "all" mode, use current month as the reference for the panel
  const effectiveValue = isAll ? currentYYYYMM() : value
  const date = parseISO(`${effectiveValue}-01`)

  const [open, setOpen]         = useState(false)
  const [panelYear, setPanelYear] = useState(() => parseInt(effectiveValue.slice(0, 4)))
  const ref = useRef<HTMLDivElement>(null)

  const currentMonth = parseInt(effectiveValue.slice(5, 7)) - 1
  const currentYear  = parseInt(effectiveValue.slice(0, 4))

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAll) return
    onChange(format(subMonths(date, 1), 'yyyy-MM'))
  }
  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAll) return
    onChange(format(addMonths(date, 1), 'yyyy-MM'))
  }

  const selectMonth = (monthIndex: number) => {
    const mm = String(monthIndex + 1).padStart(2, '0')
    onChange(`${panelYear}-${mm}`)
    setOpen(false)
  }

  // Sync panel year when value changes externally
  useEffect(() => {
    if (!isAll) setPanelYear(parseInt(value.slice(0, 4)))
  }, [value, isAll])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const triggerLabel = isAll ? 'All Time' : format(date, 'MMMM yyyy')

  return (
    <div ref={ref} className="relative">
      {/* Trigger bar */}
      <div className="flex items-center gap-1 bg-mo-card border border-mo-border rounded-2xl px-1 py-1 shadow-soft">
        <button
          onClick={prev}
          disabled={isAll}
          className="p-2 rounded-xl hover:bg-mo-accent-light text-mo-muted active:scale-95 disabled:opacity-30 disabled:cursor-default"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded-xl hover:bg-mo-accent-light text-mo-text active:scale-95 min-w-[130px] justify-center"
        >
          <span className="text-sm font-semibold">{triggerLabel}</span>
          <ChevronDown
            size={13}
            className={`text-mo-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        <button
          onClick={next}
          disabled={isAll}
          className="p-2 rounded-xl hover:bg-mo-accent-light text-mo-muted active:scale-95 disabled:opacity-30 disabled:cursor-default"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 w-64 bg-mo-card border border-mo-border rounded-2xl shadow-fab p-3"
          style={{ animation: 'dropdownIn 150ms cubic-bezier(0.4,0,0.2,1)' }}
        >
          {/* All Time option */}
          {allowAllTime && (
            <button
              onClick={() => { onChange('all'); setOpen(false) }}
              className={`w-full mb-2 py-2 rounded-xl text-xs font-semibold transition-colors active:scale-95 ${
                isAll ? 'bg-brand text-white shadow-soft' : 'text-mo-muted hover:bg-mo-accent-light'
              }`}
            >
              All Time
            </button>
          )}

          {/* Year navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              onClick={() => setPanelYear(y => y - 1)}
              className="p-1.5 rounded-xl hover:bg-mo-accent-light text-mo-muted active:scale-95"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-mo-text">{panelYear}</span>
            <button
              onClick={() => setPanelYear(y => y + 1)}
              className="p-1.5 rounded-xl hover:bg-mo-accent-light text-mo-muted active:scale-95"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m, i) => {
              const isSelected = !isAll && i === currentMonth && panelYear === currentYear
              return (
                <button
                  key={m}
                  onClick={() => selectMonth(i)}
                  className={`py-2 rounded-xl text-xs font-medium transition-colors active:scale-95 ${
                    isSelected
                      ? 'bg-brand text-white shadow-soft'
                      : 'text-mo-text hover:bg-mo-accent-light'
                  }`}
                  title={MONTHS_FULL[i]}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
