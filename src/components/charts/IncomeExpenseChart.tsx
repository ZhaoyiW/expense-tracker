'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface PaymentMethodChartProps {
  usdExpense: number
  rmbExpense: number
  onPaymentMethodSelect?: (method: string) => void
  selectedPaymentMethod?: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

const COLORS = {
  'USD Account': '#7A9E8E',
  'RMB Account': '#C4897A',
}

// Custom label rendered inside the ring slice
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  const symbol = name === 'USD Account' ? '$' : '¥'
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600} fill="#fff">
      {symbol} {(percent * 100).toFixed(0)}%
    </text>
  )
}

export function PaymentMethodChart({ usdExpense, rmbExpense, onPaymentMethodSelect, selectedPaymentMethod }: PaymentMethodChartProps) {
  const raw = [
    { name: 'USD Account', value: usdExpense },
    { name: 'RMB Account', value: rmbExpense },
  ]
  const data = raw.filter((d) => d.value > 0)
  const total = data.reduce((s, d) => s + d.value, 0)

  const handleClick = (entry: { name: string }) => {
    if (onPaymentMethodSelect) {
      onPaymentMethodSelect(selectedPaymentMethod === entry.name ? '' : entry.name)
    }
  }

  if (total === 0) {
    return (
      <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-mo-text mb-4">USD vs RMB Expenses</h3>
        <div className="flex-1 flex items-center justify-center text-mo-muted text-sm">No data</div>
      </div>
    )
  }

  return (
    <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card p-5">
      <h3 className="text-sm font-semibold text-mo-text mb-2">USD vs RMB Expenses</h3>
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={90}
            paddingAngle={2}
            cursor="pointer"
            onClick={handleClick}
            labelLine={false}
            label={PieLabel}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name as keyof typeof COLORS]}
                opacity={!selectedPaymentMethod || selectedPaymentMethod === entry.name ? 1 : 0.35}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === 'USD Account' ? '$ USD' : '¥ RMB',
            ]}
            contentStyle={{ borderRadius: '12px', border: '1px solid #E2D9D0', fontSize: 12, background: '#FDFCFB' }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex justify-center gap-6 -mt-2">
        {raw.filter((d) => d.value > 0).map((entry) => (
          <button
            key={entry.name}
            onClick={() => handleClick(entry)}
            className="flex items-center gap-1.5 text-xs text-mo-muted hover:text-mo-text"
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{
                background: COLORS[entry.name as keyof typeof COLORS],
                opacity: !selectedPaymentMethod || selectedPaymentMethod === entry.name ? 1 : 0.35,
              }}
            />
            {entry.name === 'USD Account' ? '$ USD' : '¥ RMB'}
            <span className="font-medium text-mo-text">{formatCurrency(entry.value)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
