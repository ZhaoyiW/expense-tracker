'use client'

import { useState, useEffect, useRef } from 'react'
import { Transaction } from '@/types'
import { CATEGORY_OPTIONS, PAYMENT_METHODS, TYPES, getCategoryEmoji } from '@/lib/constants'
import { format, parseISO } from 'date-fns'
import { X, Zap } from 'lucide-react'
import clsx from 'clsx'
import { DatePickerInput } from '@/components/ui/DatePickerInput'
import type { RecurringPattern } from '@/app/api/recurring/route'

interface TransactionFormProps {
  initial?: Partial<Transaction>
  onSubmit: (data: Partial<Transaction>) => Promise<void>
  onCancel: () => void
}

const RECENT_MERCHANTS_KEY = 'recent_merchants'

function getRecentMerchants(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_MERCHANTS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveRecentMerchant(merchant: string) {
  if (!merchant.trim()) return
  const recent = getRecentMerchants().filter((m) => m !== merchant)
  recent.unshift(merchant)
  localStorage.setItem(RECENT_MERCHANTS_KEY, JSON.stringify(recent.slice(0, 6)))
}

function ChipSelector({
  label,
  options,
  value,
  onChange,
  required,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-mo-muted uppercase tracking-wide mb-2">
        {label} {required && <span className="text-expense">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? '' : opt)}
            className={clsx(
              'flex-shrink-0 px-3 py-1.5 rounded-2xl text-sm font-medium border transition-all',
              value === opt
                ? 'bg-brand text-white border-brand shadow-soft'
                : 'bg-mo-card text-mo-muted border-mo-border hover:border-brand hover:text-brand'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TransactionForm({ initial, onSubmit, onCancel }: TransactionFormProps) {
  const [type, setType] = useState(initial?.type || 'Expense')
  const [category, setCategory] = useState(initial?.category || '')
  const [subCategory, setSubCategory] = useState(initial?.sub_category || '')
  const [merchant, setMerchant] = useState(initial?.merchant || '')
  const [paymentMethod, setPaymentMethod] = useState(initial?.payment_method || 'USD Account')
  const [note, setNote] = useState(initial?.note || '')
  const [amount, setAmount] = useState(initial?.amount?.toString() || '')
  const [date, setDate] = useState(
    initial?.date
      ? format(new Date(initial.date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd')
  )

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    setDismissedSuggestion(null)  // reset so new date can show its suggestion
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recentMerchants, setRecentMerchants] = useState<string[]>([])
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringPattern[]>([])
  const [dismissedSuggestion, setDismissedSuggestion] = useState<string | null>(null)

  // Autocomplete state
  const [allMerchants, setAllMerchants] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const merchantInputRef = useRef<HTMLInputElement>(null)
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setRecentMerchants(getRecentMerchants())
    fetch('/api/merchants')
      .then((r) => r.json())
      .then((data) => setAllMerchants(data.merchants || []))
      .catch(() => {})
    // Only fetch patterns for new transactions (not edits)
    if (!initial?.id) {
      fetch('/api/recurring')
        .then((r) => r.json())
        .then((data) => setRecurringPatterns(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }, [initial?.id])

  // Update suggestions whenever merchant input changes
  useEffect(() => {
    if (!merchant.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      setActiveIndex(-1)
      return
    }
    const q = merchant.toLowerCase()
    const matches = allMerchants
      .filter((m) => m.toLowerCase().includes(q) && m.toLowerCase() !== q)
      .slice(0, 8)
    setSuggestions(matches)
    setShowSuggestions(matches.length > 0)
    setActiveIndex(-1)
  }, [merchant, allMerchants])

  const selectSuggestion = (value: string) => {
    setMerchant(value)
    setShowSuggestions(false)
    setActiveIndex(-1)
    merchantInputRef.current?.focus()
  }

  const handleMerchantBlur = () => {
    // Delay so a tap/click on a suggestion fires before the dropdown closes
    blurTimeout.current = setTimeout(() => setShowSuggestions(false), 200)
  }

  const handleMerchantFocus = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current)
    if (suggestions.length > 0) setShowSuggestions(true)
  }

  const handleMerchantKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const categories = Object.keys(CATEGORY_OPTIONS[type] || {})
  const subCategories = category ? (CATEGORY_OPTIONS[type]?.[category] || []) : []

  useEffect(() => {
    if (!categories.includes(category)) { setCategory(''); setSubCategory('') }
  }, [type])

  useEffect(() => {
    if (!subCategories.includes(subCategory)) setSubCategory('')
  }, [category])

  // Find recurring patterns that match the selected date
  const matchingSuggestions = (() => {
    if (!date || recurringPatterns.length === 0) return []
    const d = parseISO(date)
    const dom = d.getDate()
    const dow = d.getDay()
    return recurringPatterns.filter((p) =>
      (p.pattern === 'day_of_month' && p.day === dom) ||
      (p.pattern === 'day_of_week' && p.day === dow)
    )
  })()

  const activeSuggestion = matchingSuggestions.find((s) => {
    const key = `${s.merchant}|${s.pattern}|${s.day}`
    return key !== dismissedSuggestion
  }) ?? null

  const applySuggestion = (s: RecurringPattern) => {
    setType(s.type)
    setCategory(s.category)
    setSubCategory(s.sub_category)
    setMerchant(s.merchant)
    setPaymentMethod(s.payment_method)
    setAmount(s.amount.toString())
    setDismissedSuggestion(`${s.merchant}|${s.pattern}|${s.day}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!date || !amount || !type || !category) {
      setError('Please fill in date, amount, type, and category.')
      return
    }
    const amountVal = parseFloat(amount)
    if (isNaN(amountVal) || amountVal <= 0) {
      setError('Amount must be a positive number.')
      return
    }
    setLoading(true)
    try {
      if (merchant) saveRecentMerchant(merchant)
      await onSubmit({
        date: date,
        amount: amountVal,
        type,
        category,
        sub_category: subCategory,
        merchant,
        payment_method: paymentMethod,
        note,
      })
    } catch {
      setError('Failed to save transaction.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 rounded-2xl border border-mo-border bg-mo-bg text-sm text-mo-text focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand placeholder-mo-muted'
  const labelClass = 'block text-xs font-semibold text-mo-muted uppercase tracking-wide mb-2'

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-mo-card w-full max-w-2xl rounded-t-4xl md:rounded-3xl shadow-fab max-h-[92vh] flex flex-col overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-mo-border shrink-0">
          <h2 className="text-base font-semibold text-mo-text">
            {initial?.id ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onCancel} className="p-2 rounded-2xl hover:bg-mo-bg text-mo-muted">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {error && (
            <div className="bg-expense-subtle text-expense-dark text-sm px-4 py-3 rounded-2xl">{error}</div>
          )}

          {/* Recurring suggestion */}
          {activeSuggestion && (
            <div className="flex items-start gap-3 bg-brand-subtle border border-brand/20 rounded-2xl px-4 py-3">
              <Zap size={15} className="text-brand-dark mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-brand-dark">
                  Recurring — {activeSuggestion.label}
                </p>
                <p className="text-xs text-mo-muted mt-0.5 truncate">
                  {activeSuggestion.merchant || activeSuggestion.category} · ${activeSuggestion.amount.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => applySuggestion(activeSuggestion)}
                  className="text-xs font-semibold text-brand-dark bg-brand/10 hover:bg-brand/20 px-2.5 py-1 rounded-xl transition-colors"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setDismissedSuggestion(`${activeSuggestion.merchant}|${activeSuggestion.pattern}|${activeSuggestion.day}`)}
                  className="text-mo-muted hover:text-mo-text"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Type toggle */}
          <div>
            <label className={labelClass}>Type <span className="text-expense">*</span></label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={clsx(
                    'flex-1 py-2.5 rounded-2xl text-sm font-semibold border transition-all',
                    type === t
                      ? t === 'Expense' ? 'bg-expense text-white border-expense' : 'bg-income text-white border-income'
                      : 'bg-mo-card border-mo-border text-mo-muted hover:border-mo-accent'
                  )}
                >
                  {t === 'Expense' ? '🧾 Expense' : '💚 Income'}
                </button>
              ))}
            </div>
          </div>

          {/* Amount + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Amount <span className="text-expense">*</span></label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Date <span className="text-expense">*</span></label>
              <DatePickerInput
                value={date}
                onChange={handleDateChange}
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Category chips */}
          <ChipSelector
            label="Category"
            options={categories.map((c) => `${getCategoryEmoji(c)} ${c}`)}
            value={category ? `${getCategoryEmoji(category)} ${category}` : ''}
            onChange={(v) => setCategory(v.replace(/^.+? /, ''))}
            required
          />

          {/* Sub-category chips */}
          {subCategories.length > 0 && (
            <ChipSelector
              label="Sub-category"
              options={subCategories}
              value={subCategory}
              onChange={setSubCategory}
            />
          )}

          {/* Merchant with autocomplete */}
          <div>
            <label className={labelClass}>Merchant</label>
            <div className="relative">
              <input
                ref={merchantInputRef}
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                onKeyDown={handleMerchantKeyDown}
                onFocus={handleMerchantFocus}
                onBlur={handleMerchantBlur}
                placeholder="Store or company"
                className={inputClass}
                autoComplete="off"
              />
              {/* Autocomplete dropdown */}
              {showSuggestions && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-mo-card border border-mo-border rounded-2xl shadow-card overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      className={clsx(
                        'w-full text-left px-4 py-2.5 text-sm transition-colors',
                        i === activeIndex
                          ? 'bg-brand-subtle text-brand-dark'
                          : 'text-mo-text hover:bg-mo-bg',
                        i < suggestions.length - 1 && 'border-b border-mo-border'
                      )}
                    >
                      {/* Bold the matching portion */}
                      {highlightMatch(s, merchant)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Recent merchants chips (shown when input is empty) */}
            {!merchant && recentMerchants.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto chips-scroll pb-1">
                {recentMerchants.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMerchant(m)}
                    className="flex-shrink-0 px-3 py-1 rounded-xl text-xs border border-mo-border text-mo-muted hover:border-brand hover:text-brand bg-mo-bg"
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment method */}
          <div>
            <label className={labelClass}>Payment Method</label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPaymentMethod(p)}
                  className={clsx(
                    'flex-1 py-2.5 rounded-2xl text-sm font-medium border transition-all',
                    paymentMethod === p
                      ? 'bg-brand-subtle text-brand-dark border-brand'
                      : 'bg-mo-card border-mo-border text-mo-muted'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className={labelClass}>Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
              className={inputClass}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-2xl border border-mo-border text-sm font-medium text-mo-muted hover:bg-mo-bg active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-2xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-50 active:scale-95 shadow-soft"
            >
              {loading ? 'Saving…' : initial?.id ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Highlight the matched substring in bold
function highlightMatch(text: string, query: string) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-brand-dark">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}
