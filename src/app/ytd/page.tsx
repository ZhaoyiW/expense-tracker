'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { YtdCharts } from '@/components/ytd/YtdCharts'
import { YtdData } from '@/types'
import { CATEGORY_OPTIONS } from '@/lib/constants'
import clsx from 'clsx'

function SelectField({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-2 rounded-2xl border border-mo-border bg-mo-card text-mo-text text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-mo-muted pointer-events-none" />
    </div>
  )
}

export default function YtdPage() {
  const currentYear = format(new Date(), 'yyyy')
  const [year, setYear] = useState(currentYear)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSubCategory, setFilterSubCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [data, setData] = useState<YtdData | null>(null)
  const [loading, setLoading] = useState(true)

  const allCategories = [...new Set(
    Object.values(CATEGORY_OPTIONS).flatMap((opts) => Object.keys(opts))
  )].sort()

  const allSubCategories = filterCategory
    ? [...new Set(Object.values(CATEGORY_OPTIONS).flatMap((opts) => opts[filterCategory] ?? []))]
    : [...new Set(Object.values(CATEGORY_OPTIONS).flatMap((opts) => Object.values(opts).flat()))].sort()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ year })
      if (filterCategory) params.set('category', filterCategory)
      if (filterSubCategory) params.set('sub_category', filterSubCategory)
      if (filterType) params.set('type', filterType)
      const res = await fetch(`/api/ytd?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const result: YtdData = await res.json()
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [year, filterCategory, filterSubCategory, filterType])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const prevYear = () => setYear(String(parseInt(year) - 1))
  const nextYear = () => setYear(String(parseInt(year) + 1))
  const hasFilters = filterCategory || filterSubCategory || filterType

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mo-text">Year-to-Date Review</h1>
          <p className="text-sm text-mo-muted mt-0.5">Annual financial summary and trends</p>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-1 bg-mo-card border border-mo-border rounded-2xl px-2 py-1">
          <button onClick={prevYear} className="p-1.5 rounded-xl hover:bg-mo-bg text-mo-muted transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-base font-semibold text-mo-text min-w-[60px] text-center">{year}</span>
          <button
            onClick={nextYear}
            disabled={year >= currentYear}
            className="p-1.5 rounded-xl hover:bg-mo-bg text-mo-muted transition-colors disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Income / Expense toggle */}
        <div className="flex rounded-2xl border border-mo-border overflow-hidden text-sm">
          {(['', 'Expense', 'Income'] as const).map((t) => (
            <button
              key={t || 'all'}
              onClick={() => setFilterType(t)}
              className={clsx(
                'px-3 py-2 font-medium transition-colors',
                filterType === t
                  ? 'bg-brand text-white'
                  : 'bg-mo-card text-mo-muted hover:text-mo-text hover:bg-mo-bg'
              )}
            >
              {t || 'All'}
            </button>
          ))}
        </div>

        <SelectField value={filterCategory} onChange={(v) => { setFilterCategory(v); setFilterSubCategory('') }}>
          <option value="">All categories</option>
          {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </SelectField>

        <SelectField value={filterSubCategory} onChange={setFilterSubCategory}>
          <option value="">All sub-categories</option>
          {allSubCategories.map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectField>

        {hasFilters && (
          <button
            onClick={() => { setFilterCategory(''); setFilterSubCategory(''); setFilterType('') }}
            className="text-xs text-mo-muted hover:text-mo-text"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-mo-muted text-sm animate-pulse">
          Loading...
        </div>
      ) : data ? (
        <YtdCharts data={data} year={year} />
      ) : (
        <div className="text-center text-mo-muted py-16">No data available for {year}</div>
      )}
    </div>
  )
}
