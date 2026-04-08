import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

const round = (n: number) => Math.round(n * 100) / 100

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export async function GET() {
  try {
    const allTransactions = await prisma.transaction.findMany({
      orderBy: { date: 'asc' },
    })

    const expenses = allTransactions.filter((t) => t.type === 'Expense')
    const incomes  = allTransactions.filter((t) => t.type === 'Income')

    // --- Summary stats ---
    const allTimeExpense = round(expenses.reduce((s, t) => s + t.amount, 0))
    const allTimeIncome  = round(incomes.reduce((s, t) => s + t.amount, 0))

    const expenseMonthSet = new Set<string>()
    for (const t of expenses) expenseMonthSet.add(format(t.date, 'yyyy-MM'))
    const totalMonths = expenseMonthSet.size
    const totalTransactions = allTransactions.length
    const avgMonthlyExpense = round(totalMonths > 0 ? allTimeExpense / totalMonths : 0)

    // --- Savings Rate Trend (last 12 calendar months) ---
    const now = new Date()
    const savingsRateTrend: { month: string; income: number; expense: number; rate: number | null }[] = []

    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const monthKey  = format(monthDate, 'yyyy-MM')
      const mStart    = startOfMonth(monthDate)
      const mEnd      = endOfMonth(monthDate)

      const mIncome  = allTransactions.filter((t) => t.type === 'Income'  && t.date >= mStart && t.date <= mEnd).reduce((s, t) => s + t.amount, 0)
      const mExpense = allTransactions.filter((t) => t.type === 'Expense' && t.date >= mStart && t.date <= mEnd).reduce((s, t) => s + t.amount, 0)
      const rate = mIncome === 0 ? null : round(((mIncome - mExpense) / mIncome) * 100)

      savingsRateTrend.push({ month: monthKey, income: round(mIncome), expense: round(mExpense), rate })
    }

    // --- Current month ---
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd   = endOfMonth(now)
    const currentMonthExpense = round(expenses.filter((t) => t.date >= currentMonthStart && t.date <= currentMonthEnd).reduce((s, t) => s + t.amount, 0))
    const currentMonthIncome  = round(incomes.filter((t)  => t.date >= currentMonthStart && t.date <= currentMonthEnd).reduce((s, t) => s + t.amount, 0))

    // --- Last 3 complete months window ---
    const recent3Start = startOfMonth(subMonths(now, 3))
    const recent3End   = endOfMonth(subMonths(now, 1))
    const recentExpenses = expenses.filter((t) => t.date >= recent3Start && t.date <= recent3End)

    // --- Top Merchants All Time ---
    const merchantAmountMap: Record<string, number> = {}
    const merchantCountMap:  Record<string, number> = {}
    for (const t of expenses) {
      const m = t.merchant || 'Unknown'
      merchantAmountMap[m] = (merchantAmountMap[m] || 0) + t.amount
      merchantCountMap[m]  = (merchantCountMap[m]  || 0) + 1
    }
    const topMerchantsAllTime = Object.entries(merchantAmountMap)
      .map(([merchant, amount]) => ({ merchant, amount: round(amount), txCount: merchantCountMap[merchant] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    // --- Top Merchants Recent (last 3 full months) ---
    const recentMerchantAmountMap: Record<string, number> = {}
    const recentMerchantCountMap:  Record<string, number> = {}
    for (const t of recentExpenses) {
      const m = t.merchant || 'Unknown'
      recentMerchantAmountMap[m] = (recentMerchantAmountMap[m] || 0) + t.amount
      recentMerchantCountMap[m]  = (recentMerchantCountMap[m]  || 0) + 1
    }
    const topMerchantsRecent = Object.entries(recentMerchantAmountMap)
      .map(([merchant, amount]) => ({ merchant, amount: round(amount), txCount: recentMerchantCountMap[merchant] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // --- Spending by Day of Week ---
    const dowAmountMap: Record<number, number>    = {}
    const dowDateSet:   Record<number, Set<string>> = {}
    for (let d = 0; d < 7; d++) { dowAmountMap[d] = 0; dowDateSet[d] = new Set() }
    for (const t of expenses) {
      const dow     = t.date.getUTCDay()
      const dateStr = format(t.date, 'yyyy-MM-dd')
      dowAmountMap[dow] = (dowAmountMap[dow] || 0) + t.amount
      dowDateSet[dow].add(dateStr)
    }
    const spendingByDayOfWeek = DAY_NAMES.map((day, i) => ({
      day,
      totalAmount: round(dowAmountMap[i]),
      avgPerDay:   round(dowDateSet[i].size > 0 ? dowAmountMap[i] / dowDateSet[i].size : 0),
    }))

    // --- Top Categories All Time ---
    const catAmountMap: Record<string, number> = {}
    for (const t of expenses) catAmountMap[t.category] = (catAmountMap[t.category] || 0) + t.amount
    const topCategoriesAllTime = Object.entries(catAmountMap)
      .map(([category, amount]) => ({ category, amount: round(amount), pct: round(allTimeExpense > 0 ? (amount / allTimeExpense) * 100 : 0) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)

    // --- Top Categories Recent (last 3 full months) ---
    const recentTotal = recentExpenses.reduce((s, t) => s + t.amount, 0)
    const recentCatMap: Record<string, number> = {}
    for (const t of recentExpenses) recentCatMap[t.category] = (recentCatMap[t.category] || 0) + t.amount
    const topCategoriesRecent = Object.entries(recentCatMap)
      .map(([category, amount]) => ({ category, amount: round(amount), pct: round(recentTotal > 0 ? (amount / recentTotal) * 100 : 0) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // --- Biggest Transactions (last 3 full months) ---
    const recentBiggest = [...recentExpenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map((t) => ({
        id: t.id, date: t.date.toISOString(), amount: t.amount,
        category: t.category, sub_category: t.sub_category, merchant: t.merchant, note: t.note,
      }))

    // --- Highest/Lowest Expense Month ---
    const monthExpenseMap: Record<string, number> = {}
    for (const t of expenses) {
      const key = format(t.date, 'yyyy-MM')
      monthExpenseMap[key] = (monthExpenseMap[key] || 0) + t.amount
    }
    const monthEntries = Object.entries(monthExpenseMap)
      .map(([month, amount]) => ({ month, amount: round(amount) }))
      .sort((a, b) => b.amount - a.amount)
    const highestExpenseMonth = monthEntries[0] ?? null
    const lowestExpenseMonth  = monthEntries[monthEntries.length - 1] ?? null

    // --- Weekend vs Weekday ---
    const weekendDows = new Set([0, 6])
    const weekdayDows = new Set([1, 2, 3, 4, 5])
    const weekendDateSet = new Set<string>()
    const weekdayDateSet = new Set<string>()
    let weekendTotal = 0
    let weekdayTotal = 0
    for (const t of expenses) {
      const dow = t.date.getUTCDay(); const dateStr = format(t.date, 'yyyy-MM-dd')
      if (weekendDows.has(dow)) { weekendTotal += t.amount; weekendDateSet.add(dateStr) }
      else if (weekdayDows.has(dow)) { weekdayTotal += t.amount; weekdayDateSet.add(dateStr) }
    }
    const weekendAvgDaily = round(weekendDateSet.size > 0 ? weekendTotal / weekendDateSet.size : 0)
    const weekdayAvgDaily = round(weekdayDateSet.size > 0 ? weekdayTotal / weekdayDateSet.size : 0)

    return NextResponse.json({
      totalMonths, totalTransactions, allTimeExpense, allTimeIncome, avgMonthlyExpense,
      currentMonthExpense, currentMonthIncome,
      savingsRateTrend,
      topMerchantsAllTime, topMerchantsRecent,
      spendingByDayOfWeek,
      topCategoriesAllTime, topCategoriesRecent,
      recentBiggest,
      highestExpenseMonth, lowestExpenseMonth,
      weekendAvgDaily, weekdayAvgDaily,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch insights data' }, { status: 500 })
  }
}
