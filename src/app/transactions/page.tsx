'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Plus, SlidersHorizontal, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { Transaction } from '@/types'
import { CATEGORY_OPTIONS, TYPES } from '@/lib/constants'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 50

  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSubCategory, setFilterSubCategory] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(false)
  const [showFilterSheet, setShowFilterSheet] = useState(false)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedMonth && selectedMonth !== 'all') params.set('month', selectedMonth)
      if (filterType) params.set('type', filterType)
      if (filterCategory) params.set('category', filterCategory)
      if (filterSubCategory) params.set('sub_category', filterSubCategory)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))

      const res = await fetch(`/api/transactions?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTransactions(data.data)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, filterType, filterCategory, filterSubCategory, page])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleAdd = async (data: Partial<Transaction>) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create')
    setShowForm(false)
    fetchTransactions()
  }

  const handleEdit = async (data: Partial<Transaction>) => {
    if (!editingTransaction) return
    const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to update')
    setEditingTransaction(null)
    fetchTransactions()
  }

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete')
    fetchTransactions()
  }

  const clearFilters = () => {
    setSelectedMonth(format(new Date(), 'yyyy-MM'))
    setFilterType('')
    setFilterCategory('')
    setFilterSubCategory('')
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const allCategories = [...new Set(
    Object.values(CATEGORY_OPTIONS).flatMap((opts) => Object.keys(opts))
  )]

  const allSubCategories = filterCategory
    ? [...new Set(Object.values(CATEGORY_OPTIONS).flatMap((opts) => opts[filterCategory] ?? []))]
    : [...new Set(Object.values(CATEGORY_OPTIONS).flatMap((opts) => Object.values(opts).flat()))]

  const activeFilterCount = [filterType, filterCategory, filterSubCategory].filter(Boolean).length

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mo-text">Transactions</h1>
          <p className="text-sm text-mo-muted mt-0.5">Manage all your transactions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-dark shadow-soft transition-colors"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-mo-card rounded-3xl border border-mo-border shadow-soft p-3.5 flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-mo-muted mb-1 block">Month</label>
          <MonthSelector value={selectedMonth} onChange={(m) => { setSelectedMonth(m); setPage(1) }} allowAllTime />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-mo-muted hidden sm:block">{total} transactions</span>

          {/* Filter button */}
          <button
            onClick={() => setShowFilterSheet(true)}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-mo-border bg-mo-bg text-mo-text text-sm hover:bg-mo-card active:scale-95 transition-all"
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="p-2 rounded-2xl border border-mo-border text-mo-muted hover:text-mo-text hover:bg-mo-bg active:scale-95 transition-all"
              aria-label="Clear filters"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-subtle text-brand-dark text-xs font-medium">
              {filterType}
              <button onClick={() => setFilterType('')}><X size={10} /></button>
            </span>
          )}
          {filterCategory && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-subtle text-brand-dark text-xs font-medium">
              {filterCategory}
              <button onClick={() => setFilterCategory('')}><X size={10} /></button>
            </span>
          )}
          {filterSubCategory && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-subtle text-brand-dark text-xs font-medium">
              {filterSubCategory}
              <button onClick={() => setFilterSubCategory('')}><X size={10} /></button>
            </span>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="h-48 flex items-center justify-center text-mo-muted text-sm animate-pulse">Loading...</div>
      ) : (
        <TransactionTable
          transactions={transactions}
          onEdit={(t) => setEditingTransaction(t)}
          onDelete={handleDelete}
          showActions
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-2xl border border-mo-border hover:bg-mo-bg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-mo-muted">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-2xl border border-mo-border hover:bg-mo-bg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <TransactionForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      )}
      {editingTransaction && (
        <TransactionForm
          initial={editingTransaction}
          onSubmit={handleEdit}
          onCancel={() => setEditingTransaction(null)}
        />
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 z-30 md:hidden w-14 h-14 rounded-full bg-brand text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Add transaction"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* Filter Bottom Sheet */}
      <AnimatePresence>
        {showFilterSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterSheet(false)}
            />
            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-mo-card rounded-t-3xl p-6 pb-10 space-y-5 shadow-xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-mo-text">Filters</h2>
                <button
                  onClick={() => setShowFilterSheet(false)}
                  className="p-1.5 rounded-full text-mo-muted hover:text-mo-text hover:bg-mo-bg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-mo-muted mb-1.5 block">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['', ...TYPES].map((t) => (
                      <button
                        key={t || 'all'}
                        onClick={() => { setFilterType(t); setPage(1) }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          filterType === t
                            ? 'bg-brand text-white border-brand'
                            : 'border-mo-border text-mo-text bg-mo-bg hover:bg-mo-card'
                        }`}
                      >
                        {t || 'All'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-mo-muted mb-1.5 block">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setFilterSubCategory(''); setPage(1) }}
                    className="w-full px-3 py-2.5 rounded-2xl border border-mo-border bg-mo-bg text-mo-text text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  >
                    <option value="">All categories</option>
                    {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-mo-muted mb-1.5 block">Sub-category</label>
                  <select
                    value={filterSubCategory}
                    onChange={(e) => { setFilterSubCategory(e.target.value); setPage(1) }}
                    className="w-full px-3 py-2.5 rounded-2xl border border-mo-border bg-mo-bg text-mo-text text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  >
                    <option value="">All sub-categories</option>
                    {allSubCategories.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setFilterType(''); setFilterCategory(''); setFilterSubCategory(''); setPage(1) }}
                  className="flex-1 py-2.5 rounded-2xl border border-mo-border text-mo-text text-sm font-medium hover:bg-mo-bg"
                >
                  Clear all
                </button>
                <button
                  onClick={() => setShowFilterSheet(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-brand text-white text-sm font-medium hover:bg-brand-dark"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
