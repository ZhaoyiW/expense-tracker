'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronUp, ChevronDown, ChevronsUpDown, Pencil } from 'lucide-react'
import { Transaction } from '@/types'
import { getCategoryEmoji } from '@/lib/constants'
import clsx from 'clsx'

interface TransactionTableProps {
  transactions: Transaction[]
  onEdit?: (t: Transaction) => void
  onDelete?: (id: number) => void
  showActions?: boolean
}

type SortKey = 'date' | 'amount'
type SortDir = 'asc' | 'desc'

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
}

export function TransactionTable({ transactions, onEdit, onDelete, showActions = false }: TransactionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
    setPage(1)
  }

  const sorted = [...transactions].sort((a, b) => {
    const cmp = sortKey === 'date'
      ? new Date(a.date).getTime() - new Date(b.date).getTime()
      : a.amount - b.amount
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown size={13} className="text-mo-border" />
    return sortDir === 'asc' ? <ChevronUp size={13} className="text-brand" /> : <ChevronDown size={13} className="text-brand" />
  }

  return (
    <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card overflow-hidden">
      {/* Mobile card list — visible below sm */}
      <div className="sm:hidden">
        {paginated.length === 0 && (
          <div className="px-4 py-10 text-center text-mo-muted text-sm">No transactions found</div>
        )}
        {paginated.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 border-b border-mo-border active:bg-mo-bg"
          >
            {/* Left: emoji + category + sub_category + merchant */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-base shrink-0">{getCategoryEmoji(t.category)}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-mo-text truncate">{t.category}</div>
                {t.sub_category && (
                  <div className="text-2xs text-mo-muted truncate">{t.sub_category}</div>
                )}
                {t.merchant && (
                  <div className="text-xs text-mo-muted truncate">{t.merchant}</div>
                )}
              </div>
            </div>

            {/* Right: amount + date */}
            <div className="flex flex-col items-end shrink-0">
              <span className={clsx('font-semibold text-sm', t.type === 'Income' ? 'text-income-dark' : 'text-expense-dark')}>
                {t.type === 'Expense' ? '-' : '+'}{fmt(t.amount)}
              </span>
              <span className="text-2xs text-mo-muted">
                {format(parseISO(typeof t.date === 'string' ? t.date : new Date(t.date).toISOString()), 'MMM d, yyyy')}
              </span>
            </div>

            {/* Edit icon (only when showActions) */}
            {showActions && onEdit && (
              <button
                onClick={() => onEdit(t)}
                className="shrink-0 p-1.5 text-mo-muted hover:text-brand-dark"
                aria-label="Edit"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Table — hidden on mobile, visible sm+ */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mo-border bg-mo-bg">
              <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted cursor-pointer" onClick={() => handleSort('date')}>
                <span className="flex items-center gap-1">Date <SortIcon col="date" /></span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted hidden sm:table-cell">Merchant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted hidden md:table-cell">Payment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted hidden lg:table-cell">Note</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-mo-muted cursor-pointer" onClick={() => handleSort('amount')}>
                <span className="flex items-center justify-end gap-1">Amount <SortIcon col="amount" /></span>
              </th>
              {showActions && <th className="px-4 py-3 text-xs font-medium text-mo-muted" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-mo-border">
            {paginated.length === 0 && (
              <tr>
                <td colSpan={showActions ? 7 : 6} className="px-4 py-10 text-center text-mo-muted text-sm">
                  No transactions found
                </td>
              </tr>
            )}
            {paginated.map((t) => (
              <tr key={t.id} className="hover:bg-mo-bg transition-colors">
                <td className="px-4 py-3 text-mo-muted text-xs whitespace-nowrap">
                  {format(parseISO(typeof t.date === 'string' ? t.date : new Date(t.date).toISOString()), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span>{getCategoryEmoji(t.category)}</span>
                    <div>
                      <div className="text-sm font-medium text-mo-text">{t.category}</div>
                      {t.sub_category && <div className="text-2xs text-mo-muted">{t.sub_category}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-mo-text hidden sm:table-cell">{t.merchant || '—'}</td>
                <td className="px-4 py-3 text-xs text-mo-muted hidden md:table-cell">{t.payment_method}</td>
                <td className="px-4 py-3 text-xs text-mo-muted max-w-[150px] truncate hidden lg:table-cell">{t.note || '—'}</td>
                <td className={clsx('px-4 py-3 text-right font-semibold whitespace-nowrap text-sm', t.type === 'Income' ? 'text-income-dark' : 'text-expense-dark')}>
                  {t.type === 'Expense' ? '-' : '+'}{fmt(t.amount)}
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      {onEdit && (
                        <button onClick={() => onEdit(t)} className="text-xs text-brand-dark font-medium hover:underline">Edit</button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => { if (confirm('Delete this transaction?')) onDelete(t.id) }}
                          className="text-xs text-expense font-medium hover:underline"
                        >Delete</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-mo-border">
          <span className="text-xs text-mo-muted">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-xl border border-mo-border hover:bg-mo-bg disabled:opacity-40">Prev</button>
            <span className="text-xs text-mo-muted">{page}/{totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-xl border border-mo-border hover:bg-mo-bg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
