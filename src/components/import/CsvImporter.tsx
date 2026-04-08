'use client'

import { useState, useRef, DragEvent } from 'react'
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { ImportResult } from '@/types'
import clsx from 'clsx'

export function CsvImporter() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = (f: File) => {
    setFile(f)
    setResult(null)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter((l) => l.trim())
      if (lines.length === 0) return
      const [headerLine, ...dataLines] = lines
      const hdrs = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
      setHeaders(hdrs)
      const rows = dataLines.slice(0, 5).map((line) => {
        const cols: string[] = []
        let current = ''
        let inQuotes = false
        for (const ch of line) {
          if (ch === '"') {
            inQuotes = !inQuotes
          } else if (ch === ',' && !inQuotes) {
            cols.push(current.trim())
            current = ''
          } else {
            current += ch
          }
        }
        cols.push(current.trim())
        return cols
      })
      setPreview(rows)
    }
    reader.readAsText(f)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) {
      processFile(f)
    } else {
      setError('Please upload a CSV file.')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) processFile(f)
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Import failed')
      }
      const data: ImportResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview([])
    setHeaders([])
    setResult(null)
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-colors',
          dragging ? 'border-brand bg-brand-subtle' : 'border-mo-border hover:border-brand hover:bg-mo-bg'
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <Upload size={32} className="mx-auto text-mo-muted mb-3" />
        {file ? (
          <div>
            <div className="flex items-center justify-center gap-2 text-mo-text font-medium">
              <FileText size={16} className="text-brand" />
              {file.name}
            </div>
            <p className="text-sm text-mo-muted mt-1">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div>
            <p className="text-mo-text font-medium">Drop your CSV file here</p>
            <p className="text-sm text-mo-muted mt-1">or click to browse</p>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-mo-card rounded-2xl border border-mo-border overflow-hidden">
          <div className="px-4 py-3 border-b border-mo-border bg-mo-bg">
            <h3 className="text-sm font-semibold text-mo-text">Preview (first 5 rows)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-mo-border">
                  {headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-mo-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, ri) => (
                  <tr key={ri} className="border-b border-mo-border hover:bg-mo-bg">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-mo-text">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-expense-subtle border border-expense-light text-expense-dark text-sm px-4 py-3 rounded-2xl">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-mo-card rounded-2xl border border-mo-border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-income" />
            <h3 className="font-semibold text-mo-text">Import Complete</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-income-subtle rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-income-dark">{result.imported}</div>
              <div className="text-xs text-income mt-1">Imported</div>
            </div>
            <div className="bg-mo-bg rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-mo-accent">{result.duplicates}</div>
              <div className="text-xs text-mo-muted mt-1">Duplicates Skipped</div>
            </div>
            <div className="bg-expense-subtle rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-expense-dark">{result.invalid}</div>
              <div className="text-xs text-expense mt-1">Invalid Rows</div>
            </div>
            <div className="bg-mo-bg rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-mo-text">{result.skipped}</div>
              <div className="text-xs text-mo-muted mt-1">Total Skipped</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="bg-expense-subtle rounded-2xl p-4">
              <p className="text-sm font-medium text-expense-dark mb-2">Errors ({result.errors.length}):</p>
              <ul className="text-xs text-expense space-y-1 max-h-32 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {file && !result && (
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-2xl border border-mo-border text-sm font-medium text-mo-muted hover:bg-mo-bg transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-brand text-white text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Import CSV'}
          </button>
        </div>
      )}
      {result && (
        <button
          onClick={handleReset}
          className="w-full px-4 py-2.5 rounded-2xl border border-mo-border text-sm font-medium text-mo-muted hover:bg-mo-bg transition-colors"
        >
          Import Another File
        </button>
      )}
    </div>
  )
}
