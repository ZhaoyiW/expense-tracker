# Expense Tracker

A personal expense tracking web application built with Next.js 14, TypeScript, Tailwind CSS, PostgreSQL (Neon), Prisma, and Recharts.

## Features

- Monthly dashboard with summary cards and interactive charts
- Cross-filtering by clicking chart elements
- Transaction management (add, edit, delete)
- CSV import with duplicate detection
- Year-to-date review with monthly trends and category breakdowns

## Setup

### 1. Install dependencies

```bash
cd expense-tracker
npm install
```

### 2. Configure Neon database connection

Create/update `.env` with your Neon URLs:

```env
DATABASE_URL="postgresql://<user>:<password>@<pooled-host>/<db>?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://<user>:<password>@<direct-host>/<db>?sslmode=require&channel_binding=require"
```

- Use the pooled host for `DATABASE_URL` (contains `-pooler`)
- Use the direct host for `DIRECT_URL` (no `-pooler`)

### 3. Initialize the database

```bash
npx prisma db push
npm run db:seed
```

### 4. Start the development server

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000)

### 5. Import your CSV data

1. Navigate to [http://localhost:3000/import](http://localhost:3000/import)
2. Drag and drop your CSV file or click to browse
3. Preview the first few rows to confirm format
4. Click "Import CSV" to import

### CSV Format

| Column | Format | Example |
|--------|--------|---------|
| date | M/D/YY | 1/15/25 |
| type | Expense \| Income | Expense |
| category | see constants | Food |
| sub_category | see constants | Grocery |
| amount | $1,234.56 | $67.12 |
| merchant | text | Safeway |
| payment_method | USD Account \| RMB Account | USD Account |
| note | text (optional) | |

## Database Management

```bash
# Push schema changes
npm run db:push

# Re-seed options data
npm run db:seed

# Open Prisma Studio (visual DB editor)
npm run db:studio
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon Postgres via Prisma ORM
- **Charts**: Recharts
- **Date utilities**: date-fns
- **CSV parsing**: PapaParse
