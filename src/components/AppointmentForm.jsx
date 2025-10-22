import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AppointmentForm({ patients, onSaved }) {
  const [form, setForm] = useState({ patient_id: '', date: '', time: '', reason: '', status: 'Pending' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    const iso = today.toISOString().slice(0,10)
    const el = document.getElementById('aDateReact')
    if (el) el.min = iso
  }, [])

  const onChange = (k, v) => setForm(s => ({ ...s, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!form.patient_id) return setErr('Select a patient')
    if (!form.date) return setErr('Choose a valid date')
    if (!form.time) return setErr('Choose a valid time')
    if ((form.reason || '').trim().length < 3) return setErr('Please include a brief reason')

    setBusy(true)
    try {
      // conflict check (same patient + same date & time)
      const { data: conflicts, error: cErr } = await supabase
        .from('appointments')
        .select('id')
        .match({ patient_id: form.patient_id, date: form.date, time: form.time })
        .limit(1)
      if (!cErr && conflicts?.length) {
        const ok = confirm('This patient already has an appointment at this time. Book anyway?')
        if (!ok) throw new Error('Cancelled by user')
      }

      const { error } = await supabase.from('appointments').insert([form])
      if (error) throw error
      setForm({ patient_id: '', date: '', time: '', reason: '', status: 'Pending' })
      onSaved?.()
    } catch (e2) {
      if (e2.message !== 'Cancelled by user') setErr(e2.message || 'Failed to book appointment')
    } finally {
      setBusy(false)
    }
  }

  const clearAll = async () => {
    if (!confirm('Clear ALL appointments?')) return
    await supabase.from('appointments').delete().neq('id', null)
    onSaved?.()
  }

  return (
    <form onSubmit={submit} noValidate>
      <div>
        <label>Select Patient</label>
        <select value={form.patient_id} onChange={e=>onChange('patient_id', e.target.value)} required>
          <option value="">— choose registered patient —</option>
          {patients.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(p=>(
            <option key={p.id} value={p.id}>{p.name} — {p.email}</option>
          ))}
        </select>
      </div>

      <div className="row three">
        <div>
          <label>Date</label>
          <input id="aDateReact" type="date" value={form.date} onChange={e=>onChange('date', e.target.value)} required />
        </div>
        <div>
          <label>Time</label>
          <input type="time" value={form.time} onChange={e=>onChange('time', e.target.value)} required />
        </div>
        <div>
          <label>Status</label>
          <select value={form.status} onChange={e=>onChange('status', e.target.value)}>
            <option>Pending</option>
            <option>Completed</option>
          </select>
        </div>
      </div>

      <div>
        <label>Reason</label>
        <textarea rows="3" placeholder="e.g., Follow-up, general checkup"
          value={form.reason} onChange={e=>onChange('reason', e.target.value)} required />
      </div>

      {err ? <div className="error" style={{ display: 'block' }}>{err}</div> : null}

      <div className="actions">
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Book Appointment'}</button>
        <button type="button" className="btn ghost" onClick={clearAll}>Clear All Appointments</button>
      </div>

      <div className="hint">We’ll warn you if the same patient already has an appointment at that time.</div>
    </form>
  )
}
