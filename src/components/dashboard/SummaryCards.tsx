'use client'

import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import clsx from 'clsx'

interface SummaryCardsProps {
  income: number
  expense: number
  prevIncome: number
  prevExpense: number
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return null
  return ((curr - prev) / prev) * 100
}

interface CardProps {
  title: string
  value: string
  change: number | null
  cardStyle: string
  valueStyle: string
  emoji: string
  isGoodWhenUp?: boolean
}

function MetricCard({ title, value, change, cardStyle, valueStyle, emoji, isGoodWhenUp = true }: CardProps) {
  const isUp = change !== null && change >= 0
  const isGood = isGoodWhenUp ? isUp : !isUp

  return (
    <div className={clsx('rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center gap-2 text-center', cardStyle)}>
      <div className="flex items-center gap-1.5">
        <span className="text-base">{emoji}</span>
        <span className="text-xs md:text-sm font-medium text-mo-muted">{title}</span>
      </div>
      <div className={clsx('text-2xl md:text-4xl font-bold tracking-tight', valueStyle)}>{value}</div>
      {change !== null ? (
        <div className={clsx(
          'flex items-center gap-0.5 text-[10px] md:text-xs font-medium',
          isGood ? 'text-income-dark' : 'text-expense-dark'
        )}>
          {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {Math.abs(change).toFixed(1)}% vs last month
        </div>
      ) : (
        <div className="text-[10px] md:text-xs text-mo-muted">No prior data</div>
      )}
    </div>
  )
}

export function SummaryCards({ income, expense, prevIncome, prevExpense }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        title="Income"
        value={fmt(income)}
        change={pctChange(income, prevIncome)}
        cardStyle="bg-income-subtle"
        valueStyle="text-income-dark"
        emoji="💚"
        isGoodWhenUp={true}
      />
      <MetricCard
        title="Expense"
        value={fmt(expense)}
        change={pctChange(expense, prevExpense)}
        cardStyle="bg-expense-subtle"
        valueStyle="text-expense-dark"
        emoji="🧾"
        isGoodWhenUp={false}
      />
    </div>
  )
}
