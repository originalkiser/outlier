import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useWeek } from '../contexts/WeekContext'
import { Report, ReportEntry, Week, AMLocation } from '../types'
import AMDashboard from '../components/dashboards/AMDashboard'

export default function AMDashboardPage() {
  const { profile } = useAuth()
  const { weekStartStr } = useWeek()
  const [amLocations, setAmLocations] = useState<AMLocation[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [entriesByReport, setEntriesByReport] = useState<Record<string, ReportEntry[]>>({})
  const [allEntries, setAllEntries] = useState<ReportEntry[]>([])
  const [allWeeks, setAllWeeks] = useState<Week[]>([])
  const [currentWeekId, setCurrentWeekId] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    const [locRes, reportsRes, weeksRes] = await Promise.all([
      supabase.from('outlier_am_locations').select('*').eq('user_id', profile.id),
      supabase.from('outlier_reports').select('*, department:outlier_departments(*)').order('sort_order'),
      supabase.from('outlier_weeks').select('*').order('week_start', { ascending: false }),
    ])

    const locs = (locRes.data ?? []) as AMLocation[]
    const rpts = (reportsRes.data ?? []) as Report[]
    const wks  = (weeksRes.data ?? []) as Week[]

    setAmLocations(locs)
    setReports(rpts)
    setAllWeeks(wks)

    const currentWeek = wks.find(w => w.week_start === weekStartStr)
    setCurrentWeekId(currentWeek?.id ?? '')

    if (currentWeek) {
      const { data: entries } = await supabase
        .from('outlier_report_entries')
        .select('*')
        .eq('week_id', currentWeek.id)

      const grouped: Record<string, ReportEntry[]> = {}
      for (const e of (entries ?? []) as ReportEntry[]) {
        if (!grouped[e.report_id]) grouped[e.report_id] = []
        grouped[e.report_id].push(e)
      }
      setEntriesByReport(grouped)
    }

    // All entries for streak
    const { data: allE } = await supabase.from('outlier_report_entries').select('*')
    setAllEntries((allE ?? []) as ReportEntry[])

    setLoading(false)
  }, [profile?.id, weekStartStr])

  useEffect(() => { load() }, [load])

  if (loading || !profile) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-sb-inky/20 rounded-lg animate-pulse" />)}
      </div>
    )
  }

  return (
    <AMDashboard
      profile={profile}
      amLocations={amLocations}
      reports={reports}
      entriesByReport={entriesByReport}
      allEntries={allEntries}
      allWeeks={allWeeks}
      currentWeekId={currentWeekId}
      onRefresh={load}
    />
  )
}
