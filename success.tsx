import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function PaymentSuccess() {
  const router = useRouter()

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/dashboard?refresh=true')
    }, 1500) // small buffer for webhook

    return () => clearTimeout(timeout)
  }, [router])

  return <p>Payment confirmed. Updating your balance…</p>
}

