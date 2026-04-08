'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { TransactionTable } from '@/components/dashboard/TransactionTable'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { Transaction } from '@/types'
import { CATEGORY_OPTIONS, TYPES } from '@/lib/constants'

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

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // All categories across all types, deduplicated
  const allCategories = [...new Set(
    Object.values(CATEGORY_OPTIONS).flatMap((opts) => Object.keys(opts))
  )]

  // Sub-categories: scoped to selected category if set, otherwise all
  const allSubCategories = filterCategory
    ? [...new Set(Object.values(CATEGORY_OPTIONS).flatMap((opts) => opts[filterCategory] ?? []))]
    : [...new Set(Object.values(CATEGORY_OPTIONS).flatMap((opts) => Object.values(opts).flat()))]

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-[1400px]">
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

      {/* Filters */}
      <div className="bg-mo-card rounded-3xl border border-mo-border shadow-soft p-4 space-y-3">
        {/* Row 1: Month selector + transaction count */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-mo-muted">Month</label>
            <MonthSelector value={selectedMonth} onChange={(m) => { setSelectedMonth(m); setPage(1) }} allowAllTime />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-mo-muted">{total} transactions</span>
            <button
              onClick={() => { setSelectedMonth(format(new Date(), 'yyyy-MM')); setFilterType(''); setFilterCategory(''); setFilterSubCategory(''); setPage(1) }}
              className="px-3 py-2 text-sm text-mo-muted hover:text-mo-text border border-mo-border rounded-2xl hover:bg-mo-bg"
            >
              Clear
            </button>
          </div>
        </div>
        {/* Row 2: Three filter selects in a responsive grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-mo-muted">Type</label>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
              className="px-2 py-2 rounded-2xl border border-mo-border bg-mo-bg text-mo-text text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            >
              <option value="">All</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-mo-muted">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}
              className="px-2 py-2 rounded-2xl border border-mo-border bg-mo-bg text-mo-text text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            >
              <option value="">All</option>
              {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-mo-muted">Sub-category</label>
            <select
              value={filterSubCategory}
              onChange={(e) => { setFilterSubCategory(e.target.value); setPage(1) }}
              className="px-2 py-2 rounded-2xl border border-mo-border bg-mo-bg text-mo-text text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
            >
              <option value="">All</option>
              {allSubCategories.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

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

      {/* Add Form Modal */}
      {showForm && (
        <TransactionForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Edit Form Modal */}
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
        className="fixed bottom-20 right-4 z-30 md:hidden w-14 h-14 rounded-full bg-brand text-white shadow-fab flex items-center justify-center active:scale-95"
        aria-label="Add transaction"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  )
}
