'use client'

import React, { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import clsx from 'clsx'
import { Plus, X } from 'lucide-react'
import { DatePickerInput } from '@/components/ui/DatePickerInput'

interface BalancePoint {
  date: string
  label: string
  balance: number
  type: string
  amount: number
  contributor: string
}

interface ContributorStat {
  name: string
  deposited: number
  withdrawn: number
  net: number
}

interface InvestmentTx {
  id: number
  date: string
  amount: number
  type: string
  contributor: string
  note: string
}

interface InvestmentData {
  totalDeposited: number
  totalWithdrawn: number
  netBalance: number
  balanceHistory: BalancePoint[]
  byContributor: ContributorStat[]
  transactions: InvestmentTx[]
}

interface MonthGroup {
  month: string   // 'yyyy-MM'
  label: string   // 'March 2026'
  deposited: number
  withdrawn: number
  net: number
  endBalance: number
}

const fmt$ = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

const CONTRIBUTOR_COLORS: Record<string, string> = {
  Joy: '#8B9DB5',
  Mom: '#A89880',
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={clsx('rounded-2xl md:rounded-3xl p-4 md:p-5 flex flex-col gap-1', color)}>
      <span className="text-xs font-medium text-mo-muted">{label}</span>
      <span className="text-xl md:text-2xl font-bold text-mo-text tracking-tight">{value}</span>
      {sub && <span className="text-xs text-mo-muted">{sub}</span>}
    </div>
  )
}

const CONTRIBUTORS = ['Joy', 'Mom']
const today = format(new Date(), 'yyyy-MM-dd')

function AddTransactionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(today)
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit')
  const [contributor, setContributor] = useState('Joy')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/investment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, amount: parseFloat(amount), type, contributor, note }),
      })
      if (!res.ok) throw new Error('Failed')
      onSaved()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-mo-card rounded-t-3xl sm:rounded-3xl border border-mo-border shadow-card w-full sm:max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-mo-text">Add Transaction</h2>
          <button onClick={onClose} className="text-mo-muted hover:text-mo-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-mo-muted uppercase tracking-wide mb-2">Type</label>
            <div className="flex gap-2">
              {(['deposit', 'withdraw'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={clsx(
                    'flex-1 py-2 rounded-2xl text-sm font-medium border transition-all',
                    type === t
                      ? t === 'deposit'
                        ? 'bg-income-subtle text-income-dark border-income-dark/20'
                        : 'bg-expense-subtle text-expense-dark border-expense-dark/20'
                      : 'bg-mo-bg text-mo-muted border-mo-border'
                  )}
                >
                  {t === 'deposit' ? '↑ Deposit' : '↓ Withdraw'}
                </button>
              ))}
            </div>
          </div>

          {/* Contributor */}
          <div>
            <label className="block text-xs font-semibold text-mo-muted uppercase tracking-wide mb-2">Contributor</label>
            <div className="flex gap-2">
              {CONTRIBUTORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setContributor(c)}
                  className={clsx(
                    'flex-1 py-2 rounded-2xl text-sm font-medium border transition-all',
                    contributor === c
                      ? 'bg-brand-subtle text-brand-dark border-brand/20'
                      : 'bg-mo-bg text-mo-muted border-mo-border'
                  )}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{ background: CONTRIBUTOR_COLORS[c] ?? '#A89880' }}
                  />
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-mo-muted uppercase tracking-wide mb-2">Date</label>
            <DatePickerInput
              value={date}
              onChange={setDate}
              className="w-full rounded-2xl border border-mo-border bg-mo-bg px-3 py-2.5 text-sm text-mo-text"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-mo-muted uppercase tracking-wide mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mo-muted text-sm">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-2xl border border-mo-border bg-mo-bg pl-7 pr-3 py-2.5 text-sm text-mo-text placeholder:text-mo-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-mo-muted uppercase tracking-wide mb-2">Note <span className="normal-case font-normal">(optional)</span></label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. monthly contribution"
              className="w-full rounded-2xl border border-mo-border bg-mo-bg px-3 py-2.5 text-sm text-mo-text placeholder:text-mo-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !amount}
            className="w-full py-3 rounded-2xl bg-brand text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving…' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function InvestmentPage() {
  const [data, setData] = useState<InvestmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  function loadData() {
    setLoading(true)
    fetch('/api/investment')
      .then((r) => { if (!r.ok) throw new Error('API error'); return r.json() })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-mo-muted text-sm animate-pulse">Loading...</div>
      </div>
    )
  }
  if (!data) return <div className="text-center text-mo-muted py-16">No data available</div>

  // Filtered transactions
  const filteredTxs = selectedContributor
    ? data.transactions.filter((t) => t.contributor === selectedContributor)
    : data.transactions

  // Build monthly groups from filtered transactions (desc → reverse for asc processing)
  const txAsc = [...filteredTxs].reverse()
  const monthMap = new Map<string, MonthGroup>()
  for (const t of txAsc) {
    const month = t.date.slice(0, 7)
    if (!monthMap.has(month)) {
      monthMap.set(month, {
        month,
        label: format(parseISO(t.date), 'MMM yyyy'),
        deposited: 0,
        withdrawn: 0,
        net: 0,
        endBalance: 0,
      })
    }
    const g = monthMap.get(month)!
    if (t.type === 'deposit') g.deposited += t.amount
    else g.withdrawn += t.amount
    g.net = g.deposited - g.withdrawn
  }

  // Compute end-of-month cumulative balance
  let running = 0
  const monthlyHistory: { label: string; balance: number }[] = []
  for (const g of monthMap.values()) {
    running += g.net
    g.endBalance = Math.round(running)
    monthlyHistory.push({ label: g.label, balance: g.endBalance })
  }

  // Desc order for the table, filtered by selected year
  const allMonthGroups = [...monthMap.values()].reverse()
  const availableYears = [...new Set(allMonthGroups.map((g) => parseInt(g.month.slice(0, 4))))].sort((a, b) => b - a)
  const monthGroups = allMonthGroups.filter((g) => g.month.startsWith(String(selectedYear)))

  // Summary totals for filtered view
  const filteredDeposited = filteredTxs.filter((t) => t.type === 'deposit').reduce((s, t) => s + t.amount, 0)
  const filteredWithdrawn = filteredTxs.filter((t) => t.type === 'withdraw').reduce((s, t) => s + t.amount, 0)
  const filteredNet = filteredDeposited - filteredWithdrawn

  const totalContributed = data.byContributor.reduce((s, c) => s + c.deposited, 0)

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px]">
      {showModal && (
        <AddTransactionModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadData() }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mo-text">Fidelity Investment</h1>
          <p className="text-sm text-mo-muted mt-0.5">Cash flow history for the joint account</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-brand text-white text-sm font-medium shadow-soft"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="Net Balance"
          value={fmt$(filteredNet)}
          sub={`${filteredTxs.length} transactions`}
          color="bg-brand-subtle"
        />
        <SummaryCard
          label="Total Deposited"
          value={fmt$(filteredDeposited)}
          color="bg-income-subtle"
        />
        <SummaryCard
          label="Total Withdrawn"
          value={fmt$(filteredWithdrawn)}
          color="bg-expense-subtle"
        />
      </div>

      {/* Balance over time — monthly */}
      <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card p-5">
        <h2 className="text-sm font-semibold text-mo-text mb-4">Cumulative Balance</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyHistory} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2D9D0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#8A7F78' }}
              tickLine={false}
              axisLine={false}
              interval={Math.max(0, Math.floor(monthlyHistory.length / 8))}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#8A7F78' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={44}
            />
            <Tooltip
              formatter={(value: number) => [fmt$(value), 'Balance']}
              labelFormatter={(label) => label}
              contentStyle={{ borderRadius: '12px', border: '1px solid #E2D9D0', fontSize: 12, background: '#FDFCFB' }}
            />
            <ReferenceLine y={0} stroke="#E2D9D0" />
            <Line
              type="monotone"
              dataKey="balance"
              stroke={selectedContributor ? (CONTRIBUTOR_COLORS[selectedContributor] ?? '#8B9DB5') : '#8B9DB5'}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: selectedContributor ? (CONTRIBUTOR_COLORS[selectedContributor] ?? '#8B9DB5') : '#8B9DB5' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Contributor breakdown — click to filter */}
      <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-mo-text">By Contributor</h2>
          {selectedContributor && (
            <button
              onClick={() => setSelectedContributor(null)}
              className="text-xs text-mo-muted hover:text-mo-text flex items-center gap-1 transition-colors"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
        <div className="space-y-4">
          {data.byContributor.map((c) => {
            const pct = totalContributed > 0 ? (c.deposited / totalContributed) * 100 : 0
            const color = CONTRIBUTOR_COLORS[c.name] ?? '#A89880'
            const isActive = selectedContributor === c.name
            const isDimmed = selectedContributor !== null && !isActive
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedContributor(isActive ? null : c.name)}
                className={clsx(
                  'w-full text-left rounded-2xl p-3 -mx-3 transition-all',
                  isActive ? 'bg-mo-bg ring-1 ring-mo-border' : 'hover:bg-mo-bg/60',
                  isDimmed ? 'opacity-40' : 'opacity-100'
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-medium text-mo-text">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-mo-text">{fmt$(c.net)}</span>
                    <span className="text-xs text-mo-muted ml-2">net</span>
                  </div>
                </div>
                <div className="h-2 bg-mo-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-2xs text-mo-muted">↑ {fmt$(c.deposited)} deposited</span>
                  {c.withdrawn > 0 && (
                    <span className="text-2xs text-mo-muted">↓ {fmt$(c.withdrawn)} withdrawn</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Monthly summary table */}
      <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-mo-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-mo-text">Monthly Summary</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedYear((y) => {
                const idx = availableYears.indexOf(y)
                return availableYears[idx + 1] ?? y
              })}
              disabled={availableYears.indexOf(selectedYear) >= availableYears.length - 1}
              className="p-1 rounded-lg text-mo-muted hover:text-mo-text disabled:opacity-30 transition-colors"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-mo-text w-12 text-center">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear((y) => {
                const idx = availableYears.indexOf(y)
                return availableYears[idx - 1] ?? y
              })}
              disabled={availableYears.indexOf(selectedYear) <= 0}
              className="p-1 rounded-lg text-mo-muted hover:text-mo-text disabled:opacity-30 transition-colors"
            >
              ›
            </button>
          </div>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y divide-mo-border">
          {monthGroups.map((g) => (
            <div key={g.month} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-mo-text">{g.label}</span>
                <span className="text-sm font-semibold text-mo-text">{fmt$(g.endBalance)}</span>
              </div>
              <div className="flex gap-3 text-xs text-mo-muted">
                {g.deposited > 0 && <span className="text-income-dark">+{fmt$(g.deposited)}</span>}
                {g.withdrawn > 0 && <span className="text-expense-dark">−{fmt$(g.withdrawn)}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mo-border bg-mo-bg">
                <th className="px-5 py-3 text-left text-xs font-medium text-mo-muted">Month</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-mo-muted">Deposited</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-mo-muted">Withdrawn</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-mo-muted">Net</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-mo-muted">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mo-border">
              {monthGroups.map((g) => (
                <tr key={g.month} className="hover:bg-mo-bg transition-colors">
                  <td className="px-5 py-3 text-sm text-mo-text font-medium">{g.label}</td>
                  <td className="px-5 py-3 text-right text-sm text-income-dark">
                    {g.deposited > 0 ? `+${fmt$(g.deposited)}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-expense-dark">
                    {g.withdrawn > 0 ? `−${fmt$(g.withdrawn)}` : '—'}
                  </td>
                  <td className={clsx('px-5 py-3 text-right text-sm font-semibold', g.net >= 0 ? 'text-income-dark' : 'text-expense-dark')}>
                    {g.net >= 0 ? '+' : '−'}{fmt$(Math.abs(g.net))}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-mo-text">
                    {fmt$(g.endBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
