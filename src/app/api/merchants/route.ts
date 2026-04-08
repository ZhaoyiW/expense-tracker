import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rows = await prisma.transaction.findMany({
      where: { merchant: { not: '' } },
      select: { merchant: true },
      distinct: ['merchant'],
      orderBy: { merchant: 'asc' },
    })
    return NextResponse.json({ merchants: rows.map((r) => r.merchant) })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ merchants: [] })
  }
}
