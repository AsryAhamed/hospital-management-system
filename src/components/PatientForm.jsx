import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function PatientForm({ onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const onChange = (k, v) => setForm(s => ({ ...s, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (form.name.trim().length < 2) return setErr('Name is required (min 2 chars)')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setErr('Enter a valid email')
    if ((form.phone || '').replace(/\D/g,'').length < 7) return setErr('Enter a valid phone (min 7 digits)')
    setBusy(true)
    try {
      const { error } = await supabase.from('patients').insert([form])
      if (error) throw error
      setForm({ name: '', email: '', phone: '' })
      onSaved?.()
    } catch (e2) {
      setErr(e2.message || 'Failed to save patient')
    } finally {
      setBusy(false)
    }
  }

  const clearAll = async () => {
    if (!confirm('Clear ALL patients? This will remove related appointments.')) return
    await supabase.rpc('delete_all_patients_and_appointments').catch(()=>{}) // optional if you add RPC; otherwise remove
    // fallback: manual delete
    await supabase.from('appointments').delete().neq('id', null)
    await supabase.from('patients').delete().neq('id', null)
    onSaved?.()
  }

  return (
    <form onSubmit={submit} noValidate>
      <div>
        <label>Full Name</label>
        <input placeholder="e.g., Jane Doe" value={form.name} onChange={e=>onChange('name', e.target.value)} required />
      </div>
      <div className="row two">
        <div>
          <label>Email</label>
          <input type="email" placeholder="jane@example.com" value={form.email} onChange={e=>onChange('email', e.target.value)} required />
        </div>
        <div>
          <label>Phone</label>
          <input placeholder="+1 555 123 4567" value={form.phone} onChange={e=>onChange('phone', e.target.value)} required />
        </div>
      </div>
      {err ? <div className="error" style={{ display: 'block' }}>{err}</div> : null}
      <div className="actions">
  <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save Patient'}</button>
</div>
      <div className="hint">Duplicate emails are blocked via database unique constraint.</div>
    </form>
  )
}
