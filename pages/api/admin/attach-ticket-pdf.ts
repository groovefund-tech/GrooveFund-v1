import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface AttachPdfRequest {
  event_id: string
  member_id: string
  pdf_base64: string // Base64 encoded PDF
  pdf_filename: string
}

interface AttachPdfResponse {
  ok: boolean
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AttachPdfResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const { event_id, member_id, pdf_base64, pdf_filename } = req.body as AttachPdfRequest

  if (!event_id || !member_id || !pdf_base64) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' })
  }

  try {
    // 1. Get member details
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, display_name')
      .eq('id', member_id)
      .single()

    if (memberError || !memberData) {
      return res.status(404).json({ ok: false, error: 'Member not found' })
    }

    // 2. Get event details
    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, name, start_at, venue')
      .eq('id', event_id)
      .single()

    if (eventError || !eventData) {
      return res.status(404).json({ ok: false, error: 'Event not found' })
    }

    // 3. Get ticket info from event_members
    const { data: ticketData, error: ticketError } = await supabaseAdmin
      .from('event_members')
      .select('ticket_id')
      .eq('user_id', member_id)
      .eq('event_id', event_id)
      .single()

    if (ticketError || !ticketData?.ticket_id) {
      return res.status(404).json({ ok: false, error: 'Ticket not found. Issue ticket first.' })
    }

    const ticketId = ticketData.ticket_id

    // 4. Convert base64 to buffer for attachment
    const pdfBuffer = Buffer.from(pdf_base64, 'base64')

    // 5. Send email with PDF attachment
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
          <li>Save it or take a screenshot</li>
          <li>Show it at the entrance to the event</li>
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
        attachments: [
          {
            filename: pdf_filename || 'ticket.pdf',
            content: pdfBuffer,
          },
        ],
      })
      console.log('Email with PDF sent:', emailResponse)
    } catch (emailErr) {
      console.error('Email send failed:', emailErr)
      return res.status(500).json({ ok: false, error: 'Failed to send email with PDF' })
    }

    // 6. Log the action
    try {
      await supabaseAdmin.from('audit_log').insert({
        action: 'ticket_pdf_sent',
        target_user_id: member_id,
        event_id: event_id,
        details: { ticket_id: ticketId, pdf_filename },
        created_at: new Date().toISOString(),
      })
    } catch (logErr) {
      console.log('audit_log error:', logErr)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('attach-ticket-pdf error:', err)
    return res.status(500).json({ ok: false, error: 'Internal server error' })
  }
}