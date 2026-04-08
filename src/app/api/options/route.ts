import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categoryOptions = await prisma.categoryOption.findMany({
      orderBy: [{ type: 'asc' }, { category: 'asc' }, { sub_category: 'asc' }],
    })
    const paymentMethods = await prisma.paymentMethod.findMany({
      orderBy: { name: 'asc' },
    })

    // Group categories
    const grouped: Record<string, Record<string, string[]>> = {}
    for (const opt of categoryOptions) {
      if (!grouped[opt.type]) grouped[opt.type] = {}
      if (!grouped[opt.type][opt.category]) grouped[opt.type][opt.category] = []
      if (opt.sub_category) {
        grouped[opt.type][opt.category].push(opt.sub_category)
      }
    }

    return NextResponse.json({
      categories: grouped,
      paymentMethods: paymentMethods.map((p) => p.name),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 })
  }
}
