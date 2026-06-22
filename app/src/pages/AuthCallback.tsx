import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Completing sign-in…')

  useEffect(() => {
    async function handle() {
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(
        window.location.search
      )

      if (error || !session) {
        navigate('/login?error=no_access')
        return
      }

      const { data: profile } = await supabase
        .from('outlier_user_profiles')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single()

      if (!profile) {
        // Try matching by email (first login — trigger may not have run yet)
        const { data: profileByEmail } = await supabase
          .from('outlier_user_profiles')
          .select('*')
          .eq('work_email', session.user.email)
          .single()

        if (!profileByEmail) {
          await supabase.auth.signOut()
          navigate('/login?error=no_access')
          return
        }

        if (!profileByEmail.is_active) {
          await supabase.auth.signOut()
          navigate('/login?error=inactive')
          return
        }
      } else if (!profile.is_active) {
        await supabase.auth.signOut()
        navigate('/login?error=inactive')
        return
      }

      const role = profile?.role ?? 'department'
      if (role === 'area_manager') navigate('/am-dashboard')
      else if (role === 'director') navigate('/leadership')
      else if (role === 'admin') navigate('/admin')
      else navigate('/department')
    }

    handle().catch(() => navigate('/login?error=no_access'))
  }, [navigate])

  return (
    <div className="min-h-screen bg-sb-navy flex flex-col items-center justify-center gap-6">
      <img src={`${import.meta.env.BASE_URL}logos/SBOC-Primary-Sky.png`} alt="Strickland Brothers" className="h-16 object-contain" />
      <div className="w-10 h-10 rounded-full border-2 border-sb-sky border-t-transparent animate-spin" />
      <p className="font-mono text-sb-cream/60 text-[13px]">{status}</p>
    </div>
  )
}
