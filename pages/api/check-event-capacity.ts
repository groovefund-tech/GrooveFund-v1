import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

interface CapacityCheckRequest {
  event_id: string
}

interface CapacityCheckResponse {
  can_join: boolean
  available_slots: number
  current_members: number
  capacity: number
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CapacityCheckResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      can_join: false, 
      available_slots: 0, 
      current_members: 0, 
      capacity: 0,
      error: 'Method not allowed' 
    })
  }

  const { event_id } = req.body as CapacityCheckRequest

  if (!event_id) {
    return res.status(400).json({ 
      can_join: false, 
      available_slots: 0, 
      current_members: 0, 
      capacity: 0,
      error: 'Missing event_id' 
    })
  }

  try {
    // Get event capacity
    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, capacity')
      .eq('id', event_id)
      .single()

    if (eventError || !eventData) {
      return res.status(404).json({ 
        can_join: false, 
        available_slots: 0, 
        current_members: 0, 
        capacity: 0,
        error: 'Event not found' 
      })
    }

    // Count current active members (excluding those without tickets issued)
    const { count: currentCount, error: countError } = await supabaseAdmin
      .from('event_members')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id)
      .eq('active', true)

    if (countError) {
      return res.status(500).json({ 
        can_join: false, 
        available_slots: 0, 
        current_members: 0, 
        capacity: 0,
        error: 'Failed to check capacity' 
      })
    }

    const current = currentCount || 0
    const available = Math.max(0, eventData.capacity - current)
    const can_join = available > 0

    return res.status(200).json({
      can_join,
      available_slots: available,
      current_members: current,
      capacity: eventData.capacity,
    })
  } catch (err) {
    console.error('check-event-capacity error:', err)
    return res.status(500).json({ 
      can_join: false, 
      available_slots: 0, 
      current_members: 0, 
      capacity: 0,
      error: 'Internal server error' 
    })
  }
}