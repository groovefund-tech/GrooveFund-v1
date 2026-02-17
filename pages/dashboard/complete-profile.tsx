'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

function generateReferralCode(displayName: string, userId: string): string {
  const namePrefix = displayName.slice(0, 3).toUpperCase().replace(/\s/g, '')
  const userIdPart = userId.substring(0, 5).toUpperCase()
  return `${namePrefix}${userIdPart}`.slice(0, 8)
}

export default function CompleteProfile() {
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [dob, setDob] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [monthlyAmount, setMonthlyAmount] = useState('500')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeCommitment, setAgreeCommitment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/signup')
      return
    }

    setUser(user)

    // Check if already completed profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_completed')
      .eq('id', user.id)
      .single()

    if (profile?.profile_completed) {
      router.push('/dashboard')
    }
  }

  const validateAge = (dob: string): boolean => {
    const birthDate = new Date(dob)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18
    }
    return age >= 18
  }

  const validateForm = () => {
    if (!displayName.trim()) { setError('Please enter your full name'); return false }
    if (!email.trim()) { setError('Please enter your email'); return false }
    if (!dob) { setError('Please enter your date of birth'); return false }
    if (!validateAge(dob)) { setError('You must be 18 or older to join'); return false }
    if (!idNumber.trim()) { setError('Please enter your ID or passport number'); return false }
    if (!address.trim()) { setError('Please enter your street address'); return false }
    if (!agreeTerms) { setError('Please agree to the terms'); return false }
    if (!agreeCommitment) { setError('Please commit to your monthly savings'); return false }
    return true
  }

  const handleComplete = async () => {
    setError('')
    if (!validateForm()) return

    setLoading(true)

    try {
      if (!user) {
        setError('Session expired. Please sign up again.')
        router.push('/signup')
        return
      }

      const referralCode = generateReferralCode(displayName, user.id)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          email: email,
          dob: dob,
          id_number: idNumber,
          residential_address: address,
          monthly_contribution: parseInt(monthlyAmount),
          referral_code: referralCode,
          profile_completed: true,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (updateError) {
        setError('Failed to save profile. Please try again.')
        setLoading(false)
        return
      }

      // Success - redirect to welcome/dashboard
      router.push('/dashboard/welcome')

    } catch (err) {
      console.error('Profile completion error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFF5ED 0%, #FFE8D6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Poppins',
      }}>
        <p style={{ color: '#6B7280' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF5ED 0%, #FFE8D6 100%)',
      padding: '24px 20px',
      fontFamily: 'Poppins, sans-serif',
    }}>
      <div style={{
        maxWidth: 500,
        margin: '0 auto',
        background: 'white',
        borderRadius: 16,
        padding: 32,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
      }}>
        {/* Progress */}
        <div style={{
          marginBottom: 24,
          padding: 12,
          background: '#F3F4F6',
          borderRadius: 8,
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 12,
            color: '#6B7280',
            margin: 0,
            fontWeight: 600,
          }}>
            Step 2 of 2 • Complete Your Profile
          </p>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#1F2937',
            margin: '0 0 8px 0',
          }}>
            Tell Us About Yourself
          </h1>
          <p style={{
            fontSize: 14,
            color: '#6B7280',
            margin: 0,
          }}>
            We need a few details to get you set up
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#7F1D1D',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            border: '1px solid #FECACA',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            Full Name
          </label>
          <input
            placeholder="Name & Surname"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              fontSize: 14,
              fontFamily: 'Poppins',
              boxSizing: 'border-box',
              marginBottom: 14,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            Email Address
          </label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              fontSize: 14,
              fontFamily: 'Poppins',
              boxSizing: 'border-box',
              marginBottom: 14,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            Date of Birth (18+ only)
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              fontSize: 14,
              fontFamily: 'Poppins',
              boxSizing: 'border-box',
              marginBottom: 14,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            SA ID / Passport Number
          </label>
          <input
            placeholder="ID or Passport"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              fontSize: 14,
              fontFamily: 'Poppins',
              boxSizing: 'border-box',
              marginBottom: 14,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            Street Address
          </label>
          <input
            placeholder="Your physical address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              fontSize: 14,
              fontFamily: 'Poppins',
              boxSizing: 'border-box',
              marginBottom: 14,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            Monthly Contribution
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
            {['500', '1000', '1500'].map((amount) => (
              <button
                key={amount}
                onClick={() => setMonthlyAmount(amount)}
                style={{
                  padding: '12px 8px',
                  border: monthlyAmount === amount ? 'none' : '1px solid #E5E7EB',
                  borderRadius: 10,
                  background: monthlyAmount === amount ? 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)' : 'white',
                  color: monthlyAmount === amount ? 'white' : '#1F2937',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Poppins',
                }}
              >
                R{amount}
              </button>
            ))}
          </div>
        </div>

        {/* Agreements */}
        <div style={{ marginBottom: 24, paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer', marginTop: 2, flexShrink: 0 }}
            />
            <label style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, cursor: 'pointer' }}>
              I agree to the{' '}
              <a href="/terms" target="_blank" style={{ color: '#FF751F', fontWeight: 600, textDecoration: 'none' }}>
                Terms & Conditions
              </a>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <input
              type="checkbox"
              checked={agreeCommitment}
              onChange={(e) => setAgreeCommitment(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer', marginTop: 2, flexShrink: 0 }}
            />
            <label style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5, cursor: 'pointer' }}>
              I commit to saving R{monthlyAmount}/month and building my concert fund
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleComplete}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#E5E7EB' : 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
            color: loading ? '#9CA3AF' : 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Poppins',
            boxShadow: '0 4px 12px rgba(255, 117, 31, 0.2)',
          }}
        >
          {loading ? 'Creating account...' : 'Complete Signup & Get Started 🎉'}
        </button>
      </div>
    </div>
  )
}
