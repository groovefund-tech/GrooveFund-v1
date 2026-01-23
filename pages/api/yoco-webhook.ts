// pages/api/yoco-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const event = req.body

  // Only handle successful payments
  if (event.type !== 'payment.succeeded') {
    return res.status(200).json({ ignored: true })
  }

  const payment = event.data

  // 1. Extract UUID from reference (format: "GROOVE-<uuid>")
  const referencePattern = /^GROOVE-([a-f0-9-]{36})$/
  const match = payment.reference?.match(referencePattern)
  const userId = match?.[1]

  if (!userId) {
    console.error('Invalid reference format — must be GROOVE-<uuid>', {
      reference: payment.reference,
      provider_event_id: payment.id,
    })
    return res.status(400).json({ error: 'Invalid payment reference format' })
  }

  // 2. Verify the user exists in your system
  const { data: userExists, error: userError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (userError || !userExists) {
    console.error('User not found for UUID:', userId)
    return res.status(400).json({ error: 'User not found' })
  }

  try {
    // 3. Insert payment (idempotent — won't duplicate if same reference comes twice)
    const { data: insertedPayment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .upsert(
        {
          user_id: userId,
          amount: payment.amount / 100, // Yoco sends in cents
          currency: payment.currency,
          status: 'pending_verification', // ✅ Needs manual approval
          provider: 'yoco',
          provider_event_id: payment.id,
          reference: payment.reference, // Store the actual reference
          referenced_user_id: userId, // For audit
        },
        { onConflict: 'provider,provider_event_id' }
      )
      .select()

    if (paymentError) {
      console.error('Payment insert failed:', paymentError)
      return res.status(500).json({ error: 'Payment insert failed' })
    }

    

    console.log('✅ Payment logged as pending_verification', {
      user_id: userId,
      amount: payment.amount / 100,
      reference: payment.reference,
      status: 'pending_verification',
    })

    // Update user streak
    const { error: streakError } = await supabaseAdmin.rpc('update_user_streak', {
      user_id: userId,  // or whatever the user_id variable is
    })

    // 4. Return success immediately
    // (Payment sits in pending_verification until you approve it in admin dashboard)
    return res.status(200).json({ ok: true, paymentId: insertedPayment[0].id })

  } catch (err) {
    console.error('Yoco webhook crash:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}