'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'

export default function TrainerDashboard() {
  const { getToken, isLoaded } = useAuth()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newSession, setNewSession] = useState({ title: '', date: '', startTime: '', endTime: '', batchId: '' })
  const [newBatch, setNewBatch] = useState({ name: '', institutionId: '' })

  const [sessionAttendance, setSessionAttendance] = useState({ sessionId: null, data: [] })

  useEffect(() => {
    if (isLoaded) fetchBatches()
  }, [isLoaded])

  const fetchAttendance = async (sessionId) => {
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch attendance')
      const data = await res.json()
      setSessionAttendance({ sessionId, data })
    } catch (err) {
      alert(err.message)
    }
  }

  const fetchBatches = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/trainer`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch batches')
      const data = await res.json()
      setBatches(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateInvite = async (batchId) => {
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/${batchId}/invite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to generate invite')
      const data = await res.json()
      alert(`Invite Code: ${data.inviteCode}\nLink: ${data.inviteLink}`)
      fetchBatches()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCreateBatch = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newBatch)
      })
      if (!res.ok) throw new Error('Failed to create batch')
      alert('Batch created successfully')
      setNewBatch({ name: '', institutionId: '' })
      fetchBatches()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCreateSession = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newSession)
      })
      if (!res.ok) throw new Error('Failed to create session')
      alert('Session created successfully')
      setNewSession({ title: '', date: '', startTime: '', endTime: '', batchId: '' })
      fetchBatches()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="container">Loading...</div>

  return (
    <div className="container">
      <div className="header">
        <h1>Trainer Dashboard</h1>
      </div>

      {error && <div style={{ color: 'var(--error-color)' }}>{error}</div>}

      <div className="grid" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3>1. Create New Batch</h3>
          <p style={{ fontSize: '0.8rem', marginBottom: '1rem', opacity: 0.8 }}>Create a batch first, then you can add sessions to it.</p>
          <form onSubmit={handleCreateBatch}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Batch Name (e.g. Computer Science 2024)" 
              value={newBatch.name} 
              onChange={e => setNewBatch({...newBatch, name: e.target.value})}
              required 
            />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Institution ID (Optional for prototype)" 
              value={newBatch.institutionId} 
              onChange={e => setNewBatch({...newBatch, institutionId: e.target.value})}
            />
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Create Batch</button>
          </form>
        </div>

        <div className="card">
          <h3>2. Create New Session</h3>
          <form onSubmit={handleCreateSession}>
            <select 
              className="input-field" 
              value={newSession.batchId} 
              onChange={e => setNewSession({...newSession, batchId: e.target.value})}
              required
            >
              <option value="">-- Select Batch --</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Session Title" 
              value={newSession.title} 
              onChange={e => setNewSession({...newSession, title: e.target.value})}
              required 
            />
            <input 
              type="date" 
              className="input-field" 
              value={newSession.date} 
              onChange={e => setNewSession({...newSession, date: e.target.value})}
              required 
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="time" 
                className="input-field" 
                value={newSession.startTime} 
                onChange={e => setNewSession({...newSession, startTime: e.target.value})}
                required 
              />
              <input 
                type="time" 
                className="input-field" 
                value={newSession.endTime} 
                onChange={e => setNewSession({...newSession, endTime: e.target.value})}
                required 
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Create Session</button>
          </form>
        </div>
      </div>

      <h2>Your Batches</h2>
      <div className="grid">
        {batches.length === 0 && <p>No batches assigned to you yet.</p>}
        {batches.map(batch => (
          <div key={batch.id} className="card">
            <h3>{batch.name}</h3>
            {batch.inviteCode ? (
              <p style={{ color: 'var(--secondary-color)' }}>Invite Code: {batch.inviteCode}</p>
            ) : (
              <p>No active invite code.</p>
            )}
            <button onClick={() => generateInvite(batch.id)} className="btn-primary" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              {batch.inviteCode ? 'Regenerate Invite' : 'Generate Invite'}
            </button>
            
            <h4>Sessions:</h4>
            {batch.sessions && batch.sessions.length > 0 ? (
              <ul style={{ paddingLeft: '0', listStyle: 'none' }}>
                {batch.sessions.map(s => (
                  <li key={s.id} style={{ marginBottom: '1rem', padding: '0.5rem', border: '1px solid #333', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem' }}>{s.title} ({new Date(s.date).toLocaleDateString()})</span>
                      <button 
                        onClick={() => fetchAttendance(s.id)}
                        className="btn-primary" 
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                      >
                        {sessionAttendance.sessionId === s.id ? 'Close' : 'View Attendance'}
                      </button>
                    </div>
                    {sessionAttendance.sessionId === s.id && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', backgroundColor: '#1a1a1a', padding: '0.5rem', borderRadius: '4px' }}>
                        {sessionAttendance.data.length === 0 ? <p>No attendance marked yet.</p> : (
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>
                                <th>Student</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sessionAttendance.data.map(att => (
                                <tr key={att.id}>
                                  <td>{att.student.name}</td>
                                  <td style={{ color: att.status === 'PRESENT' ? '#4caf50' : att.status === 'LATE' ? '#ff9800' : '#f44336' }}>{att.status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No sessions yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
