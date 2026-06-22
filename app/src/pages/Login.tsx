import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 21 21" className="w-5 h-5 shrink-0">
      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
    </svg>
  )
}

export default function Login() {
  const { signInWithMicrosoft, signInWithPassword } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const errorParam = params.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMicrosoft() {
    setLoading(true)
    await signInWithMicrosoft()
    setLoading(false)
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)
    const result = await signInWithPassword(email, password)
    setLoading(false)
    if (result.error) {
      if (result.error === 'no_access') {
        setError("YOUR ACCOUNT ISN'T SET UP YET — Contact your administrator.")
      } else if (result.error === 'inactive') {
        setError('YOUR ACCESS HAS BEEN REVOKED — Contact your administrator.')
      } else {
        setError(result.error)
      }
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-sb-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Error banner from URL */}
        {errorParam === 'no_access' && (
          <div className="mb-4 bg-sb-red/20 border border-sb-red/50 text-sb-red font-brand font-bold text-[12px] tracking-wide px-4 py-3 rounded uppercase text-center">
            YOUR ACCOUNT ISN'T SET UP YET — Contact your administrator.
          </div>
        )}
        {errorParam === 'inactive' && (
          <div className="mb-4 bg-sb-red/20 border border-sb-red/50 text-sb-red font-brand font-bold text-[12px] tracking-wide px-4 py-3 rounded uppercase text-center">
            YOUR ACCESS HAS BEEN REVOKED — Contact your administrator.
          </div>
        )}

        {/* Card */}
        <div className="bg-sb-navy border border-sb-inky/40 rounded-xl p-8 shadow-2xl">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={`${import.meta.env.BASE_URL}logos/SBOC-Primary-Sky.png`} alt="Strickland Brothers" className="h-16 object-contain" />
          </div>

          {/* Wordmark */}
          <div className="text-center mb-6">
            <h1 className="font-brand font-bold text-sb-sky text-4xl tracking-widest uppercase">
              OutlierOS
            </h1>
            <p className="font-brand text-sb-cream/60 text-[12px] tracking-[0.25em] uppercase mt-1">
              Outlier Report Management
            </p>
          </div>

          {/* Microsoft SSO */}
          <button
            onClick={handleMicrosoft}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-sb-sky text-sb-navy font-brand font-bold text-[14px] tracking-widest uppercase px-4 py-3 rounded-lg hover:brightness-105 transition disabled:opacity-60 mb-4"
          >
            <MicrosoftIcon />
            SIGN IN WITH MICROSOFT
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-sb-inky/50" />
            <span className="font-mono text-sb-cream/40 text-[11px]">OR</span>
            <div className="flex-1 h-px bg-sb-inky/50" />
          </div>

          {/* Password fallback */}
          <form onSubmit={handlePassword} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Work email"
              autoComplete="email"
              className="w-full bg-sb-inky/30 text-sb-cream font-mono text-[13px] px-4 py-2.5 rounded-lg border border-sb-inky/50 focus:outline-none focus:border-sb-sky placeholder:text-sb-cream/30"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full bg-sb-inky/30 text-sb-cream font-mono text-[13px] px-4 py-2.5 rounded-lg border border-sb-inky/50 focus:outline-none focus:border-sb-sky placeholder:text-sb-cream/30"
            />

            {(error) && (
              <p className="font-mono text-sb-red text-[12px] bg-sb-red/10 border border-sb-red/30 px-3 py-2 rounded">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-sb-inky text-sb-cream font-brand font-bold text-[13px] tracking-widest uppercase px-4 py-2.5 rounded-lg border border-sb-inky/80 hover:bg-sb-inky/80 transition disabled:opacity-50"
            >
              {loading ? 'SIGNING IN…' : 'SIGN IN WITH PASSWORD'}
            </button>
          </form>

          {/* Footer note */}
          <p className="font-mono text-sb-inky text-[11px] text-center mt-5">
            Access is granted by your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
