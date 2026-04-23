'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'

export default function MonitoringOfficerDashboard() {
  const { getToken, isLoaded } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoaded) fetchSummary()
  }, [isLoaded])

  const fetchSummary = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/programme/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch programme summary')
      const data = await res.json()
      setSummary(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="container">Loading...</div>

  return (
    <div className="container">
      <div className="header">
        <h1>Monitoring Officer Dashboard</h1>
      </div>

      {error && <div style={{ color: 'var(--error-color)' }}>{error}</div>}

      {summary && (
        <>
          <div className="grid">
            <div className="card">
              <h3>Programme Batches</h3>
              <p style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{summary.totalBatches}</p>
            </div>
            <div className="card">
              <h3>Programme Students</h3>
              <p style={{ fontSize: '2rem', color: 'var(--secondary-color)' }}>{summary.totalStudents}</p>
            </div>
            <div className="card">
              <h3>Programme Attendance Rate</h3>
              <p style={{ fontSize: '2rem', color: '#4caf50' }}>{summary.attendanceRate}</p>
            </div>
            <div className="card">
              <h3>Total Sessions</h3>
              <p style={{ fontSize: '2rem' }}>{summary.totalSessions}</p>
            </div>
          </div>

          <h2 style={{ marginTop: '2rem' }}>Institution Breakdown</h2>
          <div className="grid">
            {summary.institutions && summary.institutions.map(inst => (
              <div key={inst.id} className="card">
                <h3>{inst.name}</h3>
                <p>Batches: {inst.totalBatches}</p>
                <p>Students: {inst.totalStudents}</p>
                <p style={{ fontWeight: 'bold', color: '#4caf50' }}>Rate: {inst.attendanceRate}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
