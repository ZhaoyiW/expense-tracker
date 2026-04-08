import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, endOfMonth, getMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || format(new Date(), 'yyyy')

    const today = new Date()
    const currentYearStr = format(today, 'yyyy')
    const isCurrentYear = year === currentYearStr

    // Current year: compare Jan–current month. Past years: compare full year (Jan–Dec).
    const ytdEndMonth = isCurrentYear ? getMonth(today) : 11 // 0-indexed
    const prevYear = String(parseInt(year) - 1)

    const ytdStart = new Date(parseInt(year), 0, 1)
    const ytdEnd = endOfMonth(new Date(parseInt(year), ytdEndMonth, 1))
    const prevYtdStart = new Date(parseInt(prevYear), 0, 1)
    const prevYtdEnd = endOfMonth(new Date(parseInt(prevYear), ytdEndMonth, 1))

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const ytdLabel = ytdEndMonth === 11
      ? `Full Year ${year}`
      : `Jan–${monthNames[ytdEndMonth]} ${year}`
    const prevYtdLabel = ytdEndMonth === 11
      ? `Full Year ${prevYear}`
      : `Jan–${monthNames[ytdEndMonth]} ${prevYear}`

    const [transactions, prevTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: { date: { gte: ytdStart, lte: ytdEnd } },
        orderBy: { date: 'desc' },
      }),
      prisma.transaction.findMany({
        where: { date: { gte: prevYtdStart, lte: prevYtdEnd } },
      }),
    ])

    let totalIncome = 0
    let totalExpense = 0
    const monthlyMap: Record<string, { income: number; expense: number }> = {}
    const expenseByCategoryMap: Record<string, number> = {}
    const incomeByCategoryMap: Record<string, number> = {}

    for (const t of transactions) {
      const monthKey = format(t.date, 'yyyy-MM')
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { income: 0, expense: 0 }

      if (t.type === 'Income') {
        totalIncome += t.amount
        monthlyMap[monthKey].income += t.amount
        incomeByCategoryMap[t.category] = (incomeByCategoryMap[t.category] || 0) + t.amount
      } else if (t.type === 'Expense') {
        totalExpense += t.amount
        monthlyMap[monthKey].expense += t.amount
        expenseByCategoryMap[t.category] = (expenseByCategoryMap[t.category] || 0) + t.amount
      }
    }

    let prevYtdIncome = 0
    let prevYtdExpense = 0
    for (const t of prevTransactions) {
      if (t.type === 'Income') prevYtdIncome += t.amount
      else if (t.type === 'Expense') prevYtdExpense += t.amount
    }

    const monthlyTrends = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: Math.round(data.income * 100) / 100,
        expense: Math.round(data.expense * 100) / 100,
      }))

    const expenseByCategory = Object.entries(expenseByCategoryMap)
      .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)

    const incomeByCategory = Object.entries(incomeByCategoryMap)
      .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)

    return NextResponse.json({
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      prevYtdIncome: Math.round(prevYtdIncome * 100) / 100,
      prevYtdExpense: Math.round(prevYtdExpense * 100) / 100,
      ytdLabel,
      prevYtdLabel,
      monthlyTrends,
      expenseByCategory,
      incomeByCategory,
      transactions,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch YTD data' }, { status: 500 })
  }
}
