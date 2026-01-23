import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, event_date, location, city, venue, ticket_type, capacity, status, price, slot_cost, image_url } = req.body

  if (!name || !event_date || !venue || !capacity) {
    return res.status(400).json({ error: 'Missing required fields: name, event_date, venue, capacity' })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({
        name,
        event_date,
        location: location || venue,
        city: city || 'TBD',
        venue,
        ticket_type: ticket_type || 'General Entry',
        capacity,
        status: status || 'open',
        start_at: event_date ? new Date(event_date).toISOString() : null,
        price: price || null,
        slot_cost: slot_cost || 1,
        image_url: image_url || null,
      })
      .select()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(201).json({ success: true, event: data?.[0] })
  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
}