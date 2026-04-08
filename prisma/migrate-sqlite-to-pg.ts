import Database from 'better-sqlite3'
import { PrismaClient } from '@prisma/client'
import path from 'path'

const sqlite = new Database(path.join(__dirname, 'dev.db'), { readonly: true })
const prisma = new PrismaClient()

async function main() {
  // --- CategoryOption ---
  const categoryOptions = sqlite.prepare('SELECT * FROM CategoryOption').all() as any[]
  console.log(`Migrating ${categoryOptions.length} category options...`)
  if (categoryOptions.length > 0) {
    await prisma.categoryOption.createMany({
      data: categoryOptions.map(({ type, category, sub_category }) => ({
        type, category, sub_category,
      })),
      skipDuplicates: true,
    })
  }

  // --- PaymentMethod ---
  const paymentMethods = sqlite.prepare('SELECT * FROM PaymentMethod').all() as any[]
  console.log(`Migrating ${paymentMethods.length} payment methods...`)
  if (paymentMethods.length > 0) {
    await prisma.paymentMethod.createMany({
      data: paymentMethods.map(({ name }) => ({ name })),
      skipDuplicates: true,
    })
  }

  // --- Transaction ---
  const transactions = sqlite.prepare('SELECT * FROM "Transaction"').all() as any[]
  console.log(`Migrating ${transactions.length} transactions...`)
  if (transactions.length > 0) {
    await prisma.transaction.createMany({
      data: transactions.map((t) => ({
        date:           new Date(t.date),
        amount:         t.amount,
        type:           t.type,
        category:       t.category,
        sub_category:   t.sub_category,
        merchant:       t.merchant,
        payment_method: t.payment_method,
        note:           t.note,
        created_at:     new Date(t.created_at),
        updated_at:     new Date(t.updated_at),
      })),
      skipDuplicates: true,
    })
  }

  // --- InvestmentTransaction ---
  const investments = sqlite.prepare('SELECT * FROM InvestmentTransaction').all() as any[]
  console.log(`Migrating ${investments.length} investment transactions...`)
  if (investments.length > 0) {
    await prisma.investmentTransaction.createMany({
      data: investments.map((t) => ({
        date:        new Date(t.date),
        amount:      t.amount,
        type:        t.type,
        contributor: t.contributor,
        note:        t.note,
        created_at:  new Date(t.created_at),
        updated_at:  new Date(t.updated_at),
      })),
      skipDuplicates: true,
    })
  }

  console.log('Migration complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => {
    sqlite.close()
    await prisma.$disconnect()
  })
