import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { target_user_id, amount } = req.body

  if (!target_user_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid target_user_id or amount' })
  }

  try {
    // 1. Insert payment row (idempotent via unique constraint)
    const { error: paymentError, data: paymentData } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: target_user_id,
        amount,
        currency: 'ZAR',
        status: 'completed',
        provider: 'admin_backfill',
        provider_event_id: `admin-backfill-${Date.now()}`,
        reference: `Manual backfill`,
      })
      .select()

    if (paymentError) {
      console.error('❌ Payment insert failed:', paymentError)
      return res.status(500).json({ error: 'Payment insert failed' })
    }

    console.log('✅ Payment inserted:', paymentData)

    // 2. Apply points via RPC
    const { data: memberState, error: rpcError } = await supabaseAdmin.rpc(
      'apply_payment',
      {
        p_user_id: target_user_id,
        p_amount: amount,
      }
    )

    if (rpcError) {
      console.error('❌ apply_payment RPC failed:', rpcError)
      return res.status(500).json({ error: 'apply_payment failed' })
    }

    console.log('✅ Points applied. New member_state:', memberState)

    // Update user streak
    const { error: streakError } = await supabaseAdmin.rpc('update_user_streak', {
      user_id: target_user_id,  // or whatever the user_id variable is
    })

    

    // 3. Return updated state
    return res.status(200).json({
      ok: true,
      payment: paymentData,
      memberState,
    })
  } catch (err) {
    console.error('🔥 Backfill crash:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}