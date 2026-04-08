import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export interface RecurringPattern {
  merchant: string
  type: string
  category: string
  sub_category: string
  payment_method: string
  amount: number          // median amount across occurrences
  pattern: 'day_of_month' | 'day_of_week'
  day: number             // 1–31 for day_of_month, 0–6 (Sun–Sat) for day_of_week
  occurrences: number
  label: string           // human-readable, e.g. "1st of every month"
}

const ORDINALS: Record<number, string> = {
  1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th',
  6: '6th', 7: '7th', 8: '8th', 9: '9th', 10: '10th',
  11: '11th', 12: '12th', 13: '13th', 14: '14th', 15: '15th',
  16: '16th', 17: '17th', 18: '18th', 19: '19th', 20: '20th',
  21: '21st', 22: '22nd', 23: '23rd', 24: '24th', 25: '25th',
  26: '26th', 27: '27th', 28: '28th', 29: '29th', 30: '30th', 31: '31st',
}
const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'asc' },
      select: { type: true, category: true, sub_category: true, merchant: true, payment_method: true, amount: true, date: true },
    })

    // Group by (type, category, sub_category, merchant, payment_method)
    const groups = new Map<string, { amounts: number[]; dates: Date[] }>()
    for (const t of transactions) {
      const key = `${t.type}|${t.category}|${t.sub_category}|${t.merchant}|${t.payment_method}`
      if (!groups.has(key)) groups.set(key, { amounts: [], dates: [] })
      const g = groups.get(key)!
      g.amounts.push(t.amount)
      g.dates.push(t.date)
    }

    const patterns: RecurringPattern[] = []

    for (const [key, { amounts, dates }] of groups) {
      if (dates.length < 3) continue

      const [type, category, sub_category, merchant, payment_method] = key.split('|')
      const med = Math.round(median(amounts) * 100) / 100

      // Day of month frequency
      const domCount: Record<number, number> = {}
      for (const d of dates) domCount[d.getDate()] = (domCount[d.getDate()] || 0) + 1
      const topDom = Object.entries(domCount).sort((a, b) => +b[1] - +a[1])[0]
      if (topDom && +topDom[1] / dates.length >= 0.6) {
        const day = parseInt(topDom[0])
        patterns.push({
          merchant, type, category, sub_category, payment_method,
          amount: med,
          pattern: 'day_of_month',
          day,
          occurrences: dates.length,
          label: `${ORDINALS[day] ?? `${day}th`} of every month`,
        })
        continue   // don't double-report as day_of_week too
      }

      // Day of week frequency (require ≥4 occurrences for weekly patterns)
      if (dates.length < 4) continue
      const dowCount: Record<number, number> = {}
      for (const d of dates) dowCount[d.getDay()] = (dowCount[d.getDay()] || 0) + 1
      const topDow = Object.entries(dowCount).sort((a, b) => +b[1] - +a[1])[0]
      if (topDow && +topDow[1] / dates.length >= 0.6) {
        const day = parseInt(topDow[0])
        patterns.push({
          merchant, type, category, sub_category, payment_method,
          amount: med,
          pattern: 'day_of_week',
          day,
          occurrences: dates.length,
          label: `every ${DOW_NAMES[day]}`,
        })
      }
    }

    return NextResponse.json(patterns)
  } catch (error) {
    console.error(error)
    return NextResponse.json([], { status: 500 })
  }
}
