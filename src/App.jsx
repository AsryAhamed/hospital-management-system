import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './components/Auth'
import PatientForm from './components/PatientForm'
import AppointmentForm from './components/AppointmentForm'
import AppointmentTable from './components/AppointmentTable'

export default function App() {
  const [session, setSession] = useState(null)
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  // ---------- Auth wiring ----------
  useEffect(() => {
    let ignore = false
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!ignore) setSession(session)
      setLoading(false)
    }
    init()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => { ignore = true; listener?.subscription?.unsubscribe() }
  }, [])

  // ---------- Data fetchers ----------
  const fetchPatients = async () => {
    const { data, error } = await supabase.from('patients').select('*').order('name', { ascending: true })
    if (!error) setPatients(data || [])
  }

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, date, time, reason, status, patient_id, patients ( name, email, phone )')
      .order('date', { ascending: true })
      .order('time', { ascending: true })
    if (!error) setAppointments(data || [])
  }

  useEffect(() => {
    if (!session) return
    fetchPatients()
    fetchAppointments()
  }, [session])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 60 }}>
        <div className="pill">Loading…</div>
      </div>
    )
  }

  if (!session) return <Auth />

  return (
    <div className="container">
      <header>
        <div className="title">
          <div className="logo" aria-hidden="true"></div>
          <div>
            <h1>Hospital Mini System</h1>
            <div className="sub">Admin Dashboard • Patients & Appointments</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="pill">Patients: {patients.length} • Appointments: {appointments.length}</div>
          <button className="btn ghost" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <section className="grid" aria-label="Forms">
        <div className="card">
          <h2>Patient Registration</h2>
          <PatientForm onSaved={fetchPatients} />
        </div>

        <div className="card">
          <h2>Appointment Booking</h2>
          <AppointmentForm
            patients={patients}
            onSaved={fetchAppointments}
          />
        </div>
      </section>

      <div className="divider" />

      <section className="card" aria-labelledby="listTitle">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <h2 id="listTitle" style={{ margin: 0 }}>All Appointments</h2>
            <div className="sub">Manage status, delete, and export</div>
          </div>
        </div>

        <AppointmentTable
          appointments={appointments}
          refresh={fetchAppointments}
          patients={patients}
        />
      </section>

      <footer>Data is stored in Supabase (PostgreSQL). You can safely refresh or log in from another device.</footer>
    </div>
  )
}
