import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { date, amount, type, contributor, note } = await req.json()
    if (!date || !amount || !type || !contributor) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const tx = await prisma.investmentTransaction.create({
      data: {
        date: new Date(date + 'T12:00:00.000Z'),
        amount: parseFloat(amount),
        type,
        contributor,
        note: note ?? '',
      },
    })
    return NextResponse.json({ id: tx.id })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

const round = (n: number) => Math.round(n * 100) / 100

export async function GET() {
  try {
    const txs = await prisma.investmentTransaction.findMany({
      orderBy: { date: 'asc' },
    })

    // Running balance over time
    let balance = 0
    const balanceHistory = txs.map((t) => {
      balance += t.type === 'deposit' ? t.amount : -t.amount
      return {
        date: format(t.date, 'yyyy-MM-dd'),
        label: format(t.date, 'MMM d, yyyy'),
        balance: round(balance),
        type: t.type,
        amount: t.amount,
        contributor: t.contributor,
      }
    })

    // Summary totals
    const totalDeposited = round(txs.filter((t) => t.type === 'deposit').reduce((s, t) => s + t.amount, 0))
    const totalWithdrawn  = round(txs.filter((t) => t.type === 'withdraw').reduce((s, t) => s + t.amount, 0))
    const netBalance = round(totalDeposited - totalWithdrawn)

    // By contributor
    const contributors: Record<string, { deposited: number; withdrawn: number }> = {}
    for (const t of txs) {
      if (!contributors[t.contributor]) contributors[t.contributor] = { deposited: 0, withdrawn: 0 }
      if (t.type === 'deposit') contributors[t.contributor].deposited += t.amount
      else contributors[t.contributor].withdrawn += t.amount
    }
    const byContributor = Object.entries(contributors).map(([name, v]) => ({
      name,
      deposited: round(v.deposited),
      withdrawn: round(v.withdrawn),
      net: round(v.deposited - v.withdrawn),
    }))

    // All transactions (desc)
    const transactions = [...txs].reverse().map((t) => ({
      id: t.id,
      date: format(t.date, 'yyyy-MM-dd'),
      amount: t.amount,
      type: t.type,
      contributor: t.contributor,
      note: t.note,
    }))

    return NextResponse.json({
      totalDeposited,
      totalWithdrawn,
      netBalance,
      balanceHistory,
      byContributor,
      transactions,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch investment data' }, { status: 500 })
  }
}
