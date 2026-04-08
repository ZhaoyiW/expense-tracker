export interface Transaction {
  id: number
  date: string // ISO string
  amount: number
  type: string
  category: string
  sub_category: string
  merchant: string
  payment_method: string
  note: string
  created_at: string
  updated_at: string
}

export interface DashboardFilters {
  type?: string
  category?: string
  sub_category?: string
  merchant?: string
  payment_method?: string
  dateRange?: { start: string; end: string }
}

export interface DailyData {
  date: string
  cumulative: number
}

export interface CategoryAmount {
  category: string
  amount: number
}

export interface SubCategoryAmount {
  sub_category: string
  amount: number
}

export interface MerchantAmount {
  merchant: string
  amount: number
}

export interface DashboardData {
  income: number
  expense: number
  prevIncome: number
  prevExpense: number
  usdExpense: number
  rmbExpense: number
  daysInMonth: number
  dailyCumulative: DailyData[]
  prevDailyCumulative: { day: number; cumulative: number }[]
  expenseByCategory: CategoryAmount[]
  incomeByCategory: CategoryAmount[]
  expenseBySubCategory: SubCategoryAmount[]
  incomeBySubCategory: SubCategoryAmount[]
  expenseMerchants: MerchantAmount[]
  incomeMerchants: MerchantAmount[]
  transactions: Transaction[]
}

export interface ImportResult {
  imported: number
  skipped: number
  invalid: number
  duplicates: number
  errors: string[]
}

export interface CategoryOption {
  id: number
  type: string
  category: string
  sub_category: string
}

export interface MonthlyTrend {
  month: string
  income: number
  expense: number
}

export interface YtdData {
  totalIncome: number
  totalExpense: number
  prevYtdIncome: number
  prevYtdExpense: number
  ytdLabel: string
  prevYtdLabel: string
  monthlyTrends: MonthlyTrend[]
  expenseByCategory: CategoryAmount[]
  incomeByCategory: CategoryAmount[]
  transactions: Transaction[]
}
