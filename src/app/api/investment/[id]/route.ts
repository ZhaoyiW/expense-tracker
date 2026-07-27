import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const { date, amount, type, contributor, note } = await req.json()
    if (!date || !amount || !type || !contributor) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const tx = await prisma.investmentTransaction.update({
      where: { id },
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
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    await prisma.investmentTransaction.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
