import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, display_name, phone, current_points, created_at')
      .order('current_points', { ascending: false })

    if (error) {
      console.error('Get members failed:', error)
      return res.status(500).json({ error: 'Failed to fetch members' })
    }

    return res.status(200).json(data || [])
  } catch (err) {
    console.error('Get members crash:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}