import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { target_user_id, amount, notes, admin_user_id } = req.body

  if (!target_user_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Missing params' })
  }

  try {
    // 1. Insert payment
    const { error: paymentInsertError, data: insertedPayment } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: target_user_id,
        amount,
        currency: 'ZAR',
        status: 'pending_verification',
        provider: 'admin',
        provider_event_id: `admin-${target_user_id}-${Date.now()}`,
      })
      .select()

    if (paymentInsertError) {
      console.error('Payment insert failed:', paymentInsertError)
      return res.status(500).json({ error: 'Payment insert failed' })
    }

    const paymentId = insertedPayment[0].id

    // 2. Insert approval audit trail
    const { error: approvalInsertError } = await supabaseAdmin
      .from('payment_approvals')
      .insert({
        payment_id: paymentId,
        approved_by: admin_user_id,
        notes: notes || 'Manual approval from admin dashboard',
        status: 'approved'
      })

    if (approvalInsertError) {
      console.error('Approval insert failed:', approvalInsertError)
      return res.status(500).json({ error: 'Approval audit trail failed' })
    }

    // Log the payment approval
    await supabaseAdmin.from('audit_log').insert({
      action: 'payment_approved',
      user_id: admin_user_id,
      target_user_id: target_user_id,
      details: { amount, notes },
      created_at: new Date().toISOString(),
    })

    // 3. Apply points
    const { data: pointsData, error: rpcError } = await supabaseAdmin.rpc('apply_payment', {
      p_user_id: target_user_id,
      p_amount: amount,
    })

    if (rpcError) {
      console.error('apply_payment failed:', rpcError)
      return res.status(500).json({ error: 'apply_payment failed' })
    }

    // ✅ 4. UPDATE STREAK (ADD THIS)
    console.log('🔍 Calling update_user_streak for:', target_user_id)
    const { data: streakData, error: streakError } = await supabaseAdmin.rpc('update_user_streak', {
      p_user_id: target_user_id,
    })

    if (streakError) {
      console.error('🔍 update_user_streak failed:', streakError)
    } else {
      console.log('🔍 update_user_streak success:', streakData)
    }

    return res.status(200).json({ ok: true, memberState: pointsData, streak: streakData })

  } catch (err) {
    console.error('Admin apply-payment crash:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}