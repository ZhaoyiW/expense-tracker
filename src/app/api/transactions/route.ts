import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'

// Parse a date string (YYYY-MM-DD or ISO) as UTC noon to avoid timezone day-shift
function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr.slice(0, 10) + 'T12:00:00.000Z')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const sub_category = searchParams.get('sub_category')
    const merchant = searchParams.get('merchant')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (month) {
      const date = parseISO(`${month}-01`)
      where.date = {
        gte: startOfMonth(date),
        lte: endOfMonth(date),
      }
    }
    if (type) where.type = type
    if (category) where.category = category
    if (sub_category) where.sub_category = sub_category
    if (merchant) where.merchant = merchant

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, amount, type, category, sub_category, merchant, payment_method, note } = body

    if (!date || amount === undefined || !type || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        date: parseLocalDate(date),
        amount: parseFloat(amount),
        type,
        category,
        sub_category: sub_category || '',
        merchant: merchant || '',
        payment_method: payment_method || '',
        note: note || '',
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
