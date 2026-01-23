import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    userId,
    amount,
    currency,
    provider,
    providerEventId,
    reference
  } = req.body

  if (!userId || !amount || !provider || !providerEventId) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const { error } = await supabase.rpc('apply_payment', {
    p_user_id: userId,
    p_amount_rands: amount,
    p_currency: currency ?? 'ZAR',
    p_provider: provider,
    p_provider_event_id: providerEventId,
    p_reference: reference ?? null
  })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ ok: true })
}

