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
    <div className={clsx('rounded-2xl md:rounded-3xl p-3 md:p-5 flex flex-col gap-1.5 md:gap-3', cardStyle)}>
      {/* Title row: label left, emoji right — original layout */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] md:text-sm font-medium text-mo-muted leading-tight">{title}</span>
        <span className="text-sm md:text-xl">{emoji}</span>
      </div>
      {/* Big number */}
      <div className={clsx('text-xl md:text-3xl font-bold tracking-tight', valueStyle)}>{value}</div>
      {/* MoM — small, original size */}
      {change !== null ? (
        <div className={clsx(
          'flex items-center gap-0.5 text-[9px] md:text-xs font-medium',
          isGood ? 'text-income-dark' : 'text-expense-dark'
        )}>
          {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          <span className="hidden sm:inline">{Math.abs(change).toFixed(1)}% vs last month</span>
          <span className="sm:hidden">{Math.abs(change).toFixed(1)}%</span>
        </div>
      ) : (
        <div className="text-[9px] md:text-xs text-mo-muted">No prior data</div>
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
