import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Let Supabase handle the URL hash automatically
        const { data, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !data?.session) {
          console.error('Session error:', sessionError)
          setError('Failed to restore session')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        // Check if this is a password recovery
        const hash = window.location.hash
        const params = new URLSearchParams(hash.substring(1))
        const type = params.get('type')

        if (type === 'recovery') {
          // Go to reset password form
          router.push('/reset-password')
        } else {
          // Go to dashboard for magic link logins
          router.push('/dashboard')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('Authentication failed')
        setTimeout(() => router.push('/login'), 2000)
      } finally {
        setLoading(false)
      }
    }

    // Give Supabase a moment to process the hash
    setTimeout(handleAuthCallback, 500)
  }, [router])

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div>Processing authentication...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#d32f2f' }}>
        <div>❌ {error}</div>
        <div style={{ fontSize: 12, marginTop: 8 }}>Redirecting...</div>
      </div>
    )
  }

  return null
}