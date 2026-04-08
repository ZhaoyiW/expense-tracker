import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr.slice(0, 10) + 'T12:00:00.000Z')
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json()
    const { date, amount, type, category, sub_category, merchant, payment_method, note } = body

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(date !== undefined && { date: parseLocalDate(date) }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(type !== undefined && { type }),
        ...(category !== undefined && { category }),
        ...(sub_category !== undefined && { sub_category }),
        ...(merchant !== undefined && { merchant }),
        ...(payment_method !== undefined && { payment_method }),
        ...(note !== undefined && { note }),
      },
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    await prisma.transaction.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
