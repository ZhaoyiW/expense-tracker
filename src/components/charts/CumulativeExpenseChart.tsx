'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { DailyData } from '@/types'

interface CumulativeExpenseChartProps {
  data: DailyData[]
  prevData?: { day: number; cumulative: number }[]
  daysInMonth?: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

function makeYAxisFormatter(maxValue: number) {
  if (maxValue >= 10000) return (v: number) => `${(v / 1000).toFixed(0)}k`
  if (maxValue >= 1000)  return (v: number) => `${(v / 1000).toFixed(1)}k`
  return (v: number) => `${v.toFixed(0)}`
}

export function CumulativeExpenseChart({ data, prevData, daysInMonth }: CumulativeExpenseChartProps) {
  const prevMap = new Map<number, number>((prevData ?? []).map((d) => [d.day, d.cumulative]))

  // x-axis spans whichever month has more days
  const currentDays = daysInMonth ?? data.length
  const prevDays = prevMap.size
  const maxDays = Math.max(currentDays, prevDays, 1)

  // Map day → current month entry (only days with actual data, up to today)
  const currentMap = new Map<number, DailyData>()
  for (const d of data) {
    const day = parseISO(d.date).getDate()  // local date — YYYY-MM-DD parses as local midnight
    currentMap.set(day, d)
  }

  // Build unified data array. Current month line uses null for days with no data
  // so the solid line stops at today. recharts skips null points but still renders
  // the non-null portion, so trailing nulls are safe.
  const formatted = Array.from({ length: maxDays }, (_, i) => {
    const day = i + 1
    const current = currentMap.get(day)
    const cumulative = current ? current.cumulative : null
    const prevCumulative = prevMap.has(day) ? prevMap.get(day)! : null
    const label = current ? format(parseISO(current.date), 'MMM d') : String(day)
    return { day, label, date: current?.date ?? '', cumulative, prevCumulative }
  })

  const tickInterval = Math.max(1, Math.floor(maxDays / 5))

  const maxCumulative = Math.max(
    ...formatted.map((d) => d.cumulative ?? 0),
    ...formatted.map((d) => d.prevCumulative ?? 0),
    1
  )
  const yAxisFormatter = makeYAxisFormatter(maxCumulative)

  return (
    <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card p-5">
      <h3 className="text-sm font-semibold text-mo-text mb-4">Cumulative Expenses</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2D9D0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#8A7F78' }}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#8A7F78' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={yAxisFormatter}
            domain={[0, 'auto']}
            width={40}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name === 'cumulative' ? 'This month' : 'Last month']}
            labelStyle={{ color: '#475569' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E2D9D0', fontSize: 12 }}
          />
          <Legend
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content={({ payload }: any) => (
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 11, color: '#8A7F78', marginTop: 4 }}>
                {payload?.map((entry: any) => (
                  <span key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="20" height="8">
                      <line x1="0" y1="4" x2="20" y2="4"
                        stroke={entry.color}
                        strokeWidth="2"
                        strokeDasharray={entry.dataKey === 'prevCumulative' ? '4 3' : undefined}
                      />
                    </svg>
                    {entry.dataKey === 'cumulative' ? 'This month' : 'Last month'}
                  </span>
                ))}
              </div>
            )}
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            name="cumulative"
            stroke="#8B9DB5"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            activeDot={{ r: 4, fill: '#8B9DB5' }}
          />
          {prevDays > 0 && (
            <Line
              type="monotone"
              dataKey="prevCumulative"
              name="prevCumulative"
              stroke="#8B9DB5"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              connectNulls={false}
              activeDot={{ r: 3, fill: '#8B9DB5' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
