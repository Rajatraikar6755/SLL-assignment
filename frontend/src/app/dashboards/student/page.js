'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'

export default function StudentDashboard() {
  const { getToken, isLoaded } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [joinMessage, setJoinMessage] = useState('')

  useEffect(() => {
    if (isLoaded) {
      fetchSessions()
    }
  }, [isLoaded])

  const fetchSessions = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch sessions')
      const data = await res.json()
      setSessions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinBatch = async (e) => {
    e.preventDefault()
    setJoinMessage('Joining...')
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ inviteCode })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join batch')
      setJoinMessage('Successfully joined!')
      setInviteCode('')
      fetchSessions()
    } catch (err) {
      setJoinMessage(err.message)
    }
  }

  const markAttendance = async (sessionId, status) => {
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/mark`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ sessionId, status })
      })
      if (!res.ok) throw new Error('Failed to mark attendance')
      fetchSessions() // Refresh data
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="container">Loading...</div>

  return (
    <div className="container">
      <div className="header">
        <h1>Student Dashboard</h1>
      </div>

      {error && <div style={{ color: 'var(--error-color)' }}>{error}</div>}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Your Overview</h3>
        {sessions.length > 0 ? (
          <p style={{ fontSize: '1.2rem' }}>
            Overall Attendance: 
            <span style={{ marginLeft: '0.5rem', fontWeight: 'bold', color: '#4caf50' }}>
              {((sessions.filter(s => s.attendances && s.attendances.length > 0 && (s.attendances[0].status === 'PRESENT' || s.attendances[0].status === 'LATE')).length / sessions.length) * 100).toFixed(1)}%
            </span>
          </p>
        ) : (
          <p>No attendance data yet.</p>
        )}
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Join a Batch</h3>
        <form onSubmit={handleJoinBatch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Enter Invite Code" 
            className="input-field" 
            value={inviteCode} 
            onChange={(e) => setInviteCode(e.target.value)} 
            style={{ margin: 0, flex: 1 }}
          />
          <button type="submit" className="btn-primary">Join</button>
        </form>
        {joinMessage && <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{joinMessage}</p>}
      </div>

      <h2>Your Sessions</h2>
      <div className="grid">
        {sessions.length === 0 && <p>No sessions found. Join a batch first!</p>}
        {sessions.map(session => {
          const attendance = session.attendances && session.attendances.length > 0 ? session.attendances[0] : null
          return (
            <div key={session.id} className="card">
              <h3>{session.title}</h3>
              <p><strong>Batch:</strong> {session.batch.name}</p>
              <p><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}</p>
              
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Your Status:</strong> {attendance ? attendance.status : 'Not marked'}</p>
                {!attendance && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button onClick={() => markAttendance(session.id, 'PRESENT')} className="btn-primary" style={{ backgroundColor: '#4caf50' }}>Present</button>
                    <button onClick={() => markAttendance(session.id, 'LATE')} className="btn-primary" style={{ backgroundColor: '#ff9800' }}>Late</button>
                    <button onClick={() => markAttendance(session.id, 'ABSENT')} className="btn-primary" style={{ backgroundColor: '#f44336' }}>Absent</button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
