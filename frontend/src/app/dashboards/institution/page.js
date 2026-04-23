'use client'
import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'

export default function InstitutionDashboard() {
  const { getToken, isLoaded: authLoaded } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoaded && userLoaded) {
      fetchSummary()
    }
  }, [authLoaded, userLoaded])

  const fetchSummary = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/institutions/${user.id}/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch institution summary')
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
        <h1>Institution Dashboard</h1>
      </div>

      {error && <div style={{ color: 'var(--error-color)' }}>{error}</div>}

      {summary && (
        <>
          <div className="grid">
            <div className="card">
              <h3>Total Batches</h3>
              <p style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{summary.totalBatches}</p>
            </div>
            <div className="card">
              <h3>Total Students</h3>
              <p style={{ fontSize: '2rem', color: 'var(--secondary-color)' }}>{summary.totalStudents}</p>
            </div>
            <div className="card">
              <h3>Attendance Rate</h3>
              <p style={{ fontSize: '2rem', color: '#4caf50' }}>{summary.attendanceRate}</p>
            </div>
            <div className="card">
              <h3>Sessions Held</h3>
              <p style={{ fontSize: '2rem' }}>{summary.totalSessions}</p>
            </div>
          </div>

          <h2 style={{ marginTop: '2rem' }}>Batch Performance</h2>
          <div className="grid">
            {summary.batches && summary.batches.map(batch => (
              <div key={batch.id} className="card">
                <h3>{batch.name}</h3>
                <p>Students: {batch.totalStudents}</p>
                <p>Sessions: {batch.totalSessions}</p>
                <p style={{ fontWeight: 'bold', color: '#4caf50' }}>Rate: {batch.attendanceRate}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
