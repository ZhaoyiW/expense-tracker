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
  window: number          // ±days for fuzzy matching (0 = exact match required)
  occurrences: number
  label: string           // human-readable
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

function monthlyLabel(day: number, fuzzy: boolean): string {
  if (!fuzzy) return `${ORDINALS[day] ?? `${day}th`} of every month`
  if (day <= 4) return 'start of every month'
  if (day >= 27) return 'end of every month'
  if (day >= 13 && day <= 17) return 'mid-month'
  return `around the ${ORDINALS[day] ?? `${day}th`} of every month`
}

// True if ≥80% of amounts are within the given tolerance of the median
function amountsConsistent(amounts: number[], tolerance = 0.10): boolean {
  const med = median(amounts)
  if (med === 0) return false
  const consistent = amounts.filter((a) => Math.abs(a - med) / med <= tolerance).length
  return consistent / amounts.length >= 0.8
}

// Find best center day and coverage. Detection uses ±3 to find the cluster;
// reported window is ±2 for fuzzy matches (5-day range), 0 for exact matches.
function bestCluster(days: number[]): { day: number; coverage: number; window: number } {
  const unique = [...new Set(days)]
  let bestDay = 0, bestCount = 0
  for (const center of unique) {
    const count = days.filter((d) => Math.abs(d - center) <= 3).length
    if (count > bestCount) { bestCount = count; bestDay = center }
  }
  const coverage = bestCount / days.length
  const exactCount = days.filter((d) => d === bestDay).length
  const win = exactCount / days.length >= 0.6 ? 0 : 2
  return { day: bestDay, coverage, window: win }
}

export async function GET() {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: sixMonthsAgo } },
      orderBy: { date: 'asc' },
      select: { type: true, category: true, sub_category: true, merchant: true, payment_method: true, amount: true, date: true },
    })

    // Group by (type, category, sub_category, merchant) — payment_method excluded
    // so subscriptions that switch billing currency are still recognised
    const groups = new Map<string, { amounts: number[]; dates: Date[]; paymentMethods: string[] }>()
    for (const t of transactions) {
      const key = `${t.type}|${t.category}|${t.sub_category}|${t.merchant}`
      if (!groups.has(key)) groups.set(key, { amounts: [], dates: [], paymentMethods: [] })
      const g = groups.get(key)!
      g.amounts.push(t.amount)
      g.dates.push(t.date)
      g.paymentMethods.push(t.payment_method)
    }

    const patterns: RecurringPattern[] = []

    const EXCLUDED_CATEGORIES = new Set(['Food', 'Shopping', 'Entertainment'])

    for (const [key, { amounts, dates, paymentMethods }] of groups) {
      const [type, category, sub_category, merchant] = key.split('|')
      // Use the most recent payment_method for pre-filling the form
      const payment_method = paymentMethods[paymentMethods.length - 1]

      if (EXCLUDED_CATEGORIES.has(category)) continue

      // Subscriptions are reliably recurring — require fewer occurrences and lower coverage
      const isSubscription = category === 'Subscriptions & Services'
      const minOccurrences = isSubscription ? 2 : 3
      const minCoverage = isSubscription ? 0.5 : 0.6

      if (dates.length < minOccurrences) continue
      // Subscriptions allow 30% price tolerance (price changes are normal); others 10%
      if (!amountsConsistent(amounts, isSubscription ? 0.30 : 0.10)) continue

      const med = Math.round(median(amounts) * 100) / 100
      const allDays = dates.map((d) => d.getDate())

      // Try single-cluster detection first
      const single = bestCluster(allDays)
      if (single.coverage >= minCoverage) {
        // Subscriptions get at least ±1 day window so the prompt appears around billing day
        const win = isSubscription ? Math.max(single.window, 1) : single.window
        patterns.push({
          merchant, type, category, sub_category, payment_method,
          amount: med,
          pattern: 'day_of_month',
          day: single.day,
          window: win,
          occurrences: dates.length,
          label: monthlyLabel(single.day, win > 0),
        })
        continue
      }

      // Bi-monthly detection: split into first half (1–15) and second half (16–31)
      // Each half needs at least 2 entries and ≥60% coverage within its own cluster
      const firstHalfDays = allDays.filter((d) => d <= 15)
      const secondHalfDays = allDays.filter((d) => d > 15)
      if (firstHalfDays.length >= 2 && secondHalfDays.length >= 2) {
        const c1 = bestCluster(firstHalfDays)
        const c2 = bestCluster(secondHalfDays)
        if (c1.coverage >= minCoverage && c2.coverage >= minCoverage) {
          const halfAmounts1 = amounts.filter((_, i) => allDays[i] <= 15)
          const halfAmounts2 = amounts.filter((_, i) => allDays[i] > 15)
          for (const { cluster, halfAmounts } of [
            { cluster: c1, halfAmounts: halfAmounts1 },
            { cluster: c2, halfAmounts: halfAmounts2 },
          ]) {
            const win = isSubscription ? Math.max(cluster.window, 1) : cluster.window
            patterns.push({
              merchant, type, category, sub_category, payment_method,
              amount: Math.round(median(halfAmounts) * 100) / 100,
              pattern: 'day_of_month',
              day: cluster.day,
              window: win,
              occurrences: halfAmounts.length,
              label: monthlyLabel(cluster.day, win > 0),
            })
          }
          continue
        }
      }

      // Day of week frequency (require ≥4 occurrences for weekly patterns)
      if (dates.length < 4) continue
      const dowCount: Record<number, number> = {}
      for (const d of dates) dowCount[d.getDay()] = (dowCount[d.getDay()] || 0) + 1
      const topDow = Object.entries(dowCount).sort((a, b) => +b[1] - +a[1])[0]
      if (topDow && +topDow[1] / dates.length >= minCoverage) {
        const day = parseInt(topDow[0])
        patterns.push({
          merchant, type, category, sub_category, payment_method,
          amount: med,
          pattern: 'day_of_week',
          day,
          window: 0,
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
