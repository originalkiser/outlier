import { LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useWeek } from '../../contexts/WeekContext'
import { formatWeekLabel } from '../../lib/weekUtils'

const ROLE_LABELS: Record<string, string> = {
  admin:        'ADMIN',
  department:   'DEPARTMENT',
  area_manager: 'AREA MANAGER',
  director:     'DIRECTOR',
}

export default function TopBar() {
  const { profile, signOut } = useAuth()
  const { weekStart, weekEnd } = useWeek()
  const weekLabel = formatWeekLabel(weekStart, weekEnd)

  return (
    <header className="fixed top-0 left-[260px] right-0 h-14 bg-sb-navy border-b border-sb-inky/30 z-10 flex items-center px-6 gap-4">
      {/* Wordmark */}
      <div className="flex items-center gap-3 border-r border-sb-inky/30 pr-5 mr-1">
        <span className="font-brand font-bold text-sb-sky text-lg tracking-widest uppercase">
          OutlierOS
        </span>
      </div>

      {/* Week */}
      <div className="font-mono text-sb-cream/60 text-[12px] tracking-wide">
        {weekLabel}
      </div>

      <div className="flex-1" />

      {/* User info */}
      {profile && (
        <div className="flex items-center gap-3">
          {profile.full_name && (
            <span className="font-mono text-sb-cream/80 text-[12px]">{profile.full_name}</span>
          )}
          <span className="bg-sb-inky/40 border border-sb-inky text-sb-sky font-brand font-bold text-[10px] tracking-widest px-2 py-0.5 rounded uppercase">
            {ROLE_LABELS[profile.role] ?? profile.role}
          </span>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={signOut}
        title="Sign out"
        className="flex items-center gap-1.5 text-sb-cream/60 hover:text-sb-cream transition-colors ml-2"
      >
        <LogOut size={15} />
        <span className="font-brand font-bold text-[11px] tracking-wide hidden sm:block">SIGN OUT</span>
      </button>
    </header>
  )
}
