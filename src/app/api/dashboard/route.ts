import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, parseISO, subMonths, format, getDaysInMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || format(new Date(), 'yyyy-MM')
    const filterType = searchParams.get('type')
    const filterCategory = searchParams.get('category')
    const filterMerchant = searchParams.get('merchant')
    const filterSubCategory = searchParams.get('sub_category')
    const filterPaymentMethod = searchParams.get('payment_method')
    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')

    const monthDate = parseISO(`${month}-01`)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    const prevMonthDate = subMonths(monthDate, 1)
    const prevMonthStart = startOfMonth(prevMonthDate)
    const prevMonthEnd = endOfMonth(prevMonthDate)

    // Build filter — all active filters apply to every aggregation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txFilter: any = {
      date: {
        gte: dateStart ? new Date(dateStart) : monthStart,
        lte: dateEnd ? new Date(dateEnd) : monthEnd,
      },
    }
    if (filterType) txFilter.type = filterType
    if (filterCategory) txFilter.category = filterCategory
    if (filterMerchant) txFilter.merchant = filterMerchant
    if (filterSubCategory) txFilter.sub_category = filterSubCategory
    if (filterPaymentMethod) txFilter.payment_method = filterPaymentMethod

    // Fetch filtered transactions (used for all aggregations + table)
    // Prev month always unfiltered (for comparison baseline)
    const [filteredAsc, prevMonthTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: txFilter,
        orderBy: { date: 'asc' },
      }),
      prisma.transaction.findMany({
        where: { date: { gte: prevMonthStart, lte: prevMonthEnd } },
      }),
    ])

    // Table uses desc order
    const tableTransactions = [...filteredAsc].reverse()

    // Summary totals
    const income = filteredAsc.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0)
    const expense = filteredAsc.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0)
    const prevIncome = prevMonthTransactions.filter((t) => t.type === 'Income').reduce((s, t) => s + t.amount, 0)
    const prevExpense = prevMonthTransactions.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0)
    const usdExpense = filteredAsc.filter((t) => t.type === 'Expense' && t.payment_method === 'USD Account').reduce((s, t) => s + t.amount, 0)
    const rmbExpense = filteredAsc.filter((t) => t.type === 'Expense' && t.payment_method === 'RMB Account').reduce((s, t) => s + t.amount, 0)

    // Daily cumulative expenses — one entry per day of the selected month
    const dailyMap: Record<string, number> = {}
    for (const t of filteredAsc.filter((t) => t.type === 'Expense')) {
      const key = format(t.date, 'yyyy-MM-dd')
      dailyMap[key] = (dailyMap[key] || 0) + t.amount
    }
    const today = new Date()
    const isCurrentMonth =
      monthDate.getFullYear() === today.getFullYear() &&
      monthDate.getMonth() === today.getMonth()
    const daysInMonth = getDaysInMonth(monthDate)
    const daysInPrevMonth = getDaysInMonth(prevMonthDate)
    const lastDay = isCurrentMonth ? today.getDate() : daysInMonth
    let cumul = 0
    const dailyCumulative = []
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${month}-${String(d).padStart(2, '0')}`
      if (dailyMap[dateStr]) cumul += dailyMap[dateStr]
      dailyCumulative.push({ date: dateStr, cumulative: Math.round(cumul * 100) / 100 })
    }

    // Prev month cumulative — one entry per day of the prev month
    const prevDayMap: Record<number, number> = {}
    for (const t of prevMonthTransactions.filter((t) => t.type === 'Expense')) {
      const d = parseInt(format(t.date, 'd'), 10)   // local day, consistent with current-month logic
      prevDayMap[d] = (prevDayMap[d] || 0) + t.amount
    }
    let prevCumul = 0
    const prevDailyCumulative = []
    for (let d = 1; d <= daysInPrevMonth; d++) {
      if (prevDayMap[d]) prevCumul += prevDayMap[d]
      prevDailyCumulative.push({ day: d, cumulative: Math.round(prevCumul * 100) / 100 })
    }

    // Category breakdown
    const expByCatMap: Record<string, number> = {}
    const incByCatMap: Record<string, number> = {}
    const expBySubMap: Record<string, number> = {}
    const incBySubMap: Record<string, number> = {}
    const expMerchMap: Record<string, number> = {}
    const incMerchMap: Record<string, number> = {}

    for (const t of filteredAsc) {
      if (t.type === 'Expense') {
        expByCatMap[t.category] = (expByCatMap[t.category] || 0) + t.amount
        if (t.sub_category) expBySubMap[t.sub_category] = (expBySubMap[t.sub_category] || 0) + t.amount
        if (t.merchant) expMerchMap[t.merchant] = (expMerchMap[t.merchant] || 0) + t.amount
      } else if (t.type === 'Income') {
        incByCatMap[t.category] = (incByCatMap[t.category] || 0) + t.amount
        if (t.sub_category) incBySubMap[t.sub_category] = (incBySubMap[t.sub_category] || 0) + t.amount
        if (t.merchant) incMerchMap[t.merchant] = (incMerchMap[t.merchant] || 0) + t.amount
      }
    }

    const round = (n: number) => Math.round(n * 100) / 100

    const expenseByCategory = Object.entries(expByCatMap)
      .map(([category, amount]) => ({ category, amount: round(amount) }))
      .sort((a, b) => b.amount - a.amount).slice(0, 10)

    const incomeByCategory = Object.entries(incByCatMap)
      .map(([category, amount]) => ({ category, amount: round(amount) }))
      .sort((a, b) => b.amount - a.amount).slice(0, 10)

    const expenseBySubCategory = Object.entries(expBySubMap)
      .map(([sub_category, amount]) => ({ sub_category, amount: round(amount) }))
      .sort((a, b) => b.amount - a.amount).slice(0, 10)

    const incomeBySubCategory = Object.entries(incBySubMap)
      .map(([sub_category, amount]) => ({ sub_category, amount: round(amount) }))
      .sort((a, b) => b.amount - a.amount).slice(0, 10)

    const expenseMerchants = Object.entries(expMerchMap)
      .map(([merchant, amount]) => ({ merchant, amount: round(amount) }))
      .sort((a, b) => b.amount - a.amount).slice(0, 10)

    const incomeMerchants = Object.entries(incMerchMap)
      .map(([merchant, amount]) => ({ merchant, amount: round(amount) }))
      .sort((a, b) => b.amount - a.amount).slice(0, 10)

    return NextResponse.json({
      income: round(income),
      expense: round(expense),
      prevIncome: round(prevIncome),
      prevExpense: round(prevExpense),
      usdExpense: round(usdExpense),
      rmbExpense: round(rmbExpense),
      daysInMonth,
      dailyCumulative,
      prevDailyCumulative,
      expenseByCategory,
      incomeByCategory,
      expenseBySubCategory,
      incomeBySubCategory,
      expenseMerchants,
      incomeMerchants,
      transactions: tableTransactions,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
