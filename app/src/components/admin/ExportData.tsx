import { useState } from 'react'
import { Download } from 'lucide-react'
import { Report, ReportEntry, Week } from '../../types'
import { formatWeekLabelFromStrings } from '../../lib/weekUtils'
import { computeStreak, formatStreakDate } from '../../lib/streakCalc'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

interface Props {
  reports: Report[]
  allWeeks: Week[]
}

export default function ExportData({ reports, allWeeks }: Props) {
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exporting, setExporting] = useState(false)

  function toggleReport(id: string) {
    setSelectedReports(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleExport() {
    if (selectedReports.size === 0) { toast.error('Select at least one report'); return }
    setExporting(true)
    try {
      const filteredWeeks = allWeeks.filter(w =>
        (!startDate || w.week_start >= startDate) &&
        (!endDate || w.week_end <= endDate)
      )
      const weekIds = filteredWeeks.map(w => w.id)

      // Fetch all entries for selected reports + date range
      const { data: entries, error } = await supabase
        .from('outlier_report_entries')
        .select('*')
        .in('report_id', Array.from(selectedReports))
        .in('week_id', weekIds)

      if (error) throw error

      // Also fetch all entries for streak calc
      const { data: allEntries } = await supabase
        .from('outlier_report_entries')
        .select('*')
        .in('report_id', Array.from(selectedReports))

      const rows: Record<string, unknown>[] = (entries ?? []).map(entry => {
        const report = reports.find(r => r.id === entry.report_id)
        const week = allWeeks.find(w => w.id === entry.week_id)
        const streak = computeStreak(entry.row_key, entry.week_id, allEntries ?? [], allWeeks)

        const streakLabel =
          streak.type === 'streak' ? `${streak.count} Weeks`
          : streak.type === 'last_seen' ? formatStreakDate(streak.lastDate!)
          : '—'

        return {
          'REPORT NAME': report?.name ?? '',
          'DEPARTMENT': report?.department?.name ?? '',
          'WEEK START': week?.week_start ?? '',
          'WEEK END': week?.week_end ?? '',
          'SHOP / EMPLOYEE': entry.row_label,
          ...(entry.data as Record<string, unknown>),
          'AM COMMENT': entry.am_comment ?? '',
          'AM COMMENT UPDATED AT': entry.am_comment_updated_at ?? '',
          'DUE DATE': entry.due_date ?? '',
          'IS COMPLETE': entry.is_complete ? 'Yes' : 'No',
          'STREAK / LAST': streakLabel,
        }
      })

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Outlier Export')
      XLSX.writeFile(wb, `OutlierOS-Export-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Export complete')
    } catch (err: unknown) {
      toast.error(`Export failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <h2 className="font-brand font-bold text-sb-cream tracking-widest text-[13px] uppercase mb-4">Export Data</h2>

      <div className="space-y-4">
        {/* Date range */}
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="font-brand font-bold text-[10px] tracking-widest text-sb-inky uppercase mb-1 block">FROM</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="bg-sb-inky/30 text-sb-cream font-mono text-[12px] px-3 py-2 rounded border border-sb-inky/50 focus:outline-none focus:border-sb-sky" />
          </div>
          <div>
            <label className="font-brand font-bold text-[10px] tracking-widest text-sb-inky uppercase mb-1 block">TO</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="bg-sb-inky/30 text-sb-cream font-mono text-[12px] px-3 py-2 rounded border border-sb-inky/50 focus:outline-none focus:border-sb-sky" />
          </div>
        </div>

        {/* Report selector */}
        <div>
          <label className="font-brand font-bold text-[10px] tracking-widest text-sb-inky uppercase mb-2 block">
            SELECT REPORTS ({selectedReports.size} selected)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {reports.map(r => (
              <label key={r.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedReports.has(r.id)}
                  onChange={() => toggleReport(r.id)}
                  className="accent-sb-sky"
                />
                <span className="font-mono text-[12px] text-sb-cream/80 group-hover:text-sb-cream">{r.name}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || selectedReports.size === 0}
          className="flex items-center gap-2 bg-sb-sky text-sb-navy font-brand font-bold text-[12px] tracking-wider px-5 py-2.5 rounded hover:brightness-105 transition disabled:opacity-50"
        >
          <Download size={14} />
          {exporting ? 'EXPORTING…' : 'EXPORT TO XLSX'}
        </button>
      </div>
    </div>
  )
}
