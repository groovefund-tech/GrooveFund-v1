import { createClient } from '@supabase/supabase-js'

// Use ADMIN client with service role key
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { event_id, user_id, file_base64, file_name } = req.body

    const parts = file_base64.split(',')
    const buffer = Buffer.from(parts[1], 'base64')
    
    const fileName = `${event_id}/${user_id}/${Date.now()}-${file_name}`

    console.log('📤 Uploading with ADMIN client...')

    // Upload with admin client (bypasses RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('tickets')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      return res.status(400).json({ error: uploadError.message })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('tickets')
      .getPublicUrl(fileName)

    // Update with admin client (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from('event_members')
      .update({ ticket_url: publicUrl })
      .eq('event_id', event_id)
      .eq('user_id', user_id)

    if (updateError) {
      return res.status(400).json({ error: updateError.message })
    }

    res.status(200).json({ success: true, ticket_url: publicUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}