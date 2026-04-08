import { CsvImporter } from '@/components/import/CsvImporter'
import { FileText, Info } from 'lucide-react'

export default function ImportPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-mo-text">Import CSV</h1>
        <p className="text-sm text-mo-muted mt-0.5">Import your transactions from a CSV file</p>
      </div>

      {/* Instructions */}
      <div className="bg-brand-subtle border border-brand-light rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-brand mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-mo-text mb-2">Expected CSV Format</h3>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} className="text-brand" />
              <span className="text-sm text-mo-text font-medium">Required columns:</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-mo-muted">
              <div><span className="font-mono bg-brand-light px-1 rounded">date</span> — M/D/YY (e.g. 1/15/25)</div>
              <div><span className="font-mono bg-brand-light px-1 rounded">type</span> — Expense | Income</div>
              <div><span className="font-mono bg-brand-light px-1 rounded">category</span> — Housing, Food, etc.</div>
              <div><span className="font-mono bg-brand-light px-1 rounded">sub_category</span> — optional</div>
              <div><span className="font-mono bg-brand-light px-1 rounded">amount</span> — $1,234.56</div>
              <div><span className="font-mono bg-brand-light px-1 rounded">merchant</span> — store name</div>
              <div><span className="font-mono bg-brand-light px-1 rounded">payment_method</span> — USD/RMB Account</div>
              <div><span className="font-mono bg-brand-light px-1 rounded">note</span> — optional</div>
            </div>
            <p className="text-xs text-mo-muted mt-3">
              Duplicate detection: rows with the same date, amount, type, and merchant are skipped.
            </p>
          </div>
        </div>
      </div>

      <CsvImporter />
    </div>
  )
}
