'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

function generateReferralCode(displayName: string, userId: string): string {
  const namePrefix = displayName.slice(0, 3).toUpperCase().replace(/\\s/g, '')
  const userIdPart = userId.substring(0, 5).toUpperCase()
  return `${namePrefix}${userIdPart}`.slice(0, 8)
}

export default function Signup() {
  // Auth fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Profile fields
  const [displayName, setDisplayName] = useState('')
  const [dob, setDob] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [monthlyAmount, setMonthlyAmount] = useState('500')
  
  // Agreement fields
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeCommitment, setAgreeCommitment] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const validateForm = () => {
    if (!displayName.trim()) { setError('Please enter your name'); return false }
    if (!email.trim()) { setError('Please enter your email'); return false }
    if (!password) { setError('Please enter a password'); return false }
    if (password !== confirmPassword) { setError('Passwords do not match'); return false }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return false }
    if (!dob) { setError('Please enter your date of birth'); return false }
    if (!idNumber.trim()) { setError('Please enter your ID number'); return false }
    if (!address.trim()) { setError('Please enter your address'); return false }
    if (!phone.trim()) { setError('Please enter your phone number'); return false }
    if (!monthlyAmount) { setError('Please select a monthly amount'); return false }
    if (!agreeTerms) { setError('You must agree to the terms'); return false }
    if (!agreeCommitment) { setError('You must commit to your monthly savings'); return false }
    return true
  }

  const handleSignup = async () => {
    setError('')
    if (!validateForm()) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        if (authError.message.includes('duplicate')) {
          setError('This email is already registered. Please log in instead.')
        } else if (authError.message.includes('invalid email')) {
          setError("That email doesn't look right. Double-check and try again.")
        } else {
          setError(authError.message || 'Signup failed. Please try again.')
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Failed to create account. Please try again.')
        setLoading(false)
        return
      }

      // 2. Generate referral code
      const referralCode = generateReferralCode(displayName, authData.user.id)

      // 3. Create profile with all onboarding data
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          display_name: displayName,
          phone: phone,
          dob: dob,
          id_number: idNumber,
          residential_address: address,
          monthly_contribution: parseInt(monthlyAmount),
          referral_code: referralCode,
          onboarding_completed: true,
        })

      if (profileError) {
        setError('Account setup failed. Please try again.')
        setLoading(false)
        return
      }

      // Success - redirect to dashboard
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/dashboard')

    } catch (err) {
      console.error('Signup error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF5ED 0%, #FFE8D6 100%)',
      padding: '24px 20px',
      fontFamily: 'Poppins, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        maxWidth: 500,
        margin: '0 auto 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 24,
        borderBottom: '1px solid #E5E7EB',
      }}>
        <img
          src="/images/logo.png"
          alt="GrooveFund"
          width={120}
          height={40}
          style={{ cursor: 'pointer', width: 'auto', height: '32px' }}
          onClick={() => router.push('/')}
        />
        <button
          onClick={() => router.push('/login')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 117, 31, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Log in
        </button>
      </header>

      {/* Main Form */}
      <div style={{
        maxWidth: 500,
        margin: '0 auto',
        background: 'white',
        borderRadius: 16,
        padding: 32,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
      }}>
        {/* Title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#1F2937',
            margin: '0 0 8px 0',
          }}>
            🎵 Welcome to GrooveFund
          </h1>
          <p style={{
            fontSize: 15,
            color: '#6B7280',
            margin: 0,
            fontWeight: 500,
          }}>
           South Africa's first concert stokvel. Save R500/month. Attend the best concerts in South Africa. Together!
          </p>
        </div>

        {/* Error Message */}
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

        {/* Auth Fields */}
        <div style={{ marginBottom: 24 }}>
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
              marginBottom: 12,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            Email
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
              marginBottom: 12,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              fontSize: 14,
              fontFamily: 'Poppins',
              boxSizing: 'border-box',
              marginBottom: 12,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            Confirm Password
          </label>
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              fontSize: 14,
              fontFamily: 'Poppins',
              boxSizing: 'border-box',
              marginBottom: 12,
            }}
          />
        </div>

        {/* Profile Fields */}
        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
            Tell Us About Yourself
          </h3>

          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            Date of Birth - Over 18s Only!
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
              marginBottom: 12,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            SA ID / Passport
          </label>
          <input
            placeholder="ID Number"
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
              marginBottom: 12,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            Street Address
          </label>
          <input
            placeholder="Your address"
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
              marginBottom: 12,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="+27 ..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              fontSize: 14,
              fontFamily: 'Poppins',
              boxSizing: 'border-box',
              marginBottom: 12,
            }}
          />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
            Monthly Contribution
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
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
                  transition: 'all 0.2s',
                }}
              >
                R{amount}
              </button>
            ))}
          </div>
        </div>

        {/* Agreements */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer', marginTop: 3, flexShrink: 0 }}
            />
            <label style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, cursor: 'pointer' }}>
              I agree to the{' '}
              <a href="#" style={{ color: '#FF751F', fontWeight: 600, textDecoration: 'none' }}>
                Terms & Conditions
              </a>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={agreeCommitment}
              onChange={(e) => setAgreeCommitment(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer', marginTop: 3, flexShrink: 0 }}
            />
            <label style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, cursor: 'pointer' }}>
              I commit to saving R{monthlyAmount}/month and building my concert fund
            </label>
          </div>
        </div>

        {/* Sign Up Button */}
        <button
          onClick={handleSignup}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: loading ? '#E5E7EB' : 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
            color: loading ? '#9CA3AF' : 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Poppins',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(255, 117, 31, 0.2)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 117, 31, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 117, 31, 0.2)'
            }
          }}
        >
          {loading ? 'Creating account...' : 'Create Account & Get Started 🎉'}
        </button>

        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
          Already have an account?{' '}
          <button
            onClick={() => router.push('/login')}
            style={{ background: 'none', border: 'none', color: '#FF751F', cursor: 'pointer', fontWeight: 600 }}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  )
}