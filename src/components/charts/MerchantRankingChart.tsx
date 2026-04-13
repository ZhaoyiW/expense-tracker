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
import { MerchantAmount } from '@/types'

interface MerchantRankingChartProps {
  expenseMerchants: MerchantAmount[]
  incomeMerchants: MerchantAmount[]
  onMerchantSelect?: (merchant: string) => void
  selectedMerchant?: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

const labelFormatter = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`

function MerchantChart({
  data,
  color,
  title,
  onSelect,
  selected,
}: {
  data: MerchantAmount[]
  color: string
  title: string
  onSelect?: (merchant: string) => void
  selected?: string
}) {
  const [showAll, setShowAll] = useState(false)

  if (!data || data.length === 0) {
    return (
      <div className="flex-1">
        <h4 className="text-sm font-medium text-mo-muted mb-3">{title}</h4>
        <div className="h-48 flex items-center justify-center text-mo-muted text-sm">No data</div>
      </div>
    )
  }

  const handleClick = (entry: { merchant: string }) => {
    if (onSelect) onSelect(selected === entry.merchant ? '' : entry.merchant)
  }

  const visible = showAll ? data : data.slice(0, 5)

  return (
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-medium text-mo-muted mb-3">{title}</h4>
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
            dataKey="merchant"
            tick={{ fontSize: 11, fill: '#8A7F78' }}
            tickLine={false}
            axisLine={false}
            width={110}
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
                key={entry.merchant}
                fill={color}
                opacity={!selected || selected === entry.merchant ? 1 : 0.3}
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

export function MerchantRankingChart({
  expenseMerchants,
  incomeMerchants,
  onMerchantSelect,
  selectedMerchant,
}: MerchantRankingChartProps) {
  return (
    <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card p-5">
      <h3 className="text-sm font-semibold text-mo-text mb-4">Merchant Breakdown</h3>
      <div className="flex gap-8 flex-col lg:flex-row">
        <MerchantChart
          data={expenseMerchants.slice(0, 10)}
          color="#9B91B5"
          title="Top Expense Merchants"
          onSelect={onMerchantSelect}
          selected={selectedMerchant}
        />
        {incomeMerchants.length > 0 && (
          <MerchantChart
            data={incomeMerchants.slice(0, 10)}
            color="#7A9E8E"
            title="Income Sources"
            onSelect={onMerchantSelect}
            selected={selectedMerchant}
          />
        )}
      </div>
      {onMerchantSelect && (
        <p className="text-xs text-mo-muted mt-3">Click a bar to filter by merchant</p>
      )}
    </div>
  )
}
