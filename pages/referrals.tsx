import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import ProfileMenu from '../components/ProfileMenu'
import { supabase } from '../lib/supabase'

interface ReferralData {
  referral_code: string
  referral_count: number
  referral_rewards: number
}

interface Member {
  id: string
  display_name: string
  email?: string
  // Add other member fields as needed
}

export default function Referrals() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadReferralData()
  }, [])

  const loadReferralData = async () => {
  try {
    console.log('Starting loadReferralData...')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check:', user?.id, authError)
    
    if (!user) {
      console.log('No user found, redirecting to login')
      router.push('/login')
      return
    }

    // Fetch member profile data - be more specific with columns
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, email, referral_code')
      .eq('id', user.id)
      .single()

    console.log('Profile fetch:', profile, profileError)

    if (profileError) {
      console.error('Failed to load profile:', profileError)
      setLoading(false)
      return
    }

    if (profile) {
      // Set member data for the header
      setMember({
        id: profile.id,
        display_name: profile.display_name || 'User',
        email: profile.email,
      })


      // Count referrals - only query if referral_code exists
      let referrals = []
      if (profile.referral_code) {
        const { data: referralsList, error: referralError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('referred_by', profile.referral_code)

        console.log('Referrals fetch:', referralsList?.length, referralError)

        if (referralError) {
          console.error('Failed to count referrals:', referralError)
        }
        referrals = referralsList || []
      } else {
        console.warn('No referral_code found for user')
      }
        
      // If no referral code exists, generate one
  let referralCode = profile.referral_code
  if (!referralCode) {
    console.log('Generating referral code...')
    // Generate a unique code (e.g., first 3 letters of name + 4 random chars)
    const namePrefix = (profile.display_name || 'USER').slice(0, 3).toUpperCase()
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    referralCode = `${namePrefix}${randomSuffix}`
    
    // Save it to the database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ referral_code: referralCode })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('Failed to save referral code:', updateError)
    } else {
      console.log('Referral code generated and saved:', referralCode)
    }
  }

  // Count referrals
  const { data: referralsList, error: referralError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .eq('referred_by', referralCode)

  if (referralError) {
    console.error('Failed to count referrals:', referralError)
  }


      setReferralData({
        referral_code: profile.referral_code || 'NO_CODE',
        referral_count: referrals.length || 0,
        referral_rewards: (referrals.length || 0) * 50,
      })
    } else {
      console.warn('No profile found for user')
    }
  } catch (err) {
    console.error('Failed to load referral data:', err)
  } finally {
    setLoading(false)
  }
}

  const copyToClipboard = async () => {
    if (referralData?.referral_code) {
      await navigator.clipboard.writeText(referralData.referral_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh' }}>
        Loading Referral Data…
      </div>
    )
  }

  return (
    <>
      {/* HEADER */}
      <header
        style={{
          background: 'white',
          borderBottom: '1px solid #E5E7EB',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Image
            src="/images/logo.png"
            alt="GrooveFund"
            width={120}
            height={40}
            style={{ cursor: 'pointer', width: 'auto', height: '32px' }}
            onClick={() => router.push('/dashboard')}
          />
          <div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <ProfileMenu 
              displayName={member?.display_name || 'Profile'} 
              member={member as any} 
            />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #F9FAFB 0%, #FFF5ED 100%)',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* BACK BUTTON */}
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '8px 12px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: '24px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFF5ED'
              e.currentTarget.style.borderColor = '#FF751F'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.borderColor = '#E5E7EB'
            }}
          >
            ← Back
          </button>

          {/* HERO */}
          <section style={{ marginBottom: '48px' }}>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 800,
                color: '#1F2937',
                margin: '0 0 8px 0',
              }}
            >
              🎁 Refer & Earn
            </h1>
            <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
              Share your referral code and earn 50 points for each friend who joins.
            </p>
          </section>

          {/* REFERRAL CODE CARD */}
          <section style={{ marginBottom: '48px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                borderRadius: '16px',
                padding: '32px 24px',
                color: 'white',
                boxShadow: '0 10px 25px rgba(255, 117, 31, 0.3)',
              }}
            >
              <p
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  opacity: 0.95,
                }}
              >
                Your Unique Referral Code
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <span
                  style={{
                    fontSize: '36px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    letterSpacing: '3px',
                  }}
                >
                  {referralData?.referral_code || 'LOADING'}
                </span>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '12px 20px',
                    background: 'white',
                    color: '#FF751F',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {copied ? '✅ Copied!' : '📋 Copy Code'}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
                Share this code with friends. When they sign up, you both earn 50 points!
              </p>
            </div>
          </section>

          {/* STATS GRID */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '48px',
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#6B7280',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}
              >
                Friends Referred
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#FF751F',
                }}
              >
                {referralData?.referral_count || 0}
              </p>
            </div>
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#6B7280',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}
              >
                Referral Rewards
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#FF751F',
                }}
              >
                +{referralData?.referral_rewards || 0}
              </p>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#1F2937',
                margin: '0 0 24px 0',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(255, 117, 31, 0.15)',
              }}
            >
              How It Works
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
              }}
            >
              {[
                { num: '1', title: 'Share Your Code', desc: 'Copy your unique referral code and share it with friends.' },
                { num: '2', title: 'They Sign Up', desc: 'Friends use your code when creating their GrooveFund account.' },
                { num: '3', title: 'You Both Win', desc: 'You and your friend each earn 50 bonus points!' },
              ].map((step) => (
                <div
                  key={step.num}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '20px',
                      marginBottom: '12px',
                    }}
                  >
                    {step.num}
                  </div>
                  <h3
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#1F2937',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: '#6B7280',
                      lineHeight: '1.5',
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}