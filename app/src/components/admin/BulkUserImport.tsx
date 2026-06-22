import { useState, useRef } from 'react'
import { X, Upload, Download, Check, AlertTriangle, Loader } from 'lucide-react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { UserRole } from '../../types'

const VALID_ROLES: UserRole[] = ['admin', 'department', 'area_manager', 'director']
const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  department: 'Department Staff',
  area_manager: 'Area Manager',
  director: 'Director',
}

interface ImportRow {
  work_email: string
  full_name: string
  role: string
  region: string
  area: string
  _valid: boolean
  _errors: string[]
  _status: 'pending' | 'success' | 'error' | 'duplicate'
  _message?: string
}

function validateRow(raw: Record<string, string>): ImportRow {
  const work_email = (raw['work_email'] ?? raw['Work Email'] ?? raw['email'] ?? raw['Email'] ?? '').toLowerCase().trim()
  const full_name  = (raw['full_name']  ?? raw['Full Name']  ?? raw['name']  ?? raw['Name']  ?? '').trim()
  const role       = (raw['role']       ?? raw['Role']       ?? '').toLowerCase().replace(/\s+/g, '_').trim()
  const region     = (raw['region']     ?? raw['Region']     ?? '').trim()
  const area       = (raw['area']       ?? raw['Area']       ?? '').trim()

  const errors: string[] = []
  if (!work_email) errors.push('Email required')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(work_email)) errors.push('Invalid email')
  if (!VALID_ROLES.includes(role as UserRole)) errors.push(`Role must be one of: ${VALID_ROLES.join(', ')}`)

  return { work_email, full_name, role, region, area, _valid: errors.length === 0, _errors: errors, _status: 'pending' }
}

function downloadTemplate() {
  const rows = [
    ['work_email', 'full_name', 'role', 'region', 'area'],
    ['john.smith@sboilchange.com',  'John Smith',  'area_manager', 'Southeast', 'Area 4'],
    ['jane.doe@sboilchange.com',    'Jane Doe',    'director',     'Southeast', ''],
    ['dept.user@sboilchange.com',   'Dept User',   'department',   '',          ''],
  ]
  const note = [
    [''],
    ['VALID ROLES: admin | department | area_manager | director'],
    ['work_email and role are required. All other fields optional.'],
  ]
  const ws = XLSX.utils.aoa_to_sheet([...rows, ...note])
  ws['!cols'] = [{ wch: 36 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 12 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Users')
  XLSX.writeFile(wb, 'OutlierOS-User-Import-Template.xlsx')
}

interface Props {
  existingEmails: Set<string>
  onClose: () => void
  onDone: () => void
}

export default function BulkUserImport({ existingEmails, onClose, onDone }: Props) {
  const [rows, setRows] = useState<ImportRow[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function parseFile(file: File) {
    const isXlsx = /\.(xlsx|xls)$/i.test(file.name)
    if (isXlsx) {
      const reader = new FileReader()
      reader.onload = ev => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
        setRows(raw.map(validateRow).filter(r => r.work_email || r.full_name).map(r => ({
          ...r,
          _status: existingEmails.has(r.work_email) ? 'duplicate' : 'pending',
          _message: existingEmails.has(r.work_email) ? 'Already exists — will skip' : undefined,
        })))
      }
      reader.readAsArrayBuffer(file)
    } else {
      const reader = new FileReader()
      reader.onload = ev => {
        const { data } = Papa.parse<Record<string, string>>(ev.target?.result as string, { header: true, skipEmptyLines: true })
        setRows(data.map(validateRow).filter(r => r.work_email || r.full_name).map(r => ({
          ...r,
          _status: existingEmails.has(r.work_email) ? 'duplicate' : 'pending',
          _message: existingEmails.has(r.work_email) ? 'Already exists — will skip' : undefined,
        })))
      }
      reader.readAsText(file)
    }
  }

  async function handleImport() {
    if (!rows) return
    const toImport = rows.filter(r => r._valid && r._status === 'pending')
    if (toImport.length === 0) { toast.error('No valid new rows to import'); return }

    setImporting(true)
    const updated = [...rows]

    for (const row of toImport) {
      const idx = updated.findIndex(r => r.work_email === row.work_email)
      try {
        const { error } = await supabase.from('outlier_user_profiles').insert({
          work_email: row.work_email,
          full_name:  row.full_name  || null,
          role:       row.role       as UserRole,
          region:     row.region     || null,
          area:       row.area       || null,
          is_active:  true,
        })
        if (error) throw error
        updated[idx] = { ...updated[idx], _status: 'success', _message: 'Created' }
      } catch (err) {
        updated[idx] = { ...updated[idx], _status: 'error', _message: err instanceof Error ? err.message : 'Failed' }
      }
      setRows([...updated])
    }

    setImporting(false)
    setDone(true)
    const succeeded = updated.filter(r => r._status === 'success').length
    toast.success(`Imported ${succeeded} user${succeeded !== 1 ? 's' : ''}`)
    onDone()
  }

  const validNew    = rows?.filter(r => r._valid && r._status === 'pending').length ?? 0
  const invalid     = rows?.filter(r => !r._valid).length ?? 0
  const duplicates  = rows?.filter(r => r._status === 'duplicate').length ?? 0

  return (
    <div className="fixed inset-0 bg-sb-onyx/60 z-50 flex items-center justify-center p-4">
      <div className="bg-sb-navy border border-sb-inky/50 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sb-inky/30">
          <div>
            <h3 className="font-brand font-bold text-sb-sky tracking-widest text-[14px] uppercase">Bulk User Import</h3>
            <p className="font-mono text-sb-cream/50 text-[11px] mt-0.5">Upload a spreadsheet to provision multiple users at once</p>
          </div>
          <button onClick={onClose} className="text-sb-cream/50 hover:text-sb-cream transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Template download + upload */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 bg-sb-inky/30 text-sb-cream font-brand font-bold text-[12px] tracking-wider px-4 py-2 rounded border border-sb-inky hover:bg-sb-inky/50 transition"
            >
              <Download size={14} />
              DOWNLOAD TEMPLATE
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-2 bg-sb-sky text-sb-navy font-brand font-bold text-[12px] tracking-wider px-4 py-2 rounded hover:brightness-105 transition disabled:opacity-50"
            >
              <Upload size={14} />
              {rows ? 'REPLACE FILE' : 'UPLOAD FILE (.XLSX / .CSV)'}
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={e => { const f = e.target.files?.[0]; if (f) { setRows(null); setDone(false); parseFile(f) } e.target.value = '' }} className="hidden" />
          </div>

          {/* Instructions */}
          {!rows && (
            <div className="bg-sb-inky/10 border border-sb-inky/30 rounded-lg p-4 space-y-1.5">
              <p className="font-brand font-bold text-[10px] tracking-widest text-sb-inky uppercase">Required columns</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[11px] text-sb-cream/70">
                <span><span className="text-sb-sky">work_email</span> — user's email address</span>
                <span><span className="text-sb-cream/40">full_name</span> — display name (optional)</span>
                <span><span className="text-sb-sky">role</span> — admin · department · area_manager · director</span>
                <span><span className="text-sb-cream/40">region / area</span> — optional for AMs</span>
              </div>
            </div>
          )}

          {/* Preview table */}
          {rows && rows.length > 0 && (
            <>
              {/* Summary chips */}
              <div className="flex items-center gap-3 flex-wrap">
                <Chip color="text-sb-sky bg-sb-sky/10"       label={`${validNew} to import`} />
                {duplicates > 0 && <Chip color="text-sb-orange bg-sb-orange/10" label={`${duplicates} already exist`} />}
                {invalid    > 0 && <Chip color="text-sb-red bg-sb-red/10"       label={`${invalid} invalid`} />}
              </div>

              <div className="overflow-x-auto rounded border border-sb-inky/30">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-sb-inky/30 bg-sb-inky/10">
                      {['STATUS', 'EMAIL', 'NAME', 'ROLE', 'REGION', 'AREA'].map(h => (
                        <th key={h} className="px-3 py-2 font-brand font-bold text-[9px] tracking-widest text-sb-inky uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={`border-b border-sb-inky/10 ${row._status === 'error' ? 'bg-sb-red/5' : row._status === 'success' ? 'bg-sb-green/5' : ''}`}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <RowStatus row={row} />
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-sb-cream">{row.work_email || <span className="text-sb-red">missing</span>}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-sb-cream/70">{row.full_name || '—'}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-sb-cream/70">
                          {VALID_ROLES.includes(row.role as UserRole)
                            ? ROLE_LABELS[row.role as UserRole]
                            : <span className="text-sb-red">{row.role || 'missing'}</span>
                          }
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-sb-cream/50">{row.region || '—'}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-sb-cream/50">{row.area || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {rows && rows.length === 0 && (
            <p className="font-mono text-sb-red text-[12px]">No rows detected. Make sure the file has a header row and data rows.</p>
          )}
        </div>

        {/* Footer */}
        {rows && rows.length > 0 && (
          <div className="px-5 py-4 border-t border-sb-inky/30 flex items-center gap-3">
            {done ? (
              <button onClick={onClose} className="flex items-center gap-2 bg-sb-sky text-sb-navy font-brand font-bold text-[12px] tracking-wider px-4 py-2 rounded hover:brightness-105 transition">
                <Check size={14} /> DONE
              </button>
            ) : (
              <button
                onClick={handleImport}
                disabled={importing || validNew === 0}
                className="flex items-center gap-2 bg-sb-sky text-sb-navy font-brand font-bold text-[12px] tracking-wider px-4 py-2 rounded hover:brightness-105 transition disabled:opacity-40"
              >
                {importing ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
                {importing ? 'IMPORTING…' : `IMPORT ${validNew} USER${validNew !== 1 ? 'S' : ''}`}
              </button>
            )}
            <button onClick={onClose} className="font-mono text-sb-cream/50 hover:text-sb-cream text-[12px] transition">Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({ color, label }: { color: string; label: string }) {
  return <span className={`font-mono text-[11px] px-2.5 py-1 rounded font-medium ${color}`}>{label}</span>
}

function RowStatus({ row }: { row: ImportRow }) {
  if (row._status === 'success') return <span className="flex items-center gap-1 font-mono text-[10px] text-sb-green"><Check size={11} /> Created</span>
  if (row._status === 'error')   return <span className="font-mono text-[10px] text-sb-red truncate max-w-[140px]" title={row._message}>{row._message}</span>
  if (row._status === 'duplicate') return <span className="font-mono text-[10px] text-sb-orange">Exists</span>
  if (!row._valid) return (
    <span className="flex items-center gap-1 font-mono text-[10px] text-sb-red" title={row._errors.join(', ')}>
      <AlertTriangle size={11} /> {row._errors[0]}
    </span>
  )
  return <span className="font-mono text-[10px] text-sb-cream/40">Ready</span>
}
