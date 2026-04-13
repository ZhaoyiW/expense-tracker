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
  changeLabel?: string
  cardStyle: string
  valueStyle: string
  emoji: string
  // true = going up is good (income, net savings, savings rate)
  // false = going up is bad (expense)
  isGoodWhenUp?: boolean
  prominent?: boolean
}

function MetricCard({ title, value, change, changeLabel, cardStyle, valueStyle, emoji, isGoodWhenUp = true, prominent = false }: CardProps) {
  const isUp = change !== null && change >= 0
  const isGood = isGoodWhenUp ? isUp : !isUp

  return (
    <div className={clsx('rounded-2xl md:rounded-3xl flex flex-col gap-1.5 md:gap-3', prominent ? 'p-4 md:p-6' : 'p-3 md:p-5', cardStyle)}>
      <div className="flex items-center justify-between">
        <span className={clsx('font-medium text-mo-muted leading-tight', prominent ? 'text-xs md:text-sm' : 'text-[10px] md:text-sm')}>{title}</span>
        <span className={clsx(prominent ? 'text-base md:text-2xl' : 'text-sm md:text-xl')}>{emoji}</span>
      </div>
      <div>
        <div className={clsx('font-bold tracking-tight', prominent ? 'text-lg md:text-3xl' : 'text-sm md:text-2xl', valueStyle)}>{value}</div>
        {change !== null ? (
          <div className={clsx(
            'flex items-center gap-0.5 mt-1 font-medium',
            prominent ? 'text-[10px] md:text-xs' : 'text-[9px] md:text-xs',
            isGood ? 'text-income-dark' : 'text-expense-dark'
          )}>
            {isUp ? <ArrowUpRight size={prominent ? 12 : 10} /> : <ArrowDownRight size={prominent ? 12 : 10} />}
            <span className="hidden sm:inline">{Math.abs(change).toFixed(1)}% vs last month</span>
            <span className="sm:hidden">{Math.abs(change).toFixed(1)}%</span>
          </div>
        ) : (
          <div className={clsx('text-mo-muted mt-1', prominent ? 'text-[10px] md:text-xs' : 'text-[9px] md:text-xs')}>{changeLabel ?? 'No prior data'}</div>
        )}
      </div>
    </div>
  )
}

export function SummaryCards({ income, expense, prevIncome, prevExpense }: SummaryCardsProps) {
  const net = income - expense
  const prevNet = prevIncome - prevExpense
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : null
  const prevSavingsRate = prevIncome > 0 ? ((prevIncome - prevExpense) / prevIncome) * 100 : null

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Top row: Income + Expense */}
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
      {/* Bottom row: Net Savings (prominent) + Savings Rate */}
      <MetricCard
        title="Net Savings"
        value={fmt(net)}
        change={pctChange(net, prevNet)}
        cardStyle={net >= 0 ? 'bg-net-subtle ring-1 ring-net-dark/20' : 'bg-expense-subtle ring-1 ring-rose-300/30'}
        valueStyle={net >= 0 ? 'text-net-dark' : 'text-expense-dark'}
        emoji={net >= 0 ? '🎯' : '⚠️'}
        isGoodWhenUp={true}
        prominent={true}
      />
      <MetricCard
        title="Savings Rate"
        value={savingsRate !== null ? `${savingsRate.toFixed(1)}%` : 'N/A'}
        change={savingsRate !== null && prevSavingsRate !== null ? savingsRate - prevSavingsRate : null}
        changeLabel={prevSavingsRate !== null ? `Prev: ${prevSavingsRate.toFixed(1)}%` : 'No prior data'}
        cardStyle="bg-brand-subtle"
        valueStyle="text-brand-dark"
        emoji="✨"
        isGoodWhenUp={true}
      />
    </div>
  )
}
