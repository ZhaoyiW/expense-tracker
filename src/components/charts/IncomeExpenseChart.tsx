'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface PaymentMethodChartProps {
  usdExpense: number
  rmbExpense: number
  onPaymentMethodSelect?: (method: string) => void
  selectedPaymentMethod?: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

const COLORS = {
  'USD Account': '#8B9DB5',
  'RMB Account': '#A89880',
}

export function PaymentMethodChart({ usdExpense, rmbExpense, onPaymentMethodSelect, selectedPaymentMethod }: PaymentMethodChartProps) {
  const raw = [
    { name: 'USD Account', label: '$ USD', value: usdExpense },
    { name: 'RMB Account', label: '¥ RMB', value: rmbExpense },
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
      <h3 className="text-sm font-semibold text-mo-text mb-4">USD vs RMB Expenses</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={3}
            cursor="pointer"
            onClick={handleClick}
            label={({ name, percent }) =>
              `${name === 'USD Account' ? '$' : '¥'} ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
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
          <Legend
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content={({ payload }: any) => (
              <div className="flex justify-center gap-6 mt-2">
                {payload?.map((entry: any) => (
                  <button
                    key={entry.value}
                    onClick={() => handleClick({ name: entry.value })}
                    className="flex items-center gap-1.5 text-xs text-mo-muted hover:text-mo-text"
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ background: entry.color, opacity: !selectedPaymentMethod || selectedPaymentMethod === entry.value ? 1 : 0.35 }}
                    />
                    {entry.value === 'USD Account' ? '$ USD' : '¥ RMB'}
                    <span className="font-medium text-mo-text">
                      {formatCurrency(entry.value === 'USD Account' ? usdExpense : rmbExpense)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
