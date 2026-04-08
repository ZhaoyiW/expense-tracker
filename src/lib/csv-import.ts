import { parse } from 'papaparse'
import { prisma } from './prisma'
import { ImportResult } from '@/types'

export function parseAmount(raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/\$/, '').replace(/,/g, '').trim()
  const val = parseFloat(cleaned)
  if (isNaN(val)) return null
  return val
}

export function parseDate(raw: string): Date | null {
  if (!raw) return null
  // Handle M/D/YY or M/D/YYYY
  const parts = raw.trim().split('/')
  if (parts.length !== 3) return null
  const month = parseInt(parts[0], 10)
  const day = parseInt(parts[1], 10)
  let year = parseInt(parts[2], 10)
  if (isNaN(month) || isNaN(day) || isNaN(year)) return null
  if (year < 100) {
    year += 2000
  }
  const d = new Date(year, month - 1, day)
  if (isNaN(d.getTime())) return null
  return d
}

interface CsvRow {
  date: string
  type: string
  category: string
  sub_category: string
  note: string
  amount: string
  merchant: string
  payment_method: string
  [key: string]: string
}

export async function importCsv(csvText: string): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    invalid: 0,
    duplicates: 0,
    errors: [],
  }

  const parsed = parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  if (parsed.errors.length > 0) {
    result.errors.push(...parsed.errors.map((e) => e.message))
  }

  const rows = parsed.data
  const validRows: {
    date: Date
    amount: number
    type: string
    category: string
    sub_category: string
    merchant: string
    payment_method: string
    note: string
  }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 1-indexed + header

    const date = parseDate(row.date)
    if (!date) {
      result.invalid++
      result.errors.push(`Row ${rowNum}: invalid date "${row.date}"`)
      continue
    }

    const amount = parseAmount(row.amount)
    if (amount === null) {
      result.invalid++
      result.errors.push(`Row ${rowNum}: invalid amount "${row.amount}"`)
      continue
    }

    const type = row.type?.trim()
    if (!type) {
      result.invalid++
      result.errors.push(`Row ${rowNum}: missing type`)
      continue
    }

    validRows.push({
      date,
      amount,
      type,
      category: row.category?.trim() || '',
      sub_category: row.sub_category?.trim() || '',
      merchant: row.merchant?.trim() || '',
      payment_method: row.payment_method?.trim() || '',
      note: row.note?.trim() || '',
    })
  }

  // Check for duplicates in batch
  for (const row of validRows) {
    const startOfDay = new Date(row.date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(row.date)
    endOfDay.setHours(23, 59, 59, 999)

    const existing = await prisma.transaction.findFirst({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        amount: row.amount,
        type: row.type,
        merchant: row.merchant,
      },
    })

    if (existing) {
      result.duplicates++
      continue
    }

    await prisma.transaction.create({ data: row })
    result.imported++
  }

  result.skipped = result.duplicates + result.invalid

  return result
}
