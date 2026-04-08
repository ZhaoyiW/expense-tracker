'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { YtdCharts } from '@/components/ytd/YtdCharts'
import { YtdData } from '@/types'

export default function YtdPage() {
  const currentYear = format(new Date(), 'yyyy')
  const [year, setYear] = useState(currentYear)
  const [data, setData] = useState<YtdData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ytd?year=${year}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const result: YtdData = await res.json()
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const prevYear = () => setYear(String(parseInt(year) - 1))
  const nextYear = () => setYear(String(parseInt(year) + 1))

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
          <button
            onClick={prevYear}
            className="p-1.5 rounded-xl hover:bg-mo-bg text-mo-muted transition-colors"
          >
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
