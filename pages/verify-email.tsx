import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function VerifyEmail() {
  const [message, setMessage] = useState('Check your email for verification link')
  const [verified, setVerified] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already verified
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email_confirmed_at) {
        setVerified(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    }
    checkSession()
  }, [router])

  return (
    <div style={{ padding: 32, maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
      <h1>📧 Verify Your Email</h1>
      <p>{message}</p>
      {verified && <p style={{ color: 'green' }}>✅ Verified! Redirecting to dashboard...</p>}
      <p style={{ fontSize: 14, color: '#666', marginTop: 24 }}>
        Didn't get the email? Check spam folder. Magic link expires in 24 hours.
      </p>
    </div>
  )
}