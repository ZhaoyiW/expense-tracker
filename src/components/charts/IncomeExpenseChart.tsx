'use client'

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

interface PaymentMethodChartProps {
  usdExpense: number
  rmbExpense: number
  onPaymentMethodSelect?: (method: string) => void
  selectedPaymentMethod?: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

export function PaymentMethodChart({ usdExpense, rmbExpense, onPaymentMethodSelect, selectedPaymentMethod }: PaymentMethodChartProps) {
  const data = [
    { name: 'USD Account', value: usdExpense, method: 'USD Account', color: '#8B9DB5' },
    { name: 'RMB Account', value: rmbExpense, method: 'RMB Account', color: '#A89880' },
  ]

  const handleClick = (entry: { method: string }) => {
    if (onPaymentMethodSelect) {
      onPaymentMethodSelect(selectedPaymentMethod === entry.method ? '' : entry.method)
    }
  }

  return (
    <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card p-5">
      <h3 className="text-sm font-semibold text-mo-text mb-4">USD vs RMB Expenses</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 24, right: 16, bottom: 0, left: -10 }}
          onClick={(e) => e?.activePayload && handleClick(e.activePayload[0].payload)}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2D9D0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#8A7F78' }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#8A7F78' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={40}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), '']}
            contentStyle={{ borderRadius: '12px', border: '1px solid #E2D9D0', fontSize: 12, background: '#FDFCFB' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} cursor="pointer">
            <LabelList
              dataKey="value"
              position="top"
              formatter={formatCurrency}
              style={{ fontSize: 11, fill: '#8A7F78' }}
            />
            {data.map((entry) => (
              <Cell
                key={entry.method}
                fill={entry.color}
                opacity={!selectedPaymentMethod || selectedPaymentMethod === entry.method ? 1 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {onPaymentMethodSelect && (
        <p className="text-xs text-mo-muted mt-2">Click a bar to filter by account</p>
      )}
    </div>
  )
}
