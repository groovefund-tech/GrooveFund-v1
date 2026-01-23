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
    const { event_id, user_id, ticket_url, admin_user_id } = req.body

    // Verify admin
    const { data: adminCheck } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', admin_user_id)
      .eq('role', 'admin')
      .single()

    if (!adminCheck) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Update ticket URL
    const { error } = await supabaseAdmin
      .from('event_members')
      .update({ ticket_url })
      .eq('event_id', event_id)
      .eq('user_id', user_id)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}