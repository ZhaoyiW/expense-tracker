'use client'

import { useEffect, useState } from 'react'
import { format, parseISO, subMonths, startOfMonth, endOfMonth, getDaysInMonth, getDate } from 'date-fns'
import clsx from 'clsx'

// ---- Types ----
interface SavingsRatePoint { month: string; income: number; expense: number; rate: number | null }
interface MerchantStat { merchant: string; amount: number; txCount: number }
interface DayOfWeekStat { day: string; totalAmount: number; avgPerDay: number }
interface CategoryStat { category: string; amount: number; pct: number }
interface BigTransaction { id: string; date: string; amount: number; category: string; sub_category: string | null; merchant: string | null; note: string | null }
interface MonthStat { month: string; amount: number }

interface InsightsData {
  totalMonths: number
  totalTransactions: number
  allTimeExpense: number
  allTimeIncome: number
  avgMonthlyExpense: number
  currentMonthExpense: number
  currentMonthIncome: number
  savingsRateTrend: SavingsRatePoint[]
  topMerchantsAllTime: MerchantStat[]
  topMerchantsRecent: MerchantStat[]
  spendingByDayOfWeek: DayOfWeekStat[]
  topCategoriesAllTime: CategoryStat[]
  topCategoriesRecent: CategoryStat[]
  recentBiggest: BigTransaction[]
  highestExpenseMonth: MonthStat | null
  lowestExpenseMonth: MonthStat | null
  weekendAvgDaily: number
  weekdayAvgDaily: number
}

// ---- Formatters ----
const fmt$ = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

function fmtMonthShort(yyyyMM: string) {
  try { return format(parseISO(`${yyyyMM}-01`), 'MMM yyyy') } catch { return yyyyMM }
}

// ---- Insight card type ----
type Tone = 'good' | 'bad' | 'neutral' | 'info'
interface InsightCard { emoji: string; title: string; body: string; tone: Tone }

function generateCards(data: InsightsData): InsightCard[] {
  const cards: InsightCard[] = []
  const {
    savingsRateTrend: trend,
    topCategoriesAllTime, topCategoriesRecent,
    topMerchantsRecent,
    spendingByDayOfWeek,
    recentBiggest,
    weekendAvgDaily, weekdayAvgDaily,
    avgMonthlyExpense,
    currentMonthExpense, currentMonthIncome,
  } = data

  // 1. Savings rate trend (recent 3 vs prior 3)
  if (trend.length >= 6) {
    const withRate = (pts: SavingsRatePoint[]) =>
      pts.filter((t) => t.rate !== null).map((t) => t.rate as number)
    const r3 = withRate(trend.slice(-3))
    const p3 = withRate(trend.slice(-6, -3))
    if (r3.length > 0 && p3.length > 0) {
      const rAvg = r3.reduce((s, v) => s + v, 0) / r3.length
      const pAvg = p3.reduce((s, v) => s + v, 0) / p3.length
      const up = rAvg > pAvg + 2
      const down = rAvg < pAvg - 2
      cards.push({
        emoji: up ? '📈' : down ? '📉' : '➡️',
        title: up ? 'Savings rate on the rise' : down ? 'Savings rate slipping' : 'Savings rate holding steady',
        body: `Your avg savings rate over the last 3 months is ${rAvg.toFixed(1)}%, vs ${pAvg.toFixed(1)}% in the prior 3 months.${up ? ' Keep it up.' : down ? ' Worth keeping an eye on.' : ''}`,
        tone: up ? 'good' : down ? 'bad' : 'neutral',
      })
    }
  }

  // 2. Last month vs 3-month rolling average
  if (trend.length >= 4) {
    const last   = trend[trend.length - 1]
    const prior  = trend.slice(-4, -1)
    const priorAvg = prior.reduce((s, t) => s + t.expense, 0) / prior.length
    if (priorAvg > 0) {
      const pct = ((last.expense - priorAvg) / priorAvg) * 100
      if (Math.abs(pct) >= 5) {
        cards.push({
          emoji: pct > 0 ? '⬆️' : '⬇️',
          title: pct > 0 ? 'Spending picked up last month' : 'Spending cooled down last month',
          body: `${fmtMonthShort(last.month)} expenses (${fmt$(last.expense)}) were ${Math.abs(pct).toFixed(0)}% ${pct > 0 ? 'above' : 'below'} your 3-month rolling average of ${fmt$(priorAvg)}.`,
          tone: pct > 0 ? 'bad' : 'good',
        })
      }
    }
  }

  // 3. Current month pace
  if (avgMonthlyExpense > 0 && currentMonthExpense > 0) {
    const now = new Date()
    const daysSoFar  = getDate(now)
    const daysInMonth = getDaysInMonth(now)
    const projected  = Math.round((currentMonthExpense / daysSoFar) * daysInMonth)
    const pct = ((projected - avgMonthlyExpense) / avgMonthlyExpense) * 100
    const isOver = pct > 10
    const isUnder = pct < -10
    cards.push({
      emoji: isOver ? '🔴' : isUnder ? '🟢' : '🟡',
      title: isOver
        ? 'On pace to overspend this month'
        : isUnder
          ? 'On track for a light month'
          : 'Spending on track this month',
      body: `${fmt$(currentMonthExpense)} spent so far (day ${daysSoFar}/${daysInMonth}). At this pace: ${fmt$(projected)} — ${isOver || isUnder ? `${Math.abs(pct).toFixed(0)}% ${isOver ? 'above' : 'below'}` : 'roughly in line with'} your ${fmt$(avgMonthlyExpense)}/month average.`,
      tone: isOver ? 'bad' : isUnder ? 'good' : 'neutral',
    })
  }

  // 4. Recent top category (last 3 months) vs all-time
  if (topCategoriesRecent.length > 0) {
    const recent = topCategoriesRecent[0]
    const allTimeTop = topCategoriesAllTime[0]
    const shifted = allTimeTop && recent.category !== allTimeTop.category
    cards.push({
      emoji: '🗂️',
      title: `${recent.category} leads your recent spending`,
      body: shifted
        ? `${recent.category} is your #1 category over the last 3 months (${recent.pct.toFixed(0)}% of spend, ${fmt$(recent.amount)}), up from its usual rank — historically ${allTimeTop.category} has been your top.`
        : `${recent.category} accounts for ${recent.pct.toFixed(0)}% of your spending over the last 3 months (${fmt$(recent.amount)}) — consistent with your all-time pattern.`,
      tone: shifted ? 'info' : 'neutral',
    })
  }

  // 5. Recent top merchant (last 3 months)
  if (topMerchantsRecent.length > 0) {
    const m = topMerchantsRecent[0]
    const perTx = m.txCount > 0 ? m.amount / m.txCount : 0
    cards.push({
      emoji: '🏪',
      title: `${m.merchant} is your go-to lately`,
      body: `Over the last 3 months you've spent ${fmt$(m.amount)} at ${m.merchant} across ${m.txCount} transactions — averaging ${fmt$(perTx)} per visit.`,
      tone: 'neutral',
    })
  }

  // 6. Day-of-week pattern
  const sortedDays = [...spendingByDayOfWeek].filter((d) => d.avgPerDay > 0).sort((a, b) => b.avgPerDay - a.avgPerDay)
  if (sortedDays.length >= 2) {
    const heaviest = sortedDays[0]
    const lightest  = sortedDays[sortedDays.length - 1]
    cards.push({
      emoji: '🗓️',
      title: `${heaviest.day}s are your biggest spending days`,
      body: `You average ${fmt$(heaviest.avgPerDay)} on ${heaviest.day}s — the most of any day. ${lightest.day}s are your lightest at ${fmt$(lightest.avgPerDay)}/day.`,
      tone: 'neutral',
    })
  }

  // 7. Weekend vs weekday
  if (weekendAvgDaily > 0 && weekdayAvgDaily > 0) {
    const moreWeekend = weekendAvgDaily > weekdayAvgDaily
    const pct = Math.abs((weekendAvgDaily - weekdayAvgDaily) / weekdayAvgDaily * 100)
    cards.push({
      emoji: moreWeekend ? '🛍️' : '💼',
      title: moreWeekend ? 'You spend more on weekends' : 'You spend more on weekdays',
      body: moreWeekend
        ? `Weekend days average ${fmt$(weekendAvgDaily)} vs ${fmt$(weekdayAvgDaily)} on weekdays — ${pct.toFixed(0)}% higher.`
        : `Weekdays average ${fmt$(weekdayAvgDaily)} vs ${fmt$(weekendAvgDaily)} on weekends — ${pct.toFixed(0)}% higher.`,
      tone: 'neutral',
    })
  }

  // 8. Recent category runner-up — narrowing or widening gap?
  if (topCategoriesRecent.length >= 2) {
    const top    = topCategoriesRecent[0]
    const second = topCategoriesRecent[1]
    const gap    = top.pct - second.pct
    cards.push({
      emoji: gap < 8 ? '⚖️' : '🎯',
      title: gap < 8
        ? `${top.category} and ${second.category} are neck and neck`
        : `${top.category} well ahead of ${second.category}`,
      body: `Over the last 3 months: ${top.category} at ${top.pct.toFixed(0)}% of spend vs ${second.category} at ${second.pct.toFixed(0)}%.${gap < 8 ? ' Your top two categories are almost tied.' : ''}`,
      tone: 'neutral',
    })
  }

  // 9. Recent biggest transaction
  if (recentBiggest.length > 0) {
    const big = recentBiggest[0]
    cards.push({
      emoji: '💸',
      title: 'Biggest purchase in the last 3 months',
      body: `${fmt$(big.amount)} at ${big.merchant || big.category} on ${format(parseISO(big.date), 'MMM d')}${big.sub_category ? ` (${big.sub_category})` : ''}${big.note ? ` — "${big.note}"` : ''}.`,
      tone: 'neutral',
    })
  }

  return cards
}

// ---- Card component ----
function InsightCard({ emoji, title, body, tone }: InsightCard) {
  const toneStyles: Record<Tone, string> = {
    good:    'border-l-4 border-income-dark bg-income-subtle rounded-r-2xl rounded-l-md',
    bad:     'border-l-4 border-expense-dark bg-expense-subtle rounded-r-2xl rounded-l-md',
    info:    'border-l-4 border-brand-dark bg-brand-subtle rounded-r-2xl rounded-l-md',
    neutral: 'border border-mo-border bg-mo-card rounded-2xl',
  }
  return (
    <div className={clsx('p-4 shadow-soft flex flex-col gap-2', toneStyles[tone])}>
      <span className="text-2xl">{emoji}</span>
      <p className="text-sm font-semibold text-mo-text leading-snug">{title}</p>
      <p className="text-xs text-mo-muted leading-relaxed">{body}</p>
    </div>
  )
}

// ---- Page ----
export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/insights')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-mo-muted text-sm animate-pulse">Loading insights...</div>
      </div>
    )
  }
  if (!data) return <div className="text-center text-mo-muted py-16">No data available</div>

  const cards = generateCards(data)

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold text-mo-text">💡 Insights</h1>
        <p className="text-sm text-mo-muted mt-0.5">Recent patterns and trends in your spending</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <InsightCard key={i} {...card} />
        ))}
      </div>
    </div>
  )
}
