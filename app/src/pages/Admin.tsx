import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { UserProfile, Report, Week } from '../types'
import UserManagement from '../components/admin/UserManagement'
import ExportData from '../components/admin/ExportData'

type AdminTab = 'users' | 'export'

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('users')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [allWeeks, setAllWeeks] = useState<Week[]>([])
  const [loading, setLoading] = useState(true)

  async function loadUsers() {
    const { data } = await supabase
      .from('outlier_user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers((data ?? []) as UserProfile[])
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [rptRes, wkRes] = await Promise.all([
        supabase.from('outlier_reports').select('*, department:outlier_departments(*)').order('sort_order'),
        supabase.from('outlier_weeks').select('*').order('week_start', { ascending: false }),
      ])
      setReports((rptRes.data ?? []) as Report[])
      setAllWeeks((wkRes.data ?? []) as Week[])
      await loadUsers()
      setLoading(false)
    }
    load()
  }, [])

  const TABS: { key: AdminTab; label: string }[] = [
    { key: 'users',  label: 'USER MANAGEMENT' },
    { key: 'export', label: 'EXPORT DATA' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="px-6 py-4 border-b border-sb-inky/30">
        <h1 className="font-brand font-bold text-sb-cream text-[16px] tracking-wider uppercase">Admin Panel</h1>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-sb-inky/30 px-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 font-brand font-bold text-[11px] tracking-widest uppercase transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-sb-sky text-sb-sky'
                : 'border-transparent text-sb-inky hover:text-sb-cream'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-sb-inky/20 rounded animate-pulse" />)}
          </div>
        ) : (
          <>
            {tab === 'users' && (
              <UserManagement users={users} onRefresh={loadUsers} />
            )}
            {tab === 'export' && (
              <ExportData reports={reports} allWeeks={allWeeks} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
