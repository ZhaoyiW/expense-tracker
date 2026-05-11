'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { ChevronUp, ChevronDown, ChevronsUpDown, Trash2, Pencil, ChevronLeft, ChevronRight, Columns } from 'lucide-react'
import { motion, useMotionValue, AnimatePresence } from 'framer-motion'
import { Transaction } from '@/types'
import { getCategoryEmoji } from '@/lib/constants'
import clsx from 'clsx'

type ColKey = 'date' | 'category' | 'sub_category' | 'merchant' | 'payment' | 'note'
const COL_LABELS: Record<ColKey, string> = {
  date: 'Date',
  category: 'Category',
  sub_category: 'Sub-category',
  merchant: 'Merchant',
  payment: 'Payment',
  note: 'Note',
}
const ALL_COLS = Object.keys(COL_LABELS) as ColKey[]
// Dimensions that, when hidden, trigger aggregation
const DIMENSION_COLS: ColKey[] = ['date', 'category', 'merchant', 'payment']
interface AggRow {
  date?: string
  category?: string
  sub_category?: string
  merchant?: string
  payment?: string
  totalIncome: number
  totalExpense: number
  count: number
}



interface TransactionTableProps {
  transactions: Transaction[]
  onEdit?: (t: Transaction) => void
  onDelete?: (id: number) => void
  showActions?: boolean
  pageSize?: number
  flatMode?: boolean  // flat list (no date groups), shows merchant
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
  const [noteExpanded, setNoteExpanded] = useState(false)
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
        onClick={revealed ? close : (t.note ? () => setNoteExpanded((v) => !v) : undefined)}
        className={clsx('relative z-10 flex items-center gap-3 px-4 py-3.5 bg-mo-card touch-pan-y', t.note && !revealed && 'active:bg-mo-bg cursor-pointer')}
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
          {noteExpanded && t.note && (
            <div className="mt-1.5 text-xs text-mo-muted bg-mo-bg rounded-lg px-2 py-1.5">{t.note}</div>
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

function FlatList({
  sorted, page, setPage, pageSize,
}: {
  sorted: Transaction[]
  page: number
  setPage: (p: number) => void
  pageSize: number
}) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const toggle = (id: number) =>
    setExpandedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const flatTotal = Math.max(1, Math.ceil(sorted.length / pageSize))
  const items = sorted.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="bg-mo-card rounded-3xl border border-mo-border shadow-card overflow-hidden">
      {items.length === 0 && (
        <div className="px-4 py-10 text-center text-mo-muted text-sm">No transactions found</div>
      )}
      {items.map((t) => {
        const payLabel = t.payment_method === 'USD Account' ? '$' : t.payment_method === 'RMB Account' ? '¥' : t.payment_method
        const dateStr = typeof t.date === 'string' ? t.date : new Date(t.date).toISOString()
        const expanded = expandedIds.has(t.id)
        return (
          <div
            key={t.id}
            className="border-b border-mo-border last:border-0"
            onClick={() => t.note ? toggle(t.id) : undefined}
          >
            <div className={clsx('flex items-start gap-3 px-4 py-3', t.note && 'cursor-pointer active:bg-mo-bg')}>
              <span className="text-xl shrink-0 mt-0.5">{getCategoryEmoji(t.category)}</span>
              <div className="flex-1 min-w-0">
                {/* Line 1: Category */}
                <div className="text-sm font-semibold text-mo-text truncate">{t.category}</div>
                {/* Line 2: Date · Sub-category */}
                <div className="text-xs text-mo-muted mt-0.5 truncate">
                  {dateStr.slice(0, 10)}{t.sub_category ? ` · ${t.sub_category}` : ''}
                </div>
                {/* Line 3: Merchant · currency */}
                {(t.merchant || payLabel) && (
                  <div className="text-xs text-mo-muted/70 mt-0.5 truncate">
                    {[t.merchant, payLabel].filter(Boolean).join(' · ')}
                  </div>
                )}
                {/* Note — shown when expanded */}
                {expanded && t.note && (
                  <div className="mt-1.5 text-xs text-mo-muted bg-mo-bg rounded-lg px-2 py-1.5">{t.note}</div>
                )}
              </div>
              <span className={clsx('text-base font-bold shrink-0 tabular-nums mt-0.5', t.type === 'Income' ? 'text-income-dark' : 'text-expense-dark')}>
                {t.type === 'Expense' ? '-' : '+'}{fmt(t.amount)}
              </span>
            </div>
          </div>
        )
      })}
      {flatTotal > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-mo-border">
          <span className="text-xs text-mo-muted">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="p-1.5 rounded-xl border border-mo-border hover:bg-mo-bg disabled:opacity-40"><ChevronLeft size={14} /></button>
            <span className="text-xs text-mo-muted">{page}/{flatTotal}</span>
            <button onClick={() => setPage(Math.min(flatTotal, page + 1))} disabled={page === flatTotal}
              className="p-1.5 rounded-xl border border-mo-border hover:bg-mo-bg disabled:opacity-40"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

function makeTop5Set(groups: Group[]): Set<string> {
  return new Set(groups.slice(0, 5).map((g) => g.dateKey))
}

export function TransactionTable({
  transactions,
  onEdit,
  onDelete,
  showActions = false,
  pageSize = 20,
  flatMode = false,
}: TransactionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [toggledKeys, setToggledKeys] = useState<Set<string>>(new Set())
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<number>>(new Set())
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(new Set(ALL_COLS))
  const [colPickerOpen, setColPickerOpen] = useState(false)
  const colPickerRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    if (!colPickerOpen) return
    const handler = (e: MouseEvent) => {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node))
        setColPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [colPickerOpen])

  const toggleCol = (col: ColKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev)
      next.has(col) ? next.delete(col) : next.add(col)
      return next
    })
  }

  const toggleNote = (id: number) =>
    setExpandedNoteIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  // Aggregation: active when any dimension column is hidden
  const isAggregating = DIMENSION_COLS.some((c) => !visibleCols.has(c))

  // Reset page when aggregation mode changes
  useEffect(() => { setPage(1) }, [isAggregating])

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

  // Aggregated rows — group by visible dimensions, sum amounts
  const aggRows = useMemo<AggRow[]>(() => {
    if (!isAggregating) return []
    const map = new Map<string, AggRow>()
    for (const t of sorted) {
      const dateStr = typeof t.date === 'string' ? t.date.slice(0, 10) : new Date(t.date).toISOString().slice(0, 10)
      const key = [
        visibleCols.has('date') ? dateStr : '',
        visibleCols.has('category') ? t.category : '',
        visibleCols.has('sub_category') ? (t.sub_category || '') : '',
        visibleCols.has('merchant') ? (t.merchant || '') : '',
        visibleCols.has('payment') ? t.payment_method : '',
      ].join('\x00')
      if (!map.has(key)) {
        map.set(key, {
          date: visibleCols.has('date') ? dateStr : undefined,
          category: visibleCols.has('category') ? t.category : undefined,
          sub_category: visibleCols.has('sub_category') ? (t.sub_category || undefined) : undefined,
          merchant: visibleCols.has('merchant') ? (t.merchant || undefined) : undefined,
          payment: visibleCols.has('payment') ? t.payment_method : undefined,
          totalIncome: 0, totalExpense: 0, count: 0,
        })
      }
      const row = map.get(key)!
      if (t.type === 'Income') row.totalIncome += t.amount
      else row.totalExpense += t.amount
      row.count++
    }
    return [...map.values()].sort((a, b) => b.totalExpense - a.totalExpense)
  }, [sorted, visibleCols, isAggregating])

  const aggTotalPages = Math.max(1, Math.ceil(aggRows.length / pageSize))
  const pagedAggRows = aggRows.slice((page - 1) * pageSize, page * pageSize)

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

  // Top-5 most recent date groups are expanded by default; toggledKeys flips the default
  const top5 = makeTop5Set(allGroups)
  const isDefaultExpanded = (dateKey: string) => top5.has(dateKey)
  const isExpanded = (dateKey: string) =>
    toggledKeys.has(dateKey) ? !isDefaultExpanded(dateKey) : isDefaultExpanded(dateKey)
  const toggleGroup = (dateKey: string) =>
    setToggledKeys((prev) => { const s = new Set(prev); s.has(dateKey) ? s.delete(dateKey) : s.add(dateKey); return s })

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

  // Flat mode — used in dashboard: 3-line layout with expandable note, 10 per page
  if (flatMode) {
    return <FlatList sorted={sorted} page={page} setPage={setPage} pageSize={pageSize} />
  }

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
              {/* Date header — clickable to collapse/expand */}
              <button
                onClick={() => toggleGroup(dateKey)}
                className="w-full px-4 py-2 bg-mo-bg/60 border-b border-mo-border flex items-center justify-between active:bg-mo-bg"
              >
                <div className="flex items-center gap-1.5">
                  <ChevronDown
                    size={12}
                    className={clsx('text-mo-muted transition-transform', !isExpanded(dateKey) && '-rotate-90')}
                  />
                  <span className="text-xs font-semibold text-mo-muted tracking-wide">
                    {formatDateHeader(dateKey)}
                  </span>
                </div>
                <span className={clsx(
                  'text-xs font-semibold tabular-nums',
                  dayNet >= 0 ? 'text-income-dark' : 'text-expense-dark'
                )}>
                  {dayNet >= 0 ? '+' : ''}{fmtCompact(dayNet)}
                </span>
              </button>
              {/* Rows — only when expanded */}
              {isExpanded(dateKey) && items.map((t) =>
                showActions ? (
                  <SwipeableRow key={t.id} t={t} onEdit={onEdit} onDelete={onDelete} />
                ) : (
                  <div
                    key={t.id}
                    className={clsx('flex items-start gap-3 px-4 py-3.5 border-b border-mo-border last:border-0', t.note && 'cursor-pointer active:bg-mo-bg')}
                    onClick={() => t.note ? toggleNote(t.id) : undefined}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{getCategoryEmoji(t.category)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-mo-text truncate">{t.category}</div>
                      {(t.sub_category || t.payment_method) && (
                        <div className="text-xs text-mo-muted truncate mt-0.5">
                          {[t.sub_category, t.payment_method === 'USD Account' ? '$' : t.payment_method === 'RMB Account' ? '¥' : t.payment_method].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      {expandedNoteIds.has(t.id) && t.note && (
                        <div className="mt-1.5 text-xs text-mo-muted bg-mo-bg rounded-lg px-2 py-1.5">{t.note}</div>
                      )}
                    </div>
                    <span className={clsx(
                      'text-base font-bold shrink-0 tabular-nums mt-0.5',
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
        {/* Column picker toolbar */}
        <div className="flex items-center justify-end px-4 py-2 border-b border-mo-border bg-mo-bg/50">
          <div className="relative" ref={colPickerRef}>
            <button
              onClick={() => setColPickerOpen((v) => !v)}
              className={clsx(
                'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-colors',
                colPickerOpen
                  ? 'bg-brand-subtle text-brand-dark border-brand/30'
                  : 'text-mo-muted border-mo-border hover:text-mo-text hover:bg-mo-bg'
              )}
            >
              <Columns size={13} />
              Columns
            </button>
            {colPickerOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-20 bg-mo-card border border-mo-border rounded-2xl shadow-card p-3 space-y-2.5 min-w-[160px]">
                {ALL_COLS.map((col) => (
                  <label key={col} className="flex items-center gap-2.5 text-sm text-mo-text cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={visibleCols.has(col)}
                      onChange={() => toggleCol(col)}
                      className="w-3.5 h-3.5 rounded accent-brand cursor-pointer"
                    />
                    {COL_LABELS[col]}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mo-border bg-mo-bg">
              {visibleCols.has('date') && (
                <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted cursor-pointer" onClick={() => !isAggregating && handleSort('date')}>
                  <span className="flex items-center gap-1">Date {!isAggregating && <SortIcon col="date" />}</span>
                </th>
              )}
              {visibleCols.has('category') && <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted">Category</th>}
              {visibleCols.has('merchant') && <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted">Merchant</th>}
              {visibleCols.has('payment') && <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted">Payment</th>}
              {visibleCols.has('note') && !isAggregating && <th className="px-4 py-3 text-left text-xs font-medium text-mo-muted">Note</th>}
              <th className="px-4 py-3 text-right text-xs font-medium text-mo-muted cursor-pointer" onClick={() => !isAggregating && handleSort('amount')}>
                <span className="flex items-center justify-end gap-1">
                  {isAggregating ? 'Total' : 'Amount'}
                  {!isAggregating && <SortIcon col="amount" />}
                </span>
              </th>
              {isAggregating && <th className="px-4 py-3 text-right text-xs font-medium text-mo-muted">#</th>}
              {showActions && !isAggregating && <th className="px-4 py-3 text-xs font-medium text-mo-muted" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-mo-border">
            {isAggregating ? (
              pagedAggRows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-mo-muted text-sm">No transactions found</td></tr>
              ) : pagedAggRows.map((row, i) => {
                const net = row.totalIncome - row.totalExpense
                return (
                  <tr key={i} className="hover:bg-mo-bg transition-colors">
                    {visibleCols.has('date') && (
                      <td className="px-4 py-3 text-mo-muted text-xs whitespace-nowrap">
                        {row.date ? format(parseISO(row.date), 'MMM d, yyyy') : '—'}
                      </td>
                    )}
                    {visibleCols.has('category') && (
                      <td className="px-4 py-3">
                        {row.category ? (
                          <div className="flex items-center gap-1.5">
                            <span>{getCategoryEmoji(row.category)}</span>
                            <div>
                              <div className="text-sm font-medium text-mo-text">{row.category}</div>
                              {visibleCols.has('sub_category') && row.sub_category && (
                                <div className="text-2xs text-mo-muted">{row.sub_category}</div>
                              )}
                            </div>
                          </div>
                        ) : '—'}
                      </td>
                    )}
                    {visibleCols.has('merchant') && <td className="px-4 py-3 text-sm text-mo-text">{row.merchant || '—'}</td>}
                    {visibleCols.has('payment') && <td className="px-4 py-3 text-xs text-mo-muted">{row.payment || '—'}</td>}
                    <td className={clsx('px-4 py-3 text-right font-bold whitespace-nowrap', net >= 0 ? 'text-income-dark' : 'text-expense-dark')}>
                      {net >= 0 ? '+' : ''}{fmt(net)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-mo-muted">{row.count}</td>
                  </tr>
                )
              })
            ) : (
              <>
                {pagedItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-mo-muted text-sm">No transactions found</td>
                  </tr>
                )}
                {pagedItems.map((t) => (
                  <tr key={t.id} className="hover:bg-mo-bg transition-colors">
                    {visibleCols.has('date') && (
                      <td className="px-4 py-3 text-mo-muted text-xs whitespace-nowrap">
                        {format(parseISO(typeof t.date === 'string' ? t.date : new Date(t.date).toISOString()), 'MMM d, yyyy')}
                      </td>
                    )}
                    {visibleCols.has('category') && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span>{getCategoryEmoji(t.category)}</span>
                          <div>
                            <div className="text-sm font-medium text-mo-text">{t.category}</div>
                            {visibleCols.has('sub_category') && t.sub_category && (
                              <div className="text-2xs text-mo-muted">{t.sub_category}</div>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleCols.has('merchant') && <td className="px-4 py-3 text-sm text-mo-text">{t.merchant || '—'}</td>}
                    {visibleCols.has('payment') && <td className="px-4 py-3 text-xs text-mo-muted">{t.payment_method}</td>}
                    {visibleCols.has('note') && <td className="px-4 py-3 text-xs text-mo-muted max-w-[150px] truncate">{t.note || '—'}</td>}
                    <td className={clsx('px-4 py-3 text-right font-bold whitespace-nowrap', t.type === 'Income' ? 'text-income-dark' : 'text-expense-dark')}>
                      {t.type === 'Expense' ? '-' : '+'}{fmt(t.amount)}
                    </td>
                    {showActions && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 justify-end">
                          {onEdit && <button onClick={() => onEdit(t)} className="text-xs text-brand-dark font-medium hover:underline">Edit</button>}
                          {onDelete && (
                            <button onClick={() => { if (confirm('Delete this transaction?')) onDelete(t.id) }} className="text-xs text-expense font-medium hover:underline">Delete</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(totalPages > 1 || totalItemPages > 1 || aggTotalPages > 1) && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-mo-border">
          <span className="text-xs text-mo-muted">
            <span className="sm:hidden">
              {Math.min(page * pageSize, allGroups.length)} / {allGroups.length} days
            </span>
            <span className="hidden sm:inline">
              {isAggregating
                ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, aggRows.length)} of ${aggRows.length} groups`
                : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, sorted.length)} of ${sorted.length}`
              }
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
            <span className="text-xs text-mo-muted">{page} / {isAggregating ? aggTotalPages : Math.max(totalPages, totalItemPages)}</span>
            <button
              onClick={() => setPage(Math.min(isAggregating ? aggTotalPages : Math.max(totalPages, totalItemPages), page + 1))}
              disabled={page >= (isAggregating ? aggTotalPages : Math.max(totalPages, totalItemPages))}
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
