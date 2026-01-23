import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { amount } = req.body

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' })
  }

  // Get user from auth header
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const token = authHeader.replace('Bearer ', '')

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid session' })
  }

  /**
   * STUB: Pretend we created a YOCO checkout
   * Later this becomes a real YOCO API call
   */
  const fakeCheckoutUrl = `/dashboard?topup=pending&amount=${amount}`

  return res.status(200).json({
    checkoutUrl: fakeCheckoutUrl,
    preview: {
      amount,
      points_after: amount, // 1 ZAR = 1 point
      slots_after: Math.floor(amount / 500),
    },
  })
}
