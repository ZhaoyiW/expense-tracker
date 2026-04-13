'use client'

import { useRef, useState } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { ChevronUp, ChevronDown, ChevronsUpDown, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, useMotionValue, AnimatePresence } from 'framer-motion'
import { Transaction } from '@/types'
import { getCategoryEmoji } from '@/lib/constants'
import clsx from 'clsx'

interface TransactionTableProps {
  transactions: Transaction[]
  onEdit?: (t: Transaction) => void
  onDelete?: (id: number) => void
  showActions?: boolean
  pageSize?: number
}

type SortKey = 'date' | 'amount'
type SortDir = 'asc' | 'desc'

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
}

function fmtCompact(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

function formatDateHeader(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d, yyyy')
}

interface Group {
  dateKey: string
  items: Transaction[]
  dayNet: number
}

// Swipeable row: drag left to reveal Edit + Delete
function SwipeableRow({
  t,
  onEdit,
  onDelete,
}: {
  t: Transaction
  onEdit?: (t: Transaction) => void
  onDelete?: (id: number) => void
}) {
  const x = useMotionValue(0)
  const REVEAL_WIDTH = 112
  const [revealed, setRevealed] = useState(false)
  const constraintsRef = useRef(null)

  const paymentLabel = t.payment_method === 'USD Account' ? '$' : t.payment_method === 'RMB Account' ? '¥' : t.payment_method
  const subtitle = [t.sub_category, paymentLabel].filter(Boolean).join(' · ')

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -REVEAL_WIDTH / 2) {
      setRevealed(true)
      x.set(-REVEAL_WIDTH)
    } else {
      setRevealed(false)
      x.set(0)
    }
  }

  const close = () => {
    setRevealed(false)
    x.set(0)
  }

  return (
    <div ref={constraintsRef} className="relative overflow-hidden border-b border-mo-border last:border-0">
      {/* Action buttons — sit behind the row */}
      <div className="absolute inset-y-0 right-0 flex items-center z-0">
        {onEdit && (
          <button
            onClick={() => { close(); onEdit(t) }}
            className="h-full w-14 flex flex-col items-center justify-center gap-0.5 bg-brand/90 text-white text-[10px] font-medium"
          >
            <Pencil size={14} />
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => { if (confirm('Delete this transaction?')) onDelete(t.id) }}
            className="h-full w-14 flex flex-col items-center justify-center gap-0.5 bg-rose-500/90 text-white text-[10px] font-medium"
          >
            <Trash2 size={14} />
            Del
          </button>
        )}
      </div>

      {/* Swipeable row — z-10 keeps it above the buttons until dragged */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -REVEAL_WIDTH, right: 0 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        onClick={revealed ? close : undefined}
        className="relative z-10 flex items-center gap-3 px-4 py-3.5 bg-mo-card active:bg-mo-bg touch-pan-y"
      >
        <span className="text-xl shrink-0">{getCategoryEmoji(t.category)}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-mo-text truncate">{t.category}</div>
          {subtitle && (
            <div className="text-xs text-mo-muted truncate mt-0.5">{subtitle}</div>
          )}
          {t.merchant && (
            <div className="text-xs text-mo-muted/70 truncate">{t.merchant}</div>
          )}
        </div>
        <span className={clsx(
          'text-base font-bold shrink-0 tabular-nums',
          t.type === 'Income' ? 'text-income-dark' : 'text-expense-dark'
        )}>
          {t.type === 'Expense' ? '-' : '+'}{fmt(t.amount)}
        </span>
      </motion.div>
    </div>
  )
}

export function TransactionTable({
  transactions,
  onEdit,
  onDelete,
  showActions = false,
  pageSize = 20,
}: TransactionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

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

  // Build date groups from ALL sorted items (for totals)
  const allGroups: Group[] = []
  for (const t of sorted) {
    const dateStr = typeof t.date === 'string' ? t.date : new Date(t.date).toISOString()
    const dateKey = dateStr.slice(0, 10)
    const delta = t.type === 'Income' ? t.amount : -t.amount
    const last = allGroups[allGroups.length - 1]
    if (last && last.dateKey === dateKey) {
      last.items.push(t)
      last.dayNet += delta
    } else {
      allGroups.push({ dateKey, items: [t], dayNet: delta })
    }
  }

  // Paginate groups
  const totalPages = Math.max(1, Math.ceil(allGroups.length / pageSize))
  const pagedGroups = allGroups.slice((page - 1) * pageSize, page * pageSize)

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown size={13} className="text-mo-border" />
    return sortDir === 'asc' ? <ChevronUp size={13} className="text-brand" /> : <ChevronDown size={13} className="text-brand" />
  }

  // All sorted items for desktop table pagination
  const totalItemPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pagedItems = sorted.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card overflow-hidden">
      {/* Mobile grouped list */}
      <div className="sm:hidden">
        {sorted.length === 0 && (
          <div className="px-4 py-10 text-center text-mo-muted text-sm">No transactions found</div>
        )}
        <AnimatePresence initial={false}>
          {pagedGroups.map(({ dateKey, items, dayNet }) => (
            <div key={dateKey}>
              {/* Date header with daily total */}
              <div className="px-4 py-2 bg-mo-bg/60 border-b border-mo-border flex items-center justify-between">
                <span className="text-xs font-semibold text-mo-muted tracking-wide">
                  {formatDateHeader(dateKey)}
                </span>
                <span className={clsx(
                  'text-xs font-semibold tabular-nums',
                  dayNet >= 0 ? 'text-income-dark' : 'text-expense-dark'
                )}>
                  {dayNet >= 0 ? '+' : ''}{fmtCompact(dayNet)}
                </span>
              </div>
              {/* Rows */}
              {items.map((t) =>
                showActions ? (
                  <SwipeableRow key={t.id} t={t} onEdit={onEdit} onDelete={onDelete} />
                ) : (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-mo-border last:border-0">
                    <span className="text-xl shrink-0">{getCategoryEmoji(t.category)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-mo-text truncate">{t.category}</div>
                      {(t.sub_category || t.payment_method) && (
                        <div className="text-xs text-mo-muted truncate mt-0.5">
                          {[t.sub_category, t.payment_method === 'USD Account' ? '$' : t.payment_method === 'RMB Account' ? '¥' : t.payment_method].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    <span className={clsx(
                      'text-base font-bold shrink-0 tabular-nums',
                      t.type === 'Income' ? 'text-income-dark' : 'text-expense-dark'
                    )}>
                      {t.type === 'Expense' ? '-' : '+'}{fmt(t.amount)}
                    </span>
                  </div>
                )
              )}
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop table */}
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
            {pagedItems.length === 0 && (
              <tr>
                <td colSpan={showActions ? 7 : 6} className="px-4 py-10 text-center text-mo-muted text-sm">
                  No transactions found
                </td>
              </tr>
            )}
            {pagedItems.map((t) => (
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
                <td className={clsx(
                  'px-4 py-3 text-right font-bold whitespace-nowrap',
                  t.type === 'Income' ? 'text-income-dark' : 'text-expense-dark'
                )}>
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

      {/* Pagination — mobile uses group pages, desktop uses item pages */}
      {(totalPages > 1 || totalItemPages > 1) && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-mo-border">
          <span className="text-xs text-mo-muted">
            <span className="sm:hidden">
              {Math.min(page * pageSize, allGroups.length)} / {allGroups.length} days
            </span>
            <span className="hidden sm:inline">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-xl border border-mo-border hover:bg-mo-bg disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-mo-muted">{page} / {Math.max(totalPages, totalItemPages)}</span>
            <button
              onClick={() => setPage(Math.min(Math.max(totalPages, totalItemPages), page + 1))}
              disabled={page >= Math.max(totalPages, totalItemPages)}
              className="p-1.5 rounded-xl border border-mo-border hover:bg-mo-bg disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
