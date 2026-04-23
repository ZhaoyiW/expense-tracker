'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { CategoryAmount } from '@/types'

const DEFAULT_SHOW = 5

interface CategoryRankingChartProps {
  expenseByCategory: CategoryAmount[]
  incomeByCategory: CategoryAmount[]
  onCategorySelect?: (category: string) => void
  selectedCategory?: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

const labelFormatter = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`

function HorizontalBarChart({
  data,
  color,
  title,
  onSelect,
  selected,
  total,
}: {
  data: CategoryAmount[]
  color: string
  title: string
  onSelect?: (cat: string) => void
  selected?: string
  total?: number
}) {
  const [showAll, setShowAll] = useState(false)

  if (!data || data.length === 0) {
    return (
      <div className="flex-1">
        <h4 className="text-sm font-medium text-mo-muted mb-3 text-center">{title}</h4>
        <div className="h-48 flex items-center justify-center text-mo-muted text-sm">No data</div>
      </div>
    )
  }

  const handleClick = (entry: { category: string }) => {
    if (onSelect) onSelect(selected === entry.category ? '' : entry.category)
  }

  const visible = showAll ? data : data.slice(0, DEFAULT_SHOW)

  return (
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-medium text-mo-muted mb-3 text-center">{title}</h4>
      <ResponsiveContainer width="100%" height={Math.max(200, visible.length * 36)}>
        <BarChart
          data={visible}
          layout="vertical"
          margin={{ left: 0, right: total ? 90 : 60, top: 0, bottom: 0 }}
          onClick={(e) => e?.activePayload && handleClick(e.activePayload[0].payload)}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2D9D0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#8A7F78' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fontSize: 11, fill: '#8A7F78' }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Amount']}
            contentStyle={{ borderRadius: '12px', border: '1px solid #E2D9D0', fontSize: 12, background: '#FDFCFB' }}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} cursor="pointer">
            <LabelList
              dataKey="amount"
              position="right"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content={(props: any) => {
                const { x, y, width, height, value } = props
                const label = total && total > 0
                  ? `${labelFormatter(value)} (${Math.round((value / total) * 100)}%)`
                  : labelFormatter(value)
                return (
                  <text x={x + width + 4} y={y + height / 2 + 4} fontSize={10} fill="#8A7F78">
                    {label}
                  </text>
                )
              }}
            />
            {visible.map((entry) => (
              <Cell
                key={entry.category}
                fill={color}
                opacity={!selected || selected === entry.category ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {data.length > DEFAULT_SHOW && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-xs text-brand-dark font-medium hover:underline"
        >
          {showAll ? 'Show less' : `Show all ${data.length}`}
        </button>
      )}
    </div>
  )
}

export function CategoryRankingChart({
  expenseByCategory,
  incomeByCategory,
  onCategorySelect,
  selectedCategory,
}: CategoryRankingChartProps) {
  return (
    <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card px-2 py-5">
      <h3 className="text-sm font-semibold text-mo-text mb-4 px-3">Category Breakdown</h3>
      <div className="flex gap-8 flex-col lg:flex-row">
        <HorizontalBarChart
          data={expenseByCategory.slice(0, 10)}
          color="#8B9DB5"
          title="Top Expense Categories"
          onSelect={onCategorySelect}
          selected={selectedCategory}
          total={expenseByCategory.reduce((s, c) => s + c.amount, 0)}
        />
        <HorizontalBarChart
          data={incomeByCategory.slice(0, 10)}
          color="#7A9E8E"
          title="Income Categories"
          onSelect={onCategorySelect}
          selected={selectedCategory}
        />
      </div>
      {onCategorySelect && (
        <p className="text-xs text-mo-muted mt-3">Click a bar to filter by category</p>
      )}
    </div>
  )
}
