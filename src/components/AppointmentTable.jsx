import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Edit2, Trash2, RefreshCw, Save, X } from 'lucide-react'

function formatTime24To12(t) {
  try {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hh = ((h % 12) || 12).toString().padStart(2, '0')
    return `${hh}:${String(m || 0).padStart(2, '0')} ${ampm}`
  } catch { return t }
}

export default function AppointmentTable({ appointments, refresh }) {
  // Filters / search / sort
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('dateAsc')

  // Pagination
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  // Busy-state per row
  const [busyId, setBusyId] = useState(null)

  // Modal state for edit
  const [editing, setEditing] = useState(null) // { id, date, time, reason }
  const [saving, setSaving] = useState(false)
  const [editErr, setEditErr] = useState('')

  // Derived rows (search + filter + sort)
  const rowsFiltered = useMemo(() => {
    let r = [...appointments]
    const q = search.trim().toLowerCase()
    if (q) {
      r = r.filter(a =>
        (a.patients?.name || '').toLowerCase().includes(q) ||
        (a.reason || '').toLowerCase().includes(q) ||
        (a.status || '').toLowerCase().includes(q) ||
        (a.date || '').includes(q)
      )
    }
    if (status) r = r.filter(a => a.status === status)
    switch (sortBy) {
      case 'dateAsc': r.sort((a,b)=> (a.date+a.time).localeCompare(b.date+b.time)); break
      case 'dateDesc': r.sort((a,b)=> (b.date+b.time).localeCompare(a.date+a.time)); break
      case 'nameAsc': r.sort((a,b)=> (a.patients?.name || '').localeCompare(b.patients?.name || '')); break
      case 'nameDesc': r.sort((a,b)=> (b.patients?.name || '').localeCompare(a.patients?.name || '')); break
    }
    return r
  }, [appointments, search, status, sortBy])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(rowsFiltered.length / pageSize))
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [totalPages, page])
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return rowsFiltered.slice(start, start + pageSize)
  }, [rowsFiltered, page, pageSize])

  // Actions
  const toggleStatus = async (id, cur) => {
    setBusyId(id)
    await supabase.from('appointments')
      .update({ status: cur === 'Pending' ? 'Completed' : 'Pending' })
      .eq('id', id)
    setBusyId(null)
    refresh?.()
  }

  const del = async (id) => {
    if (!confirm('Delete this appointment?')) return
    setBusyId(id)
    await supabase.from('appointments').delete().eq('id', id)
    setBusyId(null)
    refresh?.()
  }

  const openEdit = (row) => {
    setEditErr('')
    setEditing({
      id: row.id,
      date: row.date || '',
      time: row.time || '',
      reason: row.reason || ''
    })
  }
  const closeEdit = () => { if (!saving) setEditing(null) }

  const saveEdit = async (e) => {
    e?.preventDefault()
    if (!editing) return
    setEditErr('')
    if (!editing.date) return setEditErr('Date is required')
    if (!/^\d{2}:\d{2}$/.test(editing.time || '')) return setEditErr('Time must be HH:MM (24h)')
    if ((editing.reason || '').trim().length < 3) return setEditErr('Reason must be at least 3 characters')
    setSaving(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ date: editing.date, time: editing.time, reason: editing.reason.trim() })
        .eq('id', editing.id)
      if (error) throw error
      setEditing(null)
      refresh?.()
    } catch (err) {
      setEditErr(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const downloadCsv = () => {
    if (!rowsFiltered.length) return alert('No appointments to export.')
    const header = ['Patient Name','Email','Phone','Date','Time','Reason','Status']
    const dataRows = rowsFiltered.map(a => [
      a.patients?.name || '',
      a.patients?.email || '',
      a.patients?.phone || '',
      a.date || '',
      a.time || '',
      (a.reason || '').replace(/\n/g,' '),
      a.status || ''
    ])
    const csv = [header, ...dataRows].map(r => r.map(c => {
      const s = (c ?? '').toString()
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s
    }).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `appointments_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Small CSS block for modal, using your theme vars */}
      <style>{`
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 60;
          animation: fadeIn .12s ease-out;
        }
        .modal-card {
          width: min(560px, 92vw);
          background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01)), var(--panel);
          border:1px solid rgba(255,255,255,.08);
          border-radius: 16px; padding: 16px;
          box-shadow: var(--shadow);
          transform: translateY(0);
          animation: pop .12s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pop { from { transform: translateY(6px); opacity:.9 } to { transform: translateY(0); opacity:1 } }
        .icon-btn {
          background: transparent; border: 1px solid rgba(255,255,255,.14);
          border-radius: 10px; padding: 6px 8px; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          color: var(--text);
        }
        .icon-btn:disabled { opacity: .6; cursor: default }
        .pagination {
          display:flex; gap:8px; align-items:center; justify-content:flex-end; margin-top:14px; flex-wrap:wrap;
        }
        .page-btn {
          background: transparent; border:1px solid rgba(255,255,255,.14);
          color: var(--text); padding:6px 10px; border-radius:10px; cursor:pointer;
        }
        .page-btn.active { background: var(--soft); }
      `}</style>

      {/* Toolbar */}
      <div className="toolbar" style={{ marginTop: 12 }}>
        <div className="search" role="search">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19zM5 9.5C5 7.01 7.01 5 9.5 5S14 7.01 14 9.5 11.99 14 9.5 14 5 11.99 5 9.5"/></svg>
          <input placeholder="Search by patient, reason, status or date…" value={search} onChange={(e)=>{ setSearch(e.target.value); setPage(1) }} />
        </div>
        <div className="pill">
          <label style={{ color: 'var(--muted)', fontSize: 12 }}>Status</label>
          <select value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1) }} style={{ background: 'transparent', border: 0, color: 'var(--text)', outline: 'none' }}>
            <option value="">All</option>
            <option>Pending</option>
            <option>Completed</option>
          </select>
        </div>
        <div className="pill">
          <label style={{ color: 'var(--muted)', fontSize: 12 }}>Sort</label>
          <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} style={{ background: 'transparent', border: 0, color: 'var(--text)', outline: 'none' }}>
            <option value="dateAsc">Date ↑</option>
            <option value="dateDesc">Date ↓</option>
            <option value="nameAsc">Patient A–Z</option>
            <option value="nameDesc">Patient Z–A</option>
          </select>
        </div>
        <div className="pill">
          <label style={{ color: 'var(--muted)', fontSize: 12 }}>Rows</label>
          <select value={pageSize} onChange={(e)=>{ setPageSize(parseInt(e.target.value,10)); setPage(1) }} style={{ background: 'transparent', border: 0, color: 'var(--text)', outline: 'none' }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <button className="btn muted" type="button" onClick={downloadCsv}>Download CSV</button>
      </div>

      {/* Table */}
      <div className="table-wrap" style={{ display: pagedRows.length ? 'block' : 'none' }}>
        <table aria-describedby="listTitle">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Time</th>
              <th>Reason</th>
              <th>Status</th>
              <th style={{ width: 210 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map(a => (
              <tr key={a.id}>
                <td>{a.patients?.name || '-'}</td>
                <td>{a.date}</td>
                <td>{formatTime24To12(a.time || '')}</td>
                <td>{a.reason}</td>
                <td>
                  <span className={`badge ${a.status==='Completed'?'completed':'pending'}`}>{a.status}</span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="icon-btn" title="Toggle Status" aria-label="Toggle Status" disabled={busyId===a.id} onClick={()=>toggleStatus(a.id, a.status)}>
                      <RefreshCw size={16} />
                    </button>
                    <button className="icon-btn" title="Edit" aria-label="Edit" onClick={()=>openEdit(a)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn" title="Delete" aria-label="Delete" disabled={busyId===a.id} onClick={()=>del(a.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination (bottom, numeric) */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1, p-1))}>{'‹ Prev'}</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} className={`page-btn ${n===page ? 'active' : ''}`} onClick={()=>setPage(n)}>{n}</button>
            ))}
            <button className="page-btn" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages, p+1))}>{'Next ›'}</button>
          </div>
        )}
      </div>

      {!rowsFiltered.length ? <div className="empty">No appointments yet. Book your first one ➝</div> : null}

      {/* Edit Modal */}
      {editing && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit appointment">
          <div className="modal-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <h3 style={{ margin:0, fontSize:18 }}>Edit Appointment</h3>
              <button className="icon-btn" onClick={closeEdit} title="Close" aria-label="Close"><X size={16} /></button>
            </div>
            <form onSubmit={saveEdit} className="edit-form" noValidate>
              <div className="row three" style={{ marginTop: 8 }}>
                <div>
                  <label>Date</label>
                  <input
                    type="date"
                    value={editing.date}
                    onChange={(e)=>setEditing(s=>({ ...s, date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label>Time</label>
                  <input
                    type="time"
                    value={editing.time}
                    onChange={(e)=>setEditing(s=>({ ...s, time: e.target.value }))}
                    required
                  />
                </div>
                <div />
              </div>
              <div style={{ marginTop: 10 }}>
                <label>Reason</label>
                <textarea
                  rows={3}
                  value={editing.reason}
                  onChange={(e)=>setEditing(s=>({ ...s, reason: e.target.value }))}
                  placeholder="e.g., Follow-up, general checkup"
                  required
                />
              </div>
              {editErr ? <div className="error" style={{ display: 'block' }}>{editErr}</div> : null}
              <div className="actions" style={{ marginTop: 12 }}>
                <button className="btn" disabled={saving}>
                  {saving ? 'Saving…' : (<span style={{display:'inline-flex',alignItems:'center',gap:8}}><Save size={16}/> Save</span>)}
                </button>
                <button type="button" className="btn ghost" onClick={closeEdit} disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
