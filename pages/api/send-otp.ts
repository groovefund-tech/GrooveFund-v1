// pages/api/send-otp.ts
// Secure OTP flow - stores code in Supabase, never returns it to client

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function cleanPhoneNumber(phone: string): string {
  let clean = phone.replace(/\s+/g, '').replace(/^0/, '')
  if (!clean.startsWith('+27') && !clean.startsWith('27')) {
    clean = '27' + clean
  }
  if (!clean.startsWith('+')) {
    clean = '+' + clean
  }
  return clean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { phone } = req.body

  if (!phone) {
    return res.status(400).json({ error: 'Phone number required' })
  }

  const cleanPhone = cleanPhoneNumber(phone)

  // Basic SA number validation
  if (!cleanPhone.match(/^\+27[6-8][0-9]{8}$/)) {
    return res.status(400).json({ error: 'Please enter a valid South African number' })
  }

  // Rate limit: check if a code was sent in the last 60 seconds
  const { data: existing } = await supabase
    .from('phone_verifications')
    .select('created_at')
    .eq('phone', cleanPhone)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    const secondsAgo = (Date.now() - new Date(existing.created_at).getTime()) / 1000
    if (secondsAgo < 60) {
      return res.status(429).json({
        error: `Please wait ${Math.ceil(60 - secondsAgo)} seconds before requesting a new code`
      })
    }
  }

  const code = generateOTP()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min

  try {
    // ✅ Store OTP in Supabase - never send to client
    const { error: storeError } = await supabase
      .from('phone_verifications')
      .upsert({
        phone: cleanPhone,
        otp_code: code,
        expires_at: expiresAt,
        attempts: 3,        // allow 3 attempts before lockout
        verified: false,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'phone'
      })

    if (storeError) {
      console.error('Failed to store OTP:', storeError)
      return res.status(500).json({ error: 'Failed to generate code. Try again.' })
    }

    // Send via BulkSMS
    const tokenId = process.env.BULKSMS_TOKEN_ID
    const tokenSecret = process.env.BULKSMS_TOKEN_SECRET

    if (!tokenId || !tokenSecret) {
      console.error('BulkSMS credentials not configured')
      return res.status(500).json({ error: 'SMS service not configured' })
    }

    const auth = Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64')

    const smsResponse = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        to: cleanPhone,
        body: `Your GrooveFund code: ${code}. Valid for 5 minutes. Do not share this code.`,
        from: { type: 'ALPHANUMERIC', address: 'GrooveFund' }
      })
    })

    if (!smsResponse.ok) {
      const smsError = await smsResponse.json()
      console.error('BulkSMS error:', smsError)
      return res.status(500).json({ error: 'Failed to send SMS. Try again.' })
    }

    // ✅ Only return success - NO otp in response
    return res.status(200).json({
      success: true,
      message: 'Code sent successfully'
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    return res.status(500).json({ error: 'Failed to send verification code' })
  }
}
