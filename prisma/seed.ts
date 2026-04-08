import { PrismaClient } from '@prisma/client'
import { CATEGORY_OPTIONS, PAYMENT_METHODS } from '../src/lib/constants'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding category options and payment methods...')

  for (const [type, categories] of Object.entries(CATEGORY_OPTIONS)) {
    for (const [category, subCategories] of Object.entries(categories)) {
      // Upsert the category itself (no sub_category)
      await prisma.categoryOption.upsert({
        where: {
          type_category_sub_category: {
            type,
            category,
            sub_category: '',
          },
        },
        update: {},
        create: {
          type,
          category,
          sub_category: '',
        },
      })

      // Upsert each sub_category
      for (const sub_category of subCategories) {
        await prisma.categoryOption.upsert({
          where: {
            type_category_sub_category: {
              type,
              category,
              sub_category,
            },
          },
          update: {},
          create: {
            type,
            category,
            sub_category,
          },
        })
      }
    }
  }

  for (const name of PAYMENT_METHODS) {
    await prisma.paymentMethod.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
