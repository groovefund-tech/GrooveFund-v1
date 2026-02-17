// pages/api/verify-otp.ts
// Secure OTP verification and user creation

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function cleanPhoneNumber(phone: string): string {
  let clean = phone.replace(/\s/g, '')
  if (clean.startsWith('0')) {
    clean = '+27' + clean.substring(1)
  } else if (clean.startsWith('27')) {
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

  try {
    const { phone, otp } = req.body

    // 1. Validate input
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' })
    }

    const cleanPhone = cleanPhoneNumber(phone)

    // 2. Look up verification record
    const { data: verification, error: lookupError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('phone', cleanPhone)
      .single()

    if (lookupError || !verification) {
      return res.status(400).json({ error: 'Invalid code. Please request a new one.' })
    }

    // 3. Check attempts remaining
    if (verification.attempts <= 0) {
      return res.status(400).json({ error: 'Too many attempts. Request a new code.' })
    }

    // 4. Check expiration
    const now = new Date()
    const expiresAt = new Date(verification.expires_at)
    if (now > expiresAt) {
      return res.status(400).json({ error: 'Code expired. Request a new one.' })
    }

    // 5. Check OTP match
    if (verification.otp_code !== otp) {
      // Decrement attempts
      await supabase
        .from('phone_verifications')
        .update({ attempts: verification.attempts - 1 })
        .eq('phone', cleanPhone)

      const remaining = verification.attempts - 1
      return res.status(400).json({
        error: remaining > 0
          ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many attempts. Request a new code.'
      })
    }

    // 6. OTP is valid! Mark as verified
    await supabase
      .from('phone_verifications')
      .update({ verified: true })
      .eq('phone', cleanPhone)

    // 7. Check if user already exists
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', cleanPhone)
      .limit(1)

    if (existingUsers && existingUsers.length > 0) {
      // User exists - sign them in instead
      return res.status(200).json({
        success: true,
        redirect: '/dashboard'
      })
    }

    // 8. Create new Supabase user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone: cleanPhone,
      phone_confirm: true,
      user_metadata: { phone: cleanPhone }
    })

    if (authError) {
      console.error('Failed to create user:', authError)
      return res.status(500).json({ error: 'Failed to create account. Try again.' })
    }

    // 9. Create profile entry
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        phone: cleanPhone,
        onboarding_completed: false,
        profile_completed: false,
        created_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Failed to create profile:', profileError)
      // Rollback user creation
      await supabase.auth.admin.deleteUser(authData.user.id)
      return res.status(500).json({ error: 'Failed to create account. Try again.' })
    }

    // 10. Success!
    return res.status(200).json({
      success: true,
      userId: authData.user.id,
      redirect: '/dashboard/complete-profile'
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
