import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { checkoutId } = req.body

    if (!checkoutId) {
      return res.status(400).json({ success: false, error: 'Missing checkoutId' })
    }

    // Verify with YOCO API
    const yocoRes = await fetch(`https://payments.yoco.com/api/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
      },
    })

    const checkout = await yocoRes.json()

    if (!yocoRes.ok) {
      console.error('❌ YOCO verify error:', checkout)
      return res.status(500).json({ success: false, error: 'YOCO verification failed' })
    }

    console.log('📊 YOCO status:', checkout.status)

    // Check if payment was successful (fixed logic!)
    if (checkout.status === 'succeeded' || checkout.status === 'complete' || checkout.status === 'success' || checkout.status === 'completed') {
        // Payment successful! Extract user_id from metadata
        const user_id = checkout.metadata?.user_id
        const amount_cents = checkout.amount
        const points = Math.floor(amount_cents / 100)

        console.log('🔍 Extracted:', { user_id, amount_cents, points })

        if (!user_id) {
            console.error('❌ ERROR: No user_id found in metadata')
            return res.status(400).json({ success: false, error: 'Missing user_id' })
        }

        console.log(`💰 Payment verified: ${points} points for user ${user_id}`)

        // Create payment record
        const { error: paymentError } = await supabaseAdmin
            .from('payments')
            .insert({
            user_id,
            amount: points,
            status: 'completed',
            provider: 'yoco',
            reference: checkoutId,
            notes: `Automatic YOCO payment - R${points}`,
            })

        if (paymentError) {
            console.error('❌ ERROR: Payment insert failed:', paymentError)
            return res.status(400).json({ success: false, error: paymentError.message })
        }

        console.log('✅ Payment record created')
        // ... rest of code

      // Update user's points
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('current_points')
        .eq('id', user_id)
        .single()

      const newPoints = (profile?.current_points || 0) + points

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ current_points: newPoints })
        .eq('id', user_id)

      if (updateError) {
        console.error('❌ Points update failed:', updateError)
        return res.status(400).json({ success: false, error: updateError.message })
      }

      console.log(`✅ Points added: ${newPoints} total`)

// UPDATE STREAK
    console.log('🔍 Updating user streak...')
    const { error: streakError } = await supabaseAdmin.rpc('update_user_streak', {
      p_user_id: user_id,
    })

    if (streakError) {
      console.error('❌ Streak update failed:', streakError)
    }

    res.status(200).json({ success: true, points_added: points })

    } else {
      return res.status(400).json({ success: false, error: 'Payment not completed' })
    }
  } catch (err) {
    console.error('💥 Verification error:', err)
    res.status(500).json({ success: false, error: 'Server error' })
  }

 // Check if automation is paused (from localStorage stored on client)
    // For production, you'd store this in Supabase
    const automationPaused = false // For now, always process
    // TODO: In Phase 2, store in Supabase and check here
    }
    