import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSendReset = async () => {
    if (!email) {
      setError('Please enter your email')
      return
    }

    setError('')
    setMessage('')
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth-callback`,
      })

      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }

      setMessage('✅ Check your email for the password reset link')
      setEmail('')
    } catch (err) {
      setError('Failed to send reset email')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 400 }}>
      <h1>Reset Your Password</h1>

      {error && (
        <div style={{ color: '#d32f2f', marginBottom: 16, padding: 12, backgroundColor: '#ffebee', borderRadius: 4 }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ color: '#4caf50', marginBottom: 16, padding: 12, backgroundColor: '#f1f8e9', borderRadius: 4 }}>
          {message}
        </div>
      )}

      <p style={{ marginBottom: 16, color: '#666' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSendReset()}
        style={{
          width: '100%',
          padding: 12,
          marginBottom: 16,
          border: '1px solid #ddd',
          borderRadius: 6,
          fontSize: 14,
        }}
      />

      <button
        onClick={handleSendReset}
        disabled={loading}
        style={{
          width: '100%',
          padding: 12,
          background: '#FF751F',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>

      <p style={{ marginTop: 16, textAlign: 'center' }}>
        <Link href="/login" style={{ color: '#FF751F', textDecoration: 'none' }}>
          Back to login
        </Link>
      </p>
    </div>
  )
}