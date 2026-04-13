'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { CumulativeExpenseChart } from '@/components/charts/CumulativeExpenseChart'
import { PaymentMethodChart } from '@/components/charts/IncomeExpenseChart'
import { CategoryRankingChart } from '@/components/charts/CategoryRankingChart'
import { MerchantRankingChart } from '@/components/charts/MerchantRankingChart'
import { SubCategoryRankingChart } from '@/components/charts/SubCategoryRankingChart'
import { DashboardData, DashboardFilters } from '@/types'
import { X } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' as const },
  }),
}

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [filters, setFilters] = useState<DashboardFilters>({})
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ month: selectedMonth })
      if (filters.type) params.set('type', filters.type)
      if (filters.category) params.set('category', filters.category)
      if (filters.merchant) params.set('merchant', filters.merchant)
      if (filters.sub_category) params.set('sub_category', filters.sub_category)
      if (filters.payment_method) params.set('payment_method', filters.payment_method)

      const res = await fetch(`/api/dashboard?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data: DashboardData = await res.json()
      setDashboardData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCategorySelect = (category: string) => {
    setFilters((prev) => ({ ...prev, category: prev.category === category ? undefined : category || undefined }))
  }

  const handleSubCategorySelect = (sub: string) => {
    setFilters((prev) => ({ ...prev, sub_category: prev.sub_category === sub ? undefined : sub || undefined }))
  }

  const handleMerchantSelect = (merchant: string) => {
    setFilters((prev) => ({ ...prev, merchant: prev.merchant === merchant ? undefined : merchant || undefined }))
  }

  const handlePaymentMethodSelect = (method: string) => {
    setFilters((prev) => ({ ...prev, payment_method: prev.payment_method === method ? undefined : method || undefined }))
  }

  const clearFilter = (key: keyof DashboardFilters) => {
    setFilters((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const activeFilters = [
    filters.type && { key: 'type' as const, label: `Type: ${filters.type}` },
    filters.category && { key: 'category' as const, label: `Category: ${filters.category}` },
    filters.sub_category && { key: 'sub_category' as const, label: `Sub: ${filters.sub_category}` },
    filters.merchant && { key: 'merchant' as const, label: `Merchant: ${filters.merchant}` },
    filters.payment_method && { key: 'payment_method' as const, label: `Account: ${filters.payment_method}` },
  ].filter(Boolean) as { key: keyof DashboardFilters; label: string }[]

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mo-text">Dashboard</h1>
          <p className="text-sm text-mo-muted mt-0.5">Your monthly financial overview</p>
        </div>
        <MonthSelector value={selectedMonth} onChange={(m) => { setSelectedMonth(m); setFilters({}) }} />
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-mo-muted">Filters:</span>
          {activeFilters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => clearFilter(key)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-subtle text-brand-dark text-xs font-medium hover:bg-brand-light transition-colors"
            >
              {label}
              <X size={12} />
            </button>
          ))}
          <button
            onClick={() => setFilters({})}
            className="text-xs text-mo-muted hover:text-mo-text ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {loading && !dashboardData ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-mo-muted text-sm animate-pulse">Loading...</div>
        </div>
      ) : dashboardData ? (
        <>
          {/* Row 1: Summary */}
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <SummaryCards
              income={dashboardData.income}
              expense={dashboardData.expense}
              prevIncome={dashboardData.prevIncome}
              prevExpense={dashboardData.prevExpense}
            />
          </motion.div>

          {/* Row 2: Line + Payment charts */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CumulativeExpenseChart
              data={dashboardData.dailyCumulative}
              prevData={dashboardData.prevDailyCumulative}
              daysInMonth={dashboardData.daysInMonth}
            />
            <PaymentMethodChart
              usdExpense={dashboardData.usdExpense}
              rmbExpense={dashboardData.rmbExpense}
              onPaymentMethodSelect={handlePaymentMethodSelect}
              selectedPaymentMethod={filters.payment_method}
            />
          </motion.div>

          {/* Row 3: Category ranking */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <CategoryRankingChart
              expenseByCategory={dashboardData.expenseByCategory}
              incomeByCategory={dashboardData.incomeByCategory}
              onCategorySelect={handleCategorySelect}
              selectedCategory={filters.category}
            />
          </motion.div>

          {/* Row 4: Sub-category ranking */}
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <SubCategoryRankingChart
              expenseBySubCategory={dashboardData.expenseBySubCategory}
              incomeBySubCategory={dashboardData.incomeBySubCategory}
              onSubCategorySelect={handleSubCategorySelect}
              selectedSubCategory={filters.sub_category}
            />
          </motion.div>

          {/* Row 5: Merchant ranking */}
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <MerchantRankingChart
              expenseMerchants={dashboardData.expenseMerchants}
              incomeMerchants={dashboardData.incomeMerchants}
              onMerchantSelect={handleMerchantSelect}
              selectedMerchant={filters.merchant}
            />
          </motion.div>

          {/* Row 6: Recent transactions (10 max) */}
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-mo-text">
                Transactions
                <span className="ml-2 text-sm text-mo-muted font-normal">
                  ({dashboardData.transactions.length})
                </span>
              </h2>
            </div>
            <TransactionTable transactions={dashboardData.transactions} />
          </motion.div>
        </>
      ) : (
        <div className="text-center text-mo-muted py-16">No data available</div>
      )}
    </div>
  )
}
