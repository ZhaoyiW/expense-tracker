'use client'

import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts'
import { YtdData, Transaction } from '@/types'
import { format, parseISO } from 'date-fns'
import { ArrowUpRight, ArrowDownRight, X } from 'lucide-react'
import clsx from 'clsx'
import { getCategoryEmoji } from '@/lib/constants'

const PIE_COLORS = [
  '#8B9DB5', '#7A9E8E', '#9B91B5', '#B87A72', '#A89880',
  '#6B7D95', '#5A7E6E', '#7A7096', '#8A5A54', '#8A7F78',
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

const formatFull = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)

const formatK = (value: number) => `$${(value / 1000).toFixed(0)}k`

const labelFormatterK = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`

interface YtdChartsProps {
  data: YtdData
  year: string
}

// ── YoY Summary card ──────────────────────────────────────────────────────────
function YoYCard({
  title,
  amount,
  prevAmount,
  prevLabel,
  colorClass,
  subtleClass,
  isGoodWhenUp,
}: {
  title: string
  amount: number
  prevAmount: number
  prevLabel: string
  colorClass: string
  subtleClass: string
  isGoodWhenUp: boolean
}) {
  const pct = prevAmount !== 0 ? ((amount - prevAmount) / Math.abs(prevAmount)) * 100 : null
  const isUp = pct !== null && pct >= 0
  const isGood = isGoodWhenUp ? isUp : !isUp

  return (
    <div className={clsx('rounded-2xl border border-mo-border p-3 md:p-5 flex flex-col gap-1.5 md:gap-2', subtleClass)}>
      <p className="text-[10px] md:text-sm font-medium text-mo-muted leading-tight">{title}</p>
      <p className={clsx('text-sm md:text-2xl font-bold', colorClass)}>{formatCurrency(amount)}</p>
      {pct !== null ? (
        <div className={clsx('flex items-center gap-0.5 text-[9px] md:text-xs font-medium', isGood ? 'text-income-dark' : 'text-expense-dark')}>
          {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          <span className="hidden sm:inline">{Math.abs(pct).toFixed(1)}% vs {prevLabel}</span>
          <span className="sm:hidden">{Math.abs(pct).toFixed(1)}%</span>
        </div>
      ) : (
        <p className="text-[9px] md:text-xs text-mo-muted">no data</p>
      )}
    </div>
  )
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-mo-card border border-mo-border rounded-2xl px-4 py-3 shadow-card text-sm">
      <p className="font-medium text-mo-text mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

// ── Pie label ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
  if (percent < 0.04) return null
  const RADIAN = Math.PI / 180
  const radius = outerRadius + 18
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#8A7F78" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ── Transaction table (inline, lightweight) ───────────────────────────────────
function YtdTable({ transactions }: { transactions: Transaction[] }) {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const total = transactions.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const paginated = transactions.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mo-border bg-mo-bg">
              <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted hidden sm:table-cell">Merchant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted hidden md:table-cell">Payment</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-mo-muted">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mo-border">
            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-mo-muted text-sm">No transactions found</td>
              </tr>
            )}
            {paginated.map((t) => (
              <tr key={t.id} className="hover:bg-mo-bg transition-colors">
                <td className="px-4 py-3 text-mo-muted text-xs whitespace-nowrap">
                  {format(parseISO(typeof t.date === 'string' ? t.date : new Date(t.date).toISOString()), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span>{getCategoryEmoji(t.category)}</span>
                    <div>
                      <div className="text-sm font-medium text-mo-text">{t.category}</div>
                      {t.sub_category && <div className="text-xs text-mo-muted">{t.sub_category}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-mo-text hidden sm:table-cell">{t.merchant || '—'}</td>
                <td className="px-4 py-3 text-xs text-mo-muted hidden md:table-cell">{t.payment_method}</td>
                <td className={clsx('px-4 py-3 text-right font-semibold whitespace-nowrap text-sm',
                  t.type === 'Income' ? 'text-income-dark' : 'text-expense-dark')}>
                  {t.type === 'Expense' ? '-' : '+'}{formatFull(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-mo-border">
          <span className="text-xs text-mo-muted">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-xl border border-mo-border hover:bg-mo-bg disabled:opacity-40">Prev</button>
            <span className="text-xs text-mo-muted">{page}/{totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-xl border border-mo-border hover:bg-mo-bg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function YtdCharts({ data, year }: YtdChartsProps) {
  const { totalIncome, totalExpense, prevYtdIncome, prevYtdExpense, ytdLabel, prevYtdLabel,
    monthlyTrends, expenseByCategory, incomeByCategory, transactions } = data

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const trendData = monthlyTrends.map((t) => ({
    ...t,
    label: format(parseISO(`${t.month}-01`), 'MMM'),
  }))

  // ── Filtered transactions for table ──────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedCategory && t.category !== selectedCategory) return false
      if (selectedMonth && !t.date.startsWith(selectedMonth)) return false
      if (selectedType && t.type !== selectedType) return false
      return true
    })
  }, [transactions, selectedCategory, selectedMonth, selectedType])

  const clearAllFilters = () => {
    setSelectedCategory(null)
    setSelectedMonth(null)
    setSelectedType(null)
  }

  const hasFilters = selectedCategory || selectedMonth || selectedType

  const handlePieClick = (entry: { category: string }) => {
    setSelectedCategory((prev) => prev === entry.category ? null : entry.category)
  }

  const handleMonthClick = (e: { activePayload?: { payload: { month: string } }[] }) => {
    const month = e?.activePayload?.[0]?.payload?.month
    if (month) setSelectedMonth((prev) => prev === month ? null : month)
  }

  const handleIncomeBarClick = () => setSelectedType((prev) => prev === 'Income' ? null : 'Income')
  const handleExpenseBarClick = () => setSelectedType((prev) => prev === 'Expense' ? null : 'Expense')

  return (
    <div className="space-y-6">
      {/* YoY Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <YoYCard
          title={`Income · ${ytdLabel}`}
          amount={totalIncome}
          prevAmount={prevYtdIncome}
          prevLabel={prevYtdLabel}
          colorClass="text-income-dark"
          subtleClass="bg-income-subtle"
          isGoodWhenUp={true}
        />
        <YoYCard
          title={`Expense · ${ytdLabel}`}
          amount={totalExpense}
          prevAmount={prevYtdExpense}
          prevLabel={prevYtdLabel}
          colorClass="text-expense-dark"
          subtleClass="bg-expense-subtle"
          isGoodWhenUp={false}
        />
        <YoYCard
          title={`Net Savings · ${ytdLabel}`}
          amount={totalIncome - totalExpense}
          prevAmount={prevYtdIncome - prevYtdExpense}
          prevLabel={prevYtdLabel}
          colorClass={totalIncome >= totalExpense ? 'text-net-dark' : 'text-expense-dark'}
          subtleClass={totalIncome >= totalExpense ? 'bg-net-subtle' : 'bg-expense-subtle'}
          isGoodWhenUp={true}
        />
      </div>

      {/* Monthly trends */}
      <div className="bg-mo-card rounded-3xl border border-mo-border p-6">
        <h3 className="text-sm font-semibold text-mo-text mb-1">Monthly Trends</h3>
        <p className="text-xs text-mo-muted mb-4">Click a month bar to filter the transaction table</p>
        {trendData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-mo-muted text-sm">No data for this year</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData} margin={{ left: -10, right: 8, top: 24, bottom: 0 }} onClick={handleMonthClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2D9D0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#8A7F78' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8A7F78' }} tickLine={false} axisLine={false} tickFormatter={formatK} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#8A7F78' }}
                formatter={(value) => <span style={{ color: '#8A7F78' }}>{value}</span>}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content={({ payload }: any) => (
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 12, color: '#8A7F78' }}>
                    {payload?.map((entry: any) => (
                      <span key={entry.value} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: entry.value === 'Income' ? '#7A9E8E' : '#B87A72', display: 'inline-block' }} />
                        {entry.value}
                      </span>
                    ))}
                  </div>
                )}
              />
              <Bar dataKey="income" name="Income" radius={[4, 4, 0, 0]} cursor="pointer"
                onClick={handleIncomeBarClick}>
                <LabelList dataKey="income" position="top" formatter={labelFormatterK}
                  style={{ fontSize: 9, fill: '#8A7F78' }} />
                {trendData.map((entry) => (
                  <Cell key={entry.month} fill="#7A9E8E"
                    opacity={!selectedMonth || selectedMonth === entry.month ? 1 : 0.3} />
                ))}
              </Bar>
              <Bar dataKey="expense" name="Expense" radius={[4, 4, 0, 0]} cursor="pointer"
                onClick={handleExpenseBarClick}>
                <LabelList dataKey="expense" position="top" formatter={labelFormatterK}
                  style={{ fontSize: 9, fill: '#8A7F78' }} />
                {trendData.map((entry) => (
                  <Cell key={entry.month} fill="#B87A72"
                    opacity={!selectedMonth || selectedMonth === entry.month ? 1 : 0.3} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by category */}
        <div className="bg-mo-card rounded-3xl border border-mo-border p-6">
          <h3 className="text-sm font-semibold text-mo-text mb-1">Expense by Category</h3>
          <p className="text-xs text-mo-muted mb-4">Click a slice to filter the transaction table</p>
          {expenseByCategory.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-mo-muted text-sm">No data</div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <PieChart width={280} height={240}>
                <Pie
                  data={expenseByCategory}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                  label={renderPieLabel}
                  labelLine={false}
                  cursor="pointer"
                  onClick={handlePieClick}
                >
                  {expenseByCategory.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                      opacity={!selectedCategory || selectedCategory === entry.category ? 1 : 0.3}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E2D9D0', background: '#FDFCFB' }}
                />
              </PieChart>
              <div className="w-full space-y-1">
                {expenseByCategory.slice(0, 8).map((item, i) => (
                  <button
                    key={item.category}
                    onClick={() => handlePieClick(item)}
                    className={clsx('w-full flex items-center justify-between text-xs rounded-xl px-2 py-1 transition-colors',
                      selectedCategory === item.category ? 'bg-mo-bg' : 'hover:bg-mo-bg')}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-mo-muted">{item.category}</span>
                    </div>
                    <span className="text-mo-text font-medium">{formatCurrency(item.amount)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Income by category */}
        <div className="bg-mo-card rounded-3xl border border-mo-border p-6">
          <h3 className="text-sm font-semibold text-mo-text mb-1">Income by Category</h3>
          <p className="text-xs text-mo-muted mb-4">Click a slice to filter the transaction table</p>
          {incomeByCategory.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-mo-muted text-sm">No data</div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <PieChart width={280} height={240}>
                <Pie
                  data={incomeByCategory}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                  label={renderPieLabel}
                  labelLine={false}
                  cursor="pointer"
                  onClick={handlePieClick}
                >
                  {incomeByCategory.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                      opacity={!selectedCategory || selectedCategory === entry.category ? 1 : 0.3}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E2D9D0', background: '#FDFCFB' }}
                />
              </PieChart>
              <div className="w-full space-y-1">
                {incomeByCategory.slice(0, 8).map((item, i) => (
                  <button
                    key={item.category}
                    onClick={() => handlePieClick(item)}
                    className={clsx('w-full flex items-center justify-between text-xs rounded-xl px-2 py-1 transition-colors',
                      selectedCategory === item.category ? 'bg-mo-bg' : 'hover:bg-mo-bg')}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-mo-muted">{item.category}</span>
                    </div>
                    <span className="text-mo-text font-medium">{formatCurrency(item.amount)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction table */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-semibold text-mo-text">
              Transactions
              <span className="ml-2 text-sm text-mo-muted font-normal">({filteredTransactions.length})</span>
            </h3>
            {hasFilters && (
              <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                {selectedType && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-subtle text-brand-dark text-xs font-medium">
                    Type: {selectedType}
                    <button onClick={() => setSelectedType(null)}><X size={10} /></button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-subtle text-brand-dark text-xs font-medium">
                    Category: {selectedCategory}
                    <button onClick={() => setSelectedCategory(null)}><X size={10} /></button>
                  </span>
                )}
                {selectedMonth && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-subtle text-brand-dark text-xs font-medium">
                    Month: {format(parseISO(`${selectedMonth}-01`), 'MMM yyyy')}
                    <button onClick={() => setSelectedMonth(null)}><X size={10} /></button>
                  </span>
                )}
                <button onClick={clearAllFilters} className="text-xs text-mo-muted hover:text-mo-text">
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
        <YtdTable transactions={filteredTransactions} key={`${selectedCategory}-${selectedMonth}-${selectedType}-${year}`} />
      </div>
    </div>
  )
}
