import { useState, useRef } from 'react'
import { X, Upload, ClipboardPaste } from 'lucide-react'
import Papa from 'papaparse'
import { Report, ParsedRow, Week } from '../../types'
import { parseLocation, parseEmployeeRow } from './locationParser'
import { detectPivot } from './pivotDetector'
import PastePreview from './PastePreview'
import { toDateString, getThisWeekFriday } from '../../lib/weekUtils'

interface Props {
  report: Report
  currentWeek: Week | null
  existingEntries: { row_key: string }[]
  onClose: () => void
  onCommit: (rows: ParsedRow[], weekId: string) => Promise<void>
}

export default function PasteModal({ report, currentWeek, existingEntries, onClose, onCommit }: Props) {
  const [rawText, setRawText] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null)
  const [pivotInfo, setPivotInfo] = useState<{ isPivot: boolean; shopCount: number; employeeCount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [committing, setCommitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const dataColumns = report.columns.filter(c => c.type !== 'location' && c.type !== 'employee')
  const defaultDueDate = toDateString(getThisWeekFriday())

  function parseText(text: string) {
    setError(null)
    const result = Papa.parse<string[]>(text.trim(), {
      delimiter: '\t',
      skipEmptyLines: true,
    })

    if (!result.data || result.data.length < 2) {
      setError('Could not parse pasted data. Make sure you paste tab-separated rows (copy directly from Excel/Sheets).')
      return
    }

    const headerRow = result.data[0]
    const dataRows = result.data.slice(1)

    const pivot = detectPivot(result.data)
    setPivotInfo(pivot)

    const rows: ParsedRow[] = dataRows.map((row, i) => {
      const firstCell = row[0]?.trim() ?? ''
      const isTotal = /^(grand\s+)?total$/i.test(firstCell)

      let parsed: ParsedRow

      if (report.is_employee_report && row[1]) {
        const emp = parseEmployeeRow(firstCell, row[1])
        parsed = {
          row_key: emp.rowKey,
          row_label: emp.rowLabel,
          row_type: isTotal ? 'total' : 'data',
          data: {},
          matched: emp.matched,
          originalText: row.join('\t'),
        }
      } else {
        const loc = parseLocation(firstCell)
        parsed = {
          row_key: isTotal ? `total-${i}` : loc.rowKey,
          row_label: isTotal ? firstCell : loc.rowLabel,
          row_type: isTotal ? 'total' : 'data',
          data: {},
          matched: isTotal || loc.matched,
          originalText: row.join('\t'),
        }
      }

      // Map remaining columns to data
      const startCol = report.is_employee_report ? 2 : 1
      dataColumns.forEach((col, ci) => {
        const val = row[startCol + ci]?.trim() ?? ''
        parsed.data[col.key] = val
      })

      parsed.data['due_date'] = defaultDueDate

      return parsed
    })

    setParsedRows(rows)
  }

  function handlePaste() {
    if (!rawText.trim()) {
      setError('Please paste some data first.')
      return
    }
    parseText(rawText)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setRawText(text)
      parseText(text)
    }
    reader.readAsText(file)
  }

  async function handleCommit() {
    if (!parsedRows || !currentWeek) return
    setCommitting(true)
    try {
      await onCommit(parsedRows, currentWeek.id)
      onClose()
    } catch (err) {
      setError('Failed to save data. Please try again.')
    } finally {
      setCommitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-sb-onyx/60 z-50 flex items-center justify-center p-4">
      <div className="bg-sb-navy border border-sb-inky/50 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sb-inky/30">
          <div>
            <h2 className="font-brand font-bold text-sb-sky tracking-widest text-[14px] uppercase">
              Paste Report Data
            </h2>
            <p className="font-mono text-sb-cream/50 text-[11px] mt-0.5">{report.name}</p>
          </div>
          <button onClick={onClose} className="text-sb-cream/50 hover:text-sb-cream transition-colors">
            <X size={18} />
          </button>
        </div>

        {parsedRows ? (
          /* Preview step */
          <PastePreview
            rows={parsedRows}
            columns={report.columns}
            existingKeys={new Set(existingEntries.map(e => e.row_key))}
            pivotInfo={pivotInfo}
            onBack={() => setParsedRows(null)}
            onCommit={handleCommit}
            committing={committing}
          />
        ) : (
          /* Input step */
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Pivot banner slot */}

            <div>
              <label className="font-brand font-bold text-[11px] text-sb-inky tracking-widest uppercase mb-2 block">
                Paste Data (Tab-Separated from Excel / Sheets)
              </label>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Paste your copied data here…"
                className="w-full h-48 bg-sb-inky/20 text-sb-cream font-mono text-[12px] p-3 rounded border border-sb-inky/40 focus:outline-none focus:border-sb-sky resize-none placeholder:text-sb-cream/25"
              />
            </div>

            {error && (
              <p className="font-mono text-sb-red text-[12px] bg-sb-red/10 border border-sb-red/30 rounded px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handlePaste}
                className="flex items-center gap-2 bg-sb-sky text-sb-navy font-brand font-bold text-[12px] tracking-wider px-4 py-2 rounded hover:brightness-105 transition"
              >
                <ClipboardPaste size={14} />
                PARSE DATA
              </button>

              <span className="font-mono text-[11px] text-sb-inky">or</span>

              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 bg-sb-inky/40 text-sb-cream font-brand font-bold text-[12px] tracking-wider px-4 py-2 rounded border border-sb-inky hover:bg-sb-inky/60 transition"
              >
                <Upload size={14} />
                UPLOAD CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFile} className="hidden" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
