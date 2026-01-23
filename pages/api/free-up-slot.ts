import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { eventId, userId } = req.body

  if (!eventId || !userId) {
    return res.status(400).json({ error: 'Missing eventId or userId' })
  }

  const { error } = await supabase.rpc('free_up_slot', {
    p_event_id: eventId,
    p_user_id: userId,
  })

  if (error) {
    console.error(error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ ok: true })
}

