import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Loader from './Loader'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: 60, maxWidth: 520 }}>
      <div className="card">
        <h2 style={{ marginTop: 0, marginBottom: 10 }}>
          {mode === 'login' ? 'Admin Login' : 'Create Admin Account'}
        </h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label>Email</label>
            <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="admin@hospital.com" />
          </div>
          <div>
            <label>Password</label>
            <input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error ? <div className="error" style={{ display: 'block' }}>{error}</div> : null}
          <div className="actions" style={{ marginTop: 8 }}>
            <button className="btn" disabled={busy}>{busy ? 'Please wait…' : (mode === 'login' ? 'Login' : 'Sign up')}</button>
            <button type="button" className="btn ghost" onClick={()=>setMode(mode==='login'?'signup':'login')}>
              {mode === 'login' ? 'Create an account' : 'Already have an account? Login'}
            </button>
          </div>
          <div className="hint">This is for staff/admin only.</div>
        </form>
        {busy ? <div style={{ marginTop: 12 }}><Loader label="Processing…" /></div> : null}
      </div>
    </div>
  )
}
