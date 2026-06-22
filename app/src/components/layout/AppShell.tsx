import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Department, Report } from '../../types'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface Props {
  children: React.ReactNode
  realtimeConnected?: boolean
}

export default function AppShell({ children, realtimeConnected }: Props) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    Promise.all([
      supabase.from('outlier_departments').select('*').order('sort_order'),
      supabase.from('outlier_reports').select('*, department:outlier_departments(*)').order('sort_order'),
    ]).then(([depts, rpts]) => {
      setDepartments((depts.data ?? []) as Department[])
      setReports((rpts.data ?? []) as Report[])
    })
  }, [])

  return (
    <div className="min-h-screen bg-sb-cream text-sb-cream">
      <Sidebar departments={departments} reports={reports} realtimeConnected={realtimeConnected} />
      <div className="ml-[260px] min-h-screen flex flex-col">
        <TopBar />
        <main className="mt-14 flex-1 bg-sb-navy min-h-[calc(100vh-56px)]">
          {children}
        </main>
      </div>
    </div>
  )
}
