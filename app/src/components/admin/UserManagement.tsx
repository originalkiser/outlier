import { useState } from 'react'
import { UserPlus, X, Check, Ban, Upload } from 'lucide-react'
import { UserProfile, UserRole } from '../../types'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import BulkUserImport from './BulkUserImport'

interface Props {
  users: UserProfile[]
  onRefresh: () => void
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin',        label: 'Admin' },
  { value: 'department',   label: 'Department Staff' },
  { value: 'area_manager', label: 'Area Manager' },
  { value: 'director',     label: 'Director' },
]

function getAuthMethod(user: UserProfile): string {
  if (!user.auth_user_id) return 'Pending'
  return 'Linked'
}

function getStatus(user: UserProfile): { label: string; color: string } {
  if (!user.is_active) return { label: 'INACTIVE', color: 'text-sb-red bg-sb-red/10' }
  if (!user.auth_user_id) return { label: 'PENDING', color: 'text-sb-orange bg-sb-orange/10' }
  return { label: 'ACTIVE', color: 'text-sb-green bg-sb-green/10' }
}

export default function UserManagement({ users, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [form, setForm] = useState({
    work_email: '', full_name: '', role: 'department' as UserRole,
    region: '', area: '', password: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleAddUser() {
    if (!form.work_email) { toast.error('Email is required'); return }
    setSaving(true)
    try {
      const insertData: Record<string, unknown> = {
        work_email: form.work_email.toLowerCase().trim(),
        full_name: form.full_name || null,
        role: form.role,
        region: form.region || null,
        area: form.area || null,
        is_active: true,
      }

      const { data: profile, error: profileError } = await supabase
        .from('outlier_user_profiles')
        .insert(insertData)
        .select()
        .single()

      if (profileError) throw profileError

      // If password set, call edge function
      if (form.password && profile) {
        const { error: fnError } = await supabase.functions.invoke('outlier-create-auth-user', {
          body: { email: form.work_email, password: form.password, profile_id: profile.id },
        })
        if (fnError) toast.error(`User created but password setup failed: ${fnError.message}`)
        else toast.success('User created with password')
      } else {
        toast.success('User provisioned — awaiting Microsoft SSO login')
      }

      setShowAdd(false)
      setForm({ work_email: '', full_name: '', role: 'department', region: '', area: '', password: '' })
      onRefresh()
    } catch (err: unknown) {
      toast.error(`Failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(user: UserProfile) {
    const { error } = await supabase
      .from('outlier_user_profiles')
      .update({ is_active: !user.is_active })
      .eq('id', user.id)
    if (error) toast.error('Failed to update')
    else { toast.success(user.is_active ? 'Access revoked' : 'Access restored'); onRefresh() }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-brand font-bold text-sb-cream tracking-widest text-[13px] uppercase">User Management</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 bg-sb-inky/40 text-sb-cream font-brand font-bold text-[12px] tracking-wider px-3 py-2 rounded border border-sb-inky hover:bg-sb-inky/60 transition"
          >
            <Upload size={14} />
            IMPORT USERS
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-sb-sky text-sb-navy font-brand font-bold text-[12px] tracking-wider px-3 py-2 rounded hover:brightness-105 transition"
          >
            <UserPlus size={14} />
            ADD USER
          </button>
        </div>
      </div>

      {showBulk && (
        <BulkUserImport
          existingEmails={new Set(users.map(u => u.work_email))}
          onClose={() => setShowBulk(false)}
          onDone={() => { setShowBulk(false); onRefresh() }}
        />
      )}

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-sb-onyx/60 z-50 flex items-center justify-center p-4">
          <div className="bg-sb-navy border border-sb-inky/50 rounded-lg w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-sb-inky/30">
              <h3 className="font-brand font-bold text-sb-sky tracking-widest text-[13px] uppercase">Add User</h3>
              <button onClick={() => setShowAdd(false)} className="text-sb-cream/50 hover:text-sb-cream"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <Field label="WORK EMAIL *">
                <input value={form.work_email} onChange={e => setForm(f => ({ ...f, work_email: e.target.value }))}
                  type="email" placeholder="user@stricklandbros.com"
                  className="w-full bg-sb-inky/30 text-sb-cream font-mono text-[13px] px-3 py-2 rounded border border-sb-inky/50 focus:outline-none focus:border-sb-sky placeholder:text-sb-cream/30" />
              </Field>
              <Field label="FULL NAME">
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Full Name"
                  className="w-full bg-sb-inky/30 text-sb-cream font-mono text-[13px] px-3 py-2 rounded border border-sb-inky/50 focus:outline-none focus:border-sb-sky placeholder:text-sb-cream/30" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="ROLE">
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                    className="w-full bg-sb-inky/30 text-sb-cream font-mono text-[13px] px-3 py-2 rounded border border-sb-inky/50 focus:outline-none focus:border-sb-sky">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </Field>
                <Field label="REGION">
                  <input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                    placeholder="e.g. Southeast"
                    className="w-full bg-sb-inky/30 text-sb-cream font-mono text-[13px] px-3 py-2 rounded border border-sb-inky/50 focus:outline-none focus:border-sb-sky placeholder:text-sb-cream/30" />
                </Field>
              </div>
              <Field label="AREA">
                <input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                  placeholder="e.g. Area 4"
                  className="w-full bg-sb-inky/30 text-sb-cream font-mono text-[13px] px-3 py-2 rounded border border-sb-inky/50 focus:outline-none focus:border-sb-sky placeholder:text-sb-cream/30" />
              </Field>
              <Field label="TEMPORARY PASSWORD (optional)">
                <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  type="password" placeholder="Leave blank for Microsoft SSO only"
                  className="w-full bg-sb-inky/30 text-sb-cream font-mono text-[13px] px-3 py-2 rounded border border-sb-inky/50 focus:outline-none focus:border-sb-sky placeholder:text-sb-cream/30" />
                <p className="font-mono text-[10px] text-sb-inky mt-1">Set a temporary password for testing/initial access, or leave blank for Microsoft SSO only.</p>
              </Field>
              <button
                onClick={handleAddUser}
                disabled={saving}
                className="w-full bg-sb-sky text-sb-navy font-brand font-bold text-[13px] tracking-wider py-2.5 rounded hover:brightness-105 transition disabled:opacity-50 mt-2"
              >
                {saving ? 'CREATING…' : 'CREATE USER'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-sb-inky/40">
              {['NAME', 'EMAIL', 'ROLE', 'REGION', 'AREA', 'STATUS', 'LAST LOGIN', 'ACTIONS'].map(h => (
                <th key={h} className="px-3 py-2 font-brand font-bold text-[10px] tracking-widest text-sb-inky uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const status = getStatus(user)
              return (
                <tr key={user.id} className="border-b border-sb-inky/15 hover:bg-sb-inky/10 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-[12px] text-sb-cream">{user.full_name ?? '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-sb-cream/80">{user.work_email}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-sb-inky uppercase">{user.role}</td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-sb-cream/60">{user.region ?? '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-sb-cream/60">{user.area ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-medium ${status.color}`}>{status.label}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-sb-cream/40">
                    {user.last_login_at ? format(parseISO(user.last_login_at), 'MMM d, yyyy h:mm a') : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => handleToggleActive(user)}
                      title={user.is_active ? 'Revoke access' : 'Restore access'}
                      className={`p-1.5 rounded transition-colors ${
                        user.is_active
                          ? 'text-sb-red/70 hover:text-sb-red hover:bg-sb-red/10'
                          : 'text-sb-green/70 hover:text-sb-green hover:bg-sb-green/10'
                      }`}
                    >
                      {user.is_active ? <Ban size={13} /> : <Check size={13} />}
                    </button>
                  </td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center font-mono text-[12px] text-sb-cream/30">No users provisioned</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-brand font-bold text-[10px] tracking-widest text-sb-inky uppercase mb-1 block">{label}</label>
      {children}
    </div>
  )
}
