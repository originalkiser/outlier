import { RefreshCw } from 'lucide-react'
import { useUpdateAvailable } from '../../hooks/useUpdateAvailable'

export default function UpdateBanner() {
  const available = useUpdateAvailable()
  if (!available) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-sb-navy border border-sb-sky/40 rounded-lg px-5 py-3 shadow-2xl shadow-black/40">
      <div>
        <p className="font-brand font-bold text-sb-sky text-[12px] tracking-widest uppercase">Update Available</p>
        <p className="font-mono text-sb-cream/60 text-[11px] mt-0.5">A new version of OutlierOS is ready.</p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 bg-sb-sky text-sb-navy font-brand font-bold text-[12px] tracking-wider px-4 py-2 rounded hover:brightness-105 transition shrink-0"
      >
        <RefreshCw size={13} />
        REFRESH
      </button>
    </div>
  )
}
