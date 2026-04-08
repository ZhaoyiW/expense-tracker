import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const rows = [
  { date: '2024-02-22', amount: 20000, type: 'deposit', contributor: 'Mom' },
  { date: '2024-02-23', amount: 50000, type: 'deposit', contributor: 'Mom' },
  { date: '2024-02-26', amount: 35000, type: 'deposit', contributor: 'Mom' },
  { date: '2024-03-11', amount: 2000,  type: 'deposit', contributor: 'Joy' },
  { date: '2024-03-20', amount: 1500,  type: 'deposit', contributor: 'Joy' },
  { date: '2024-04-22', amount: 1500,  type: 'deposit', contributor: 'Joy' },
  { date: '2024-05-15', amount: 1500,  type: 'deposit', contributor: 'Joy' },
  { date: '2024-05-17', amount: 1500,  type: 'deposit', contributor: 'Joy' },
  { date: '2024-07-26', amount: 1500,  type: 'deposit', contributor: 'Joy' },
  { date: '2024-08-13', amount: 40000, type: 'deposit', contributor: 'Mom' },
  { date: '2024-08-19', amount: 2000,  type: 'deposit', contributor: 'Joy' },
  { date: '2024-08-27', amount: 2000,  type: 'deposit', contributor: 'Joy' },
  { date: '2024-09-24', amount: 1500,  type: 'deposit', contributor: 'Joy' },
  { date: '2024-09-29', amount: 49000, type: 'deposit', contributor: 'Mom' },
  { date: '2024-10-28', amount: 4000,  type: 'deposit', contributor: 'Joy' },
  { date: '2024-11-06', amount: 20000, type: 'deposit', contributor: 'Mom' },
  { date: '2024-11-08', amount: 11000, type: 'deposit', contributor: 'Mom' },
  { date: '2024-11-18', amount: 2000,  type: 'deposit', contributor: 'Joy' },
  { date: '2025-03-06', amount: 15,    type: 'deposit', contributor: 'Joy' },
  { date: '2025-03-06', amount: 49985, type: 'deposit', contributor: 'Mom' },
  { date: '2025-04-26', amount: 2000,  type: 'deposit', contributor: 'Joy' },
  { date: '2025-05-05', amount: 5000,  type: 'withdraw', contributor: 'Joy' },
  { date: '2025-05-15', amount: 3000,  type: 'deposit', contributor: 'Joy' },
  { date: '2025-06-30', amount: 4000,  type: 'withdraw', contributor: 'Joy' },
  { date: '2025-07-02', amount: 5000,  type: 'deposit', contributor: 'Joy' },
  { date: '2025-07-07', amount: 5000,  type: 'deposit', contributor: 'Joy' },
  { date: '2025-07-18', amount: 3000,  type: 'deposit', contributor: 'Joy' },
  { date: '2025-07-31', amount: 2000,  type: 'deposit', contributor: 'Joy' },
  { date: '2025-08-15', amount: 5000,  type: 'deposit', contributor: 'Joy' },
  { date: '2025-08-29', amount: 4000,  type: 'deposit', contributor: 'Joy' },
  { date: '2025-09-29', amount: 4500,  type: 'withdraw', contributor: 'Joy' },
  { date: '2025-10-06', amount: 2000,  type: 'deposit', contributor: 'Joy' },
  { date: '2025-11-25', amount: 2500,  type: 'deposit', contributor: 'Joy' },
  { date: '2025-12-10', amount: 1000,  type: 'deposit', contributor: 'Joy' },
  { date: '2025-12-19', amount: 50000, type: 'deposit', contributor: 'Mom' },
  { date: '2025-12-19', amount: 3500,  type: 'deposit', contributor: 'Joy' },
  { date: '2025-12-31', amount: 3100,  type: 'deposit', contributor: 'Joy' },
  { date: '2026-01-15', amount: 2800,  type: 'deposit', contributor: 'Joy' },
  { date: '2026-01-24', amount: 3000,  type: 'deposit', contributor: 'Joy' },
  { date: '2026-01-30', amount: 2800,  type: 'deposit', contributor: 'Joy' },
  { date: '2026-02-13', amount: 3500,  type: 'deposit', contributor: 'Joy' },
  { date: '2026-02-20', amount: 2000,  type: 'deposit', contributor: 'Joy' },
  { date: '2026-02-27', amount: 2500,  type: 'deposit', contributor: 'Joy' },
  { date: '2026-03-12', amount: 3500,  type: 'deposit', contributor: 'Joy' },
  { date: '2026-03-14', amount: 1500,  type: 'deposit', contributor: 'Joy' },
  { date: '2026-03-31', amount: 3000,  type: 'deposit', contributor: 'Joy' },
]

async function main() {
  // Clear existing data to avoid duplicates on re-run
  await prisma.investmentTransaction.deleteMany()

  await prisma.investmentTransaction.createMany({
    data: rows.map((r) => ({
      date: new Date(r.date + 'T12:00:00.000Z'),
      amount: r.amount,
      type: r.type,
      contributor: r.contributor,
    })),
  })

  console.log(`Seeded ${rows.length} investment transactions.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
