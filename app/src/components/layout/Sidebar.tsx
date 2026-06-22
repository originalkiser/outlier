import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BarChart2, Users, Settings,
  Truck, User as UserIcon, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useWeek } from '../../contexts/WeekContext'
import { formatWeekLabel } from '../../lib/weekUtils'
import { Report, Department } from '../../types'

interface SidebarProps {
  departments: Department[]
  reports: Report[]
  realtimeConnected?: boolean
}

const DEPT_ORDER = ['training', 'facilities', 'hr', 'operations', 'sales']

export default function Sidebar({ departments, reports, realtimeConnected }: SidebarProps) {
  const { profile } = useAuth()
  const { selection, weekStart, weekEnd, setSelection, setCustomRange } = useWeek()
  const navigate = useNavigate()
  const role = profile?.role

  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(
    new Set(DEPT_ORDER)
  )
  const [customStartInput, setCustomStartInput] = useState('')
  const [customEndInput, setCustomEndInput] = useState('')

  const sortedDepts = [...departments].sort((a, b) => {
    const ai = DEPT_ORDER.indexOf(a.slug)
    const bi = DEPT_ORDER.indexOf(b.slug)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  function toggleDept(slug: string) {
    setExpandedDepts(prev => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  function handleCustomRange() {
    if (customStartInput && customEndInput) {
      setCustomRange(new Date(customStartInput + 'T00:00:00'), new Date(customEndInput + 'T00:00:00'))
    }
  }

  const weekLabel = formatWeekLabel(weekStart, weekEnd)

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-sb-navy flex flex-col z-20 border-r border-sb-inky/30">

      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-5 border-b border-sb-inky/30">
        <img
          src={`${import.meta.env.BASE_URL}logos/SBOC-Primary-Sky.png`}
          alt="Strickland Brothers"
          className="h-12 object-contain"
        />
      </div>

      {/* Realtime indicator */}
      {realtimeConnected && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-sb-inky/20 border-b border-sb-inky/20">
          <span className="w-2 h-2 rounded-full bg-sb-sky live-pulse" />
          <span className="font-mono text-[10px] text-sb-sky tracking-widest">LIVE</span>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto sidebar-scroll py-3">

        {/* ── Navigation ── */}
        <div className="px-4 mb-1">
          <p className="font-brand font-bold text-[9px] text-sb-inky tracking-[0.2em] uppercase mb-2">Navigation</p>
        </div>

        {role === 'area_manager' && (
          <SideNavLink to="/am-dashboard" icon={<LayoutDashboard size={14} />} label="MY DASHBOARD" />
        )}
        {(role === 'department' || role === 'admin') && (
          <SideNavLink to="/department" icon={<BarChart2 size={14} />} label="DEPARTMENT" />
        )}
        {(role === 'director' || role === 'admin') && (
          <SideNavLink to="/leadership" icon={<Users size={14} />} label="LEADERSHIP" />
        )}
        {role === 'admin' && (
          <SideNavLink to="/admin" icon={<Settings size={14} />} label="ADMIN" />
        )}

        {/* ── Reports tree ── */}
        <div className="px-4 mt-4 mb-1">
          <p className="font-brand font-bold text-[9px] text-sb-inky tracking-[0.2em] uppercase mb-2">Reports</p>
        </div>

        {sortedDepts.map(dept => {
          const deptReports = reports
            .filter(r => r.department_id === dept.id)
            .sort((a, b) => a.sort_order - b.sort_order)

          const expanded = expandedDepts.has(dept.slug)

          return (
            <div key={dept.id}>
              <button
                onClick={() => toggleDept(dept.slug)}
                className="w-full flex items-center justify-between px-4 py-1.5 text-left group"
              >
                <span className="font-mono text-[10px] text-sb-sky tracking-[0.15em] uppercase font-medium">
                  {dept.name}
                </span>
                {expanded
                  ? <ChevronDown size={11} className="text-sb-inky" />
                  : <ChevronRight size={11} className="text-sb-inky" />
                }
              </button>

              {expanded && deptReports.map(report => (
                <NavLink
                  key={report.id}
                  to={`/report/${report.slug}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2 pl-8 pr-4 py-1.5 text-left transition-colors border-l-2 ${
                      isActive
                        ? 'border-sb-sky text-sb-sky bg-sb-inky/20'
                        : 'border-transparent text-sb-cream/80 hover:text-sb-cream hover:bg-sb-inky/10'
                    }`
                  }
                >
                  {report.is_employee_report
                    ? <UserIcon size={11} className="shrink-0 opacity-60" />
                    : <Truck size={11} className="shrink-0 opacity-60" />
                  }
                  <span className="font-brand text-[11px] font-bold tracking-wide leading-tight">
                    {report.name}
                  </span>
                </NavLink>
              ))}
            </div>
          )
        })}

        {/* Empty state if no reports loaded yet */}
        {departments.length === 0 && (
          <div className="px-4 py-3">
            <div className="h-3 bg-sb-inky/30 rounded mb-2 w-20" />
            <div className="h-2 bg-sb-inky/20 rounded mb-1.5 w-32" />
            <div className="h-2 bg-sb-inky/20 rounded mb-1.5 w-28" />
          </div>
        )}
      </nav>

      {/* ── Week selector ── */}
      <div className="border-t border-sb-inky/30 px-4 py-3">
        <p className="font-brand font-bold text-[9px] text-sb-inky tracking-[0.2em] uppercase mb-2">Week</p>

        <div className="font-mono text-[11px] text-sb-sky mb-2 leading-tight">{weekLabel}</div>

        <div className="space-y-1">
          {(['this', 'last'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSelection(s)}
              className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors font-mono text-[11px] ${
                selection === s
                  ? 'text-sb-sky bg-sb-inky/30'
                  : 'text-sb-cream/70 hover:text-sb-cream hover:bg-sb-inky/20'
              }`}
            >
              <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                selection === s ? 'border-sb-sky' : 'border-sb-inky'
              }`}>
                {selection === s && <span className="w-1.5 h-1.5 rounded-full bg-sb-sky" />}
              </span>
              {s === 'this' ? 'THIS WEEK' : 'LAST WEEK'}
            </button>
          ))}

          <button
            onClick={() => setSelection('custom')}
            className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors font-mono text-[11px] ${
              selection === 'custom'
                ? 'text-sb-sky bg-sb-inky/30'
                : 'text-sb-cream/70 hover:text-sb-cream hover:bg-sb-inky/20'
            }`}
          >
            <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${
              selection === 'custom' ? 'border-sb-sky' : 'border-sb-inky'
            }`}>
              {selection === 'custom' && <span className="w-1.5 h-1.5 rounded-full bg-sb-sky" />}
            </span>
            CUSTOM RANGE
          </button>

          {selection === 'custom' && (
            <div className="mt-2 space-y-1">
              <input
                type="date"
                value={customStartInput}
                onChange={e => setCustomStartInput(e.target.value)}
                className="w-full bg-sb-inky/30 text-sb-cream font-mono text-[11px] rounded px-2 py-1 border border-sb-inky/50 focus:outline-none focus:border-sb-sky"
              />
              <input
                type="date"
                value={customEndInput}
                onChange={e => setCustomEndInput(e.target.value)}
                className="w-full bg-sb-inky/30 text-sb-cream font-mono text-[11px] rounded px-2 py-1 border border-sb-inky/50 focus:outline-none focus:border-sb-sky"
              />
              <button
                onClick={handleCustomRange}
                className="w-full bg-sb-sky text-sb-navy font-brand font-bold text-[11px] tracking-wider py-1 rounded hover:brightness-105 transition"
              >
                APPLY
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function SideNavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-4 py-2 transition-colors border-l-2 ${
          isActive
            ? 'border-sb-sky text-sb-sky bg-sb-inky/20'
            : 'border-transparent text-sb-cream/80 hover:text-sb-cream hover:bg-sb-inky/10'
        }`
      }
    >
      <span className="opacity-70">{icon}</span>
      <span className="font-brand font-bold text-[12px] tracking-wider">{label}</span>
    </NavLink>
  )
}
