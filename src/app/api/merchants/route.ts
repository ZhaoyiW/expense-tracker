import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const subCategory = searchParams.get('sub_category')

    if (category) {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      // Return merchants ranked by frequency for this category/subcategory
      const rows = await prisma.transaction.groupBy({
        by: ['merchant'],
        where: {
          merchant: { not: '' },
          category,
          date: { gte: sixMonthsAgo },
          ...(subCategory ? { sub_category: subCategory } : {}),
        },
        _count: { merchant: true },
        orderBy: { _count: { merchant: 'desc' } },
        take: 6,
      })
      return NextResponse.json({ merchants: rows.map((r) => r.merchant) })
    }

    // No filter — return all distinct merchants for autocomplete
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
