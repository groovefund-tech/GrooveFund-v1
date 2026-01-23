import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function PaymentVerify() {
  const router = useRouter()
  const [status, setStatus] = useState('⏳ Verifying payment...')

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get checkoutId from localStorage
        const checkoutId = localStorage.getItem('pendingCheckoutId')

        if (!checkoutId) {
          setStatus('❌ Payment reference not found')
          setTimeout(() => router.push('/dashboard'), 2000)
          return
        }

        console.log('🔍 Verifying checkout:', checkoutId)

        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutId }),
        })

        const result = await res.json()
        console.log('📊 Verification result:', result)

        if (result.success) {
          setStatus('✅ Payment verified! Adding points...')
          localStorage.removeItem('pendingCheckoutId')
          setTimeout(() => router.push('/dashboard'), 2000)
        } else {
          setStatus(`❌ ${result.error}`)
          setTimeout(() => router.push('/dashboard'), 3000)
        }
      } catch (err) {
        console.error('Verification error:', err)
        setStatus('❌ Verification failed')
        setTimeout(() => router.push('/dashboard'), 3000)
      }
    }

    verifyPayment()
  }, [router])

  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h1>Processing Payment</h1>
      <p style={{ fontSize: 18, color: '#FF751F' }}>{status}</p>
    </div>
  )
}