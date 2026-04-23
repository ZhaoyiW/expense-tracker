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
import { SubCategoryAmount } from '@/types'

interface SubCategoryRankingChartProps {
  expenseBySubCategory: SubCategoryAmount[]
  incomeBySubCategory: SubCategoryAmount[]
  onSubCategorySelect?: (sub: string) => void
  selectedSubCategory?: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

const labelFormatter = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`

function SubCatChart({
  data,
  color,
  title,
  onSelect,
  selected,
}: {
  data: SubCategoryAmount[]
  color: string
  title: string
  onSelect?: (sub: string) => void
  selected?: string
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

  const handleClick = (entry: { sub_category: string }) => {
    if (onSelect) onSelect(selected === entry.sub_category ? '' : entry.sub_category)
  }

  const visible = showAll ? data : data.slice(0, 5)

  return (
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-medium text-mo-muted mb-3 text-center">{title}</h4>
      <ResponsiveContainer width="100%" height={Math.max(200, visible.length * 36)}>
        <BarChart
          data={visible}
          layout="vertical"
          margin={{ left: 0, right: 60, top: 0, bottom: 0 }}
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
            dataKey="sub_category"
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
              formatter={labelFormatter}
              style={{ fontSize: 10, fill: '#8A7F78' }}
            />
            {visible.map((entry) => (
              <Cell
                key={entry.sub_category}
                fill={color}
                opacity={!selected || selected === entry.sub_category ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {data.length > 5 && (
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

export function SubCategoryRankingChart({
  expenseBySubCategory,
  incomeBySubCategory,
  onSubCategorySelect,
  selectedSubCategory,
}: SubCategoryRankingChartProps) {
  const hasData = expenseBySubCategory.length > 0 || incomeBySubCategory.length > 0
  if (!hasData) return null

  return (
    <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card px-2 py-5">
      <h3 className="text-sm font-semibold text-mo-text mb-4 px-3">Sub-category Breakdown</h3>
      <div className="flex gap-8 flex-col lg:flex-row">
        <SubCatChart
          data={expenseBySubCategory.slice(0, 10)}
          color="#A89880"
          title="Top Expense Sub-categories"
          onSelect={onSubCategorySelect}
          selected={selectedSubCategory}
        />
        {incomeBySubCategory.length > 0 && (
          <SubCatChart
            data={incomeBySubCategory.slice(0, 10)}
            color="#7A9E8E"
            title="Income Sub-categories"
            onSelect={onSubCategorySelect}
            selected={selectedSubCategory}
          />
        )}
      </div>
      {onSubCategorySelect && (
        <p className="text-xs text-mo-muted mt-3">Click a bar to filter by sub-category</p>
      )}
    </div>
  )
}
