import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface TicketIssueRequest {
  event_id: string
  member_id: string
  admin_user_id: string
}

interface TicketResponse {
  ok: boolean
  ticket_id?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TicketResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
        error: 'Method not allowed',
        ok: false
    })
  }

  const { event_id, member_id, admin_user_id } = req.body as TicketIssueRequest

  if (!event_id || !member_id || !admin_user_id) {
    return res.status(400).json({
        error: 'Missing required fields',
        ok: false
    })
  }

  try {
    // 1. Generate unique ticket ID
    const ticketId = `GF-${event_id.slice(0, 8).toUpperCase()}-${member_id.slice(0, 8).toUpperCase()}-${Date.now()}`

    // 2. Get event details
    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, name, start_at, venue')
      .eq('id', event_id)
      .single()

    if (eventError || !eventData) {
      return res.status(404).json({
          error: 'Event not found',
          ok: false
      })
    }

    // 3. Get member details
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, display_name')
      .eq('id', member_id)
      .single()

    if (memberError || !memberData) {
      return res.status(404).json({
          error: 'Member not found',
          ok: false
      })
    }

    // 4. Mark ticket as issued in event_members
    const { error: updateError } = await supabaseAdmin
      .from('event_members')
      .update({
        ticket_issued: true,
        ticket_id: ticketId,
        ticket_issued_at: new Date().toISOString(),
      })
      .eq('user_id', member_id)
      .eq('event_id', event_id)

    if (updateError) {
      console.error('Failed to mark ticket as issued:', updateError)
      return res.status(500).json({
          error: 'Failed to issue ticket',
          ok: false
      })
    }

    // 5. Create audit log entry
    try {
      await supabaseAdmin.from('action_log').insert({
        action: 'ticket_issued',
        user_id: admin_user_id,
        target_user_id: member_id,
        event_id: event_id,
        ticket_id: ticketId,
        details: `Ticket issued for ${eventData.name}`,
        created_at: new Date().toISOString(),
      })
    } catch (logErr) {
      console.log('action_log table not found, skipping audit log')
    }

    // 6. Send email via Resend
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF751F;">Your GrooveFund Ticket</h2>
        
        <p>Hi ${memberData.display_name},</p>
        
        <p>Great news! Your ticket for <strong>${eventData.name}</strong> is ready. 🎵</p>
        
        <div style="background: #FFF5ED; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF751F;">
          <h3 style="margin-top: 0; color: #FF751F;">Event Details</h3>
          <p style="margin: 8px 0;"><strong>Event:</strong> ${eventData.name}</p>
          <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(eventData.start_at).toLocaleDateString()}</p>
          <p style="margin: 8px 0;"><strong>Venue:</strong> ${eventData.venue}</p>
          <p style="margin: 8px 0;"><strong>Ticket ID:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${ticketId}</code></p>
        </div>

        <p><strong>What to do next:</strong></p>
        <ul>
          <li>Your ticket PDF is attached to this email</li>
          <li>Show the ticket ID at the entrance</li>
          <li>If you have any questions, reply to this email</li>
        </ul>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This email was sent on ${new Date().toLocaleString()} - Keep this for your records.
        </p>
      </div>
    `

    try {
      const emailResponse = await resend.emails.send({
        from: 'GrooveFund <onboarding@resend.dev>',
        to: memberData.email,
        subject: `Your GrooveFund Ticket: ${eventData.name}`,
        html: emailHtml,
      })
      console.log('Email sent successfully:', emailResponse)
    } catch (emailErr) {
      console.error('Email send failed:', emailErr)
      // Don't fail the whole request if email fails
    }

    return res.status(200).json({
      ok: true,
      ticket_id: ticketId,
    })
  } catch (err) {
    console.error('issue-ticket error:', err)
    return res.status(500).json({
        error: 'Internal server error',
        ok: false
    })
  }
}