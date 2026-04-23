'use client'
import { useState } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const { user, isLoaded: userLoaded } = useUser()
  const { getToken, isLoaded: authLoaded } = useAuth()
  const router = useRouter()
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!userLoaded || !authLoaded) return <div className="container">Loading...</div>

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!role) return setError('Please select a role')
    setLoading(true)
    setError('')

    try {
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          name: user.fullName || user.primaryEmailAddress?.emailAddress || "Unknown",
          role: role
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save user')
      }

      // Force Clerk to reload the user to pick up the new publicMetadata role
      await user.reload()
      
      // Now redirect, and middleware will see the role
      window.location.href = '/'
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h2>Welcome to SkillBridge!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Please select your role to continue.</p>
        
        {error && <div style={{ color: 'var(--error-color)', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <select 
            className="input-field" 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">-- Select a Role --</option>
            <option value="STUDENT">Student</option>
            <option value="TRAINER">Trainer</option>
            <option value="INSTITUTION">Institution</option>
            <option value="PROGRAMME_MANAGER">Programme Manager</option>
            <option value="MONITORING_OFFICER">Monitoring Officer</option>
          </select>
          
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '16px' }}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
