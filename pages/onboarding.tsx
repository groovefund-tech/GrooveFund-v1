// pages/onboarding.tsx
'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

function generateReferralCode(displayName: string): string {
  const namePrefix = displayName.slice(0, 4).toUpperCase().replace(/\\s/g, '')
  const yearSuffix = new Date().getFullYear().toString().slice(-4)
  return `${namePrefix}${yearSuffix}`.slice(0, 8)
}

function RuleAccordion({ title, content }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div onClick={() => setIsOpen(!isOpen)} style={{ background: isOpen ? 'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)' : 'white', border: isOpen ? '2px solid #FF751F' : '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: isOpen ? '0 8px 24px rgba(255, 117, 31, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.05)', }} onMouseEnter={(e) => { if (!isOpen) { e.currentTarget.style.borderColor = '#FF751F'; e.currentTarget.style.background = '#FFF5ED'; } }} onMouseLeave={(e) => { if (!isOpen) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white'; } }} >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', }} >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', margin: 0, }} > {title} </h3>
        <span style={{ fontSize: '20px', transition: 'transform 0.3s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, }} > ▼ </span>
      </div>
      {isOpen && ( <p style={{ fontSize: '14px', color: '#6B7280', margin: '16px 0 0 0', lineHeight: '1.6', animation: 'fadeInUp 0.3s ease', }} > {content} </p> )}
    </div>
  );
}

export default function Onboarding() {
  const [currentScreen, setCurrentScreen] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [dob, setDob] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [monthlyAmount, setMonthlyAmount] = useState('500')
  const [concertInterested, setConcertInterested] = useState<boolean | null>(null)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeCommitment, setAgreeCommitment] = useState(false)
  const [referralCode, setReferralCode] = useState('')

  const canProceedScreen1 = displayName.trim() !== ''
  const canProceedScreen2 = displayName && dob && idNumber && address && phone && email && monthlyAmount && concertInterested !== null && agreeTerms && agreeCommitment
  const canProceedScreen3 = agreeTerms && agreeCommitment

  const handleNext = () => {
    if (currentScreen === 1 && !canProceedScreen1) return
    if (currentScreen === 2 && !canProceedScreen2) return
    if (currentScreen === 2) {
      const code = generateReferralCode(displayName)
      setReferralCode(code)
      setCurrentScreen(3)
    } else {
      setCurrentScreen(currentScreen + 1)
    }
  }

  const handleBack = () => {
    if (currentScreen > 1) {
      setCurrentScreen(currentScreen - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Session expired. Please log in again.')
      setLoading(false)
      return
    }

    try {
      console.log('🔍 Updating profile with:', {
        display_name: displayName,
        referral_code: referralCode,
        monthly_contribution: parseInt(monthlyAmount),
        onboarding_completed: true
      })

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          phone: phone,
          dob: new Date(dob).getTime(),
          id_number: idNumber,
          dob: typeof dob === 'string' ? dob : String(dob),
          residential_address: address,
          email: email,
          monthly_contribution: parseInt(monthlyAmount),
          referral_code: referralCode,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      console.log('🔍 Profile update response:', updateError)

      if (updateError) {
        console.error('🔍 Update error details:', updateError)
        setError(`Profile update failed: ${updateError.message}`)
        setLoading(false)
        return
      }

      // Wait a moment for the update to propagate
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Navigate to dashboard
      router.push('/signup')
      
    } catch (err) {
      console.error('🔍 Catch error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const Header = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#1F2937' }}>
        <img src="/images/logo.png" alt="GrooveFund" width={120} height={40} style={{ cursor: 'pointer', width: 'auto', height: '32px' }} />
      </div>
      <button onClick={() => router.push('/login')} style={{ padding: '10px 20px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.2s', }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 117, 31, 0.2)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }} >
        Log in
      </button>
    </div>
  )

  const ProgressBar = () => (
    <div style={{ width: '100%', height: 3, background: '#E5E7EB', borderRadius: 2, marginBottom: 32, overflow: 'hidden' }}>
      <div style={{ width: `${(currentScreen / 3) * 100}%`, height: '100%', background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', transition: 'width 0.3s ease' }} />
    </div>
  )

  const LogoCarousel = () => {
    const logos = [
      '/images/back-to-the-city.jpg',
      '/images/download (6).png',
      '/images/cape town int jazz festival.png',
      '/images/black coffee weekender.jpg',
      '/images/castle lite unlocks.jpg',
      '/images/download (11).jpeg',
      '/images/hey-neighbour.jpg',
      '/images/sounset sundays.png',
      '/images/luxury marble circus.jpg',
      '/images/Corona_Chasing_Sunsets.png',
      '/images/liv golf concert.png',
      '/images/hey-neighbour.jpg',
      '/images/SBJoy-Of-Jazz-Logo.png',
      '/images/hey-neighbour.jpg',
      '/images/homecoming events.jpg',
      '/images/Ultra_South_Africa_Logo.png',
      '/images/Amstel-FOA-Logo.png',
    ]
    return (
      <div style={{ width: '100%', overflow: 'hidden', padding: '60px 0', background: 'white' }}>
        <style>{`
          @keyframes scrollLeft { 0% { transform: translateX(0); } 100% { transform: translateX(calc(-140px * 8 - 40px * 8)); } }
          @keyframes scrollRight { 0% { transform: translateX(calc(-140px * 8 - 40px * 8)); } 100% { transform: translateX(0); } }
          .carousel-logo { flex: 0 0 140px; height: 140px; display: flex; align-items: center; justify-content: center; background: #F3F4F6; border-radius: 16px; border: 2px solid #E5E7EB; transition: all 0.3s ease; padding: 12px; box-sizing: border-box; }
          .carousel-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
          .carousel-logo:hover { transform: scale(1.05); border-color: #FF751F; box-shadow: 0 4px 12px rgba(255, 117, 31, 0.1); }
          .carousel-row { overflow: hidden; margin-bottom: 20px; }
          .carousel-row-track { display: flex; gap: 40px; width: fit-content; }
          .carousel-row-track.scroll-left { animation: scrollLeft 20s linear infinite; }
          .carousel-row-track.scroll-right { animation: scrollRight 20s linear infinite; }
        `}</style>
        <div className="carousel-row">
          <div className="carousel-row-track scroll-left">
            {[...logos, ...logos].map((logo, i) => (
              <div key={`row1-${i}`} className="carousel-logo">
                <img src={logo} alt={`Venue ${i}`} />
              </div>
            ))}
          </div>
        </div>
        <div className="carousel-row">
          <div className="carousel-row-track scroll-right">
            {[...logos, ...logos].map((logo, i) => (
              <div key={`row2-${i}`} className="carousel-logo">
                <img src={logo} alt={`Venue ${i}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const container = {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    background: '#FAFAFA',
    padding: '24px 20px',
    fontFamily: 'Poppins, sans-serif'
  }

  const content = {
    flex: 1,
    maxWidth: 500,
    margin: '0 auto',
    width: '100%'
  }

  const h1 = {
    fontSize: 32,
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 1.1
  }

  const subtitle = {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 1.5,
    marginBottom: 24,
    fontWeight: 500
  }

  const input = {
    width: '100%',
    padding: '12px 14px',
    marginBottom: 12,
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    fontSize: 14,
    fontFamily: 'Poppins',
    boxSizing: 'border-box' as const
  }

  const buttonContainer = {
    display: 'flex',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 24
  }

  const btn = {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Poppins',
    transition: 'all 0.2s'
  }

  const primaryBtn = {
    ...btn,
    background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
    color: 'white'
  }

  const secondaryBtn = {
    ...btn,
    background: '#F3F4F6',
    color: '#1F2937',
    border: '1px solid #E5E7EB'
  }

  if (currentScreen === 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' as const, minHeight: '100vh', background: 'linear-gradient(to bottom right, #FFF5ED, #FFE8D6)', fontFamily: 'Poppins, sans-serif' }}>
        <style>{`
          @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .feature-card { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }
          .feature-card:nth-child(1) { animation-delay: 0.2s; }
          .feature-card:nth-child(2) { animation-delay: 0.3s; }
          .feature-card:nth-child(3) { animation-delay: 0.4s; }
          .cta-button-pulse { animation: pulse 2s infinite; }
          .input-field { transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
          .input-field:focus { outline: none; border-color: #FF751F !important; box-shadow: 0 0 0 3px rgba(255, 117, 31, 0.1), 0 4px 12px rgba(255, 117, 31, 0.2) !important; transform: translateY(-2px); }
        `}</style>
        <div style={{ padding: '24px 20px' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <Header />
          </div>
        </div>
        <div style={{ flex: 1, padding: '0 20px' }}>
          <div style={content}>
            <div style={{ marginBottom: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎵</div>
              <h1 style={{ ...h1, textAlign: 'center', fontSize: 36, background: 'linear-gradient(to right, #1F2937, #FF751F)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Welcome to GrooveFund
              </h1>
              <p style={{ ...subtitle, textAlign: 'center', marginBottom: 0, fontWeight: 400 }}>
                Save together. Celebrate together. Join South Africa's first concert stokvel!
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 48 }}>
              {[
                { icon: '💰', title: 'Save Monthly', subtitle: 'EFT or YOCO' },
                { icon: '🔥', title: 'Build Streaks', subtitle: 'Stay Consistent' },
                { icon: '🎉', title: 'Celebrate', subtitle: 'At Real Concerts and Festivals' }
              ].map((feature, i) => (
                <div key={i} className="feature-card" style={{ textAlign: 'center', background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(255, 117, 31, 0.1)', cursor: 'pointer', transition: 'all 0.3s ease', }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 117, 31, 0.15)'; e.currentTarget.style.borderColor = '#FF751F' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 117, 31, 0.1)' }} >
                  <div style={{ fontSize: 40, marginBottom: 12, transition: 'transform 0.3s ease', }} onMouseEnter={(e) => { const parent = e.currentTarget.parentElement; if (parent) { e.currentTarget.style.transform = 'scale(1.2) rotate(10deg)' } }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)' }}>
                    {feature.icon}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937' }}>
                    {feature.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, fontWeight: 400 }}>
                    {feature.subtitle}
                  </div>
                </div>
              ))}
            </div>
            <input placeholder="What's your name?" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input-field" style={{ ...input, marginBottom: 0, padding: '14px 16px', fontSize: 16, background: 'white', border: '2px solid #E5E7EB', }} autoFocus />
          </div>
          <div style={{ ...content, marginTop: 24 }}>
            <div style={buttonContainer}>
              <button onClick={handleNext} disabled={!canProceedScreen1} className={!canProceedScreen1 ? '' : 'cta-button-pulse'} style={{ ...primaryBtn, opacity: !canProceedScreen1 ? 0.5 : 1, cursor: !canProceedScreen1 ? 'not-allowed' : 'pointer', boxShadow: '0 8px 16px rgba(255, 117, 31, 0.2)', position: 'relative', overflow: 'hidden', }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 117, 31, 0.3)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 117, 31, 0.2)' }} >
                Let's Groove
              </button>
            </div>
          </div>
        </div>
        <LogoCarousel />
        <div style={{ background: 'white', padding: '0px 20px', marginTop: 0 }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            {/* How It Works Section */}
            <div style={{ marginBottom: 80 }}>
              <div style={{ marginBottom: 60, textAlign: 'center' }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1F2937', marginBottom: 12, textAlign: 'center' }}>
                  How It Works
                </h2>
                <p style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 0, maxWidth: '600px', margin: '0 auto', fontWeight: 400, lineHeight: 1.5 }}>
                  Save R500/month. Attend the best concerts in South Africa. Together!
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32, marginBottom: 40 }}>
                {[
                  { step: '01', icon: '📝', title: 'Sign Up & Set Your Goal', desc: 'Complete your profile in 2 minutes. Choose your monthly savings amount (R500, R1000, or R1500).', highlight: 'Easy setup' },
                  { step: '02', icon: '💰', title: 'Start Saving Together', desc: 'Your monthly contributions go into a secure pool with thousands of other Groovers. Build your concert fund automatically.', highlight: 'Safe & encrypted' },
                  { step: '03', icon: '🎟️', title: 'Get Priority Access', desc: 'Top Groovers get first dibs to the hottest concerts, festivals, and exclusive shows across South Africa.', highlight: 'Premium tickets' },
                  { step: '04', icon: '🎵', title: 'Groove Together', desc: 'Connect with other Groovers attending the same event. Enjoy unforgettable experiences with your community!', highlight: 'Never alone' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 24, alignItems: 'flex-start', position: 'relative' }} onMouseEnter={(e) => { const icon = e.currentTarget.querySelector('[data-icon]') as HTMLElement; if (icon) { icon.style.transform = 'scale(1.1)' } }} onMouseLeave={(e) => { const icon = e.currentTarget.querySelector('[data-icon]') as HTMLElement; if (icon) { icon.style.transform = 'scale(1)' } }} >
                    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12 }}>
                      <div data-icon style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, boxShadow: '0 8px 20px rgba(255, 117, 31, 0.25)', transition: 'all 0.3s ease', }}>
                        {item.icon}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#FF751F', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {item.step}
                      </div>
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 12, fontWeight: 400 }}>
                        {item.desc}
                      </p>
                      <div style={{ display: 'inline-block', padding: '6px 12px', background: '#FEF3E2', borderRadius: 999, fontSize: 11, fontWeight: 600, color: '#FF751F', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        ✨ {item.highlight}
                      </div>
                    </div>
                    {i < 3 && (
                      <div style={{ position: 'absolute', left: 39, top: 100, width: 2, height: 120, background: 'linear-gradient(180deg, #FF751F 0%, transparent 100%)', opacity: 0.3 }} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', borderRadius: 20, padding: 48, textAlign: 'center', boxShadow: '0 10px 25px rgba(255, 117, 31, 0.2)' }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 12 }}>
                  Ready to Start Grooving? 🚀
                </h3>
                <p style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.9)', marginBottom: 32, fontWeight: 400 }}>
                  Join hundreds of Groovers saving for unforgettable experiences
                </p>
                <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setCurrentScreen(1) }} style={{ padding: '14px 32px', background: 'white', color: '#FF751F', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)' }} >
                  Start Your Streak
                </button>
              </div>
            </div>

            {/* Why GrooveFund Section */}
            <div style={{ marginBottom: 80 }}>
              <div style={{ marginBottom: 60, textAlign: 'center' }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1F2937', marginBottom: 12, textAlign: 'center' }}>
                  Why GrooveFund?
                </h2>
                <p style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 0, maxWidth: 600, margin: '0 auto', fontWeight: 400 }}>
                  South Africa's first concert stokvel. Save R500/month. Attend the best concerts in South Africa. Together.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                {[
                  { emoji: '👥', title: 'Community Driven', desc: 'Join thousands saving together for unforgettable experiences' },
                  { emoji: '🎫', title: 'Priority Access', desc: 'Get first dibs on the hottest concert tickets' },
                  { emoji: '💚', title: 'Financial Freedom', desc: 'Build streaks and earn rewards for consistency' },
                  { emoji: '🌟', title: 'Exclusive Events', desc: 'VIP access to GrooveFund member events' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FF 100%)', padding: 24, borderRadius: 16, border: '2px solid #BFDBFE', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden', }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(31, 41, 55, 0.12)'; e.currentTarget.style.borderColor = '#FF751F'; const icon = e.currentTarget.querySelector('[data-benefit-icon]') as HTMLElement; if (icon) { icon.style.transform = 'scale(1.15) rotate(5deg)' } }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = '#BFDBFE'; const icon = e.currentTarget.querySelector('[data-benefit-icon]') as HTMLElement; if (icon) { icon.style.transform = 'scale(1) rotate(0deg)' } }} >
                    <div style={{ fontSize: 40, marginBottom: 12, display: 'inline-block' }} data-benefit-icon style={{ fontSize: 40, marginBottom: 12, display: 'inline-block', transition: 'all 0.3s ease', }}>
                      {item.emoji}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
                      {item.title}
                    </div>
                    <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 0, fontWeight: 400 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* RULES & TRANSPARENCY SECTION */}
            <section style={{ maxWidth: '1200px', margin: '64px auto', padding: '0 20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#1F2937', margin: '0 0 12px 0' }}>
                  🛡️ Rules & Transparency
                </h2>
                <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
                  Everything you need to know. No hidden fees. No surprises.
                </p>
              </div>
              <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gap: '12px' }}>
                {[
                  { title: '💰 How Much Do I Contribute?', content: 'You contribute R500/month minimum. No signup fees. Every R500 gives you 500 points instantly on the leaderboard. You choose your amount—can be R500, R1000, or R1500/month.' },
                  { title: '🎫 How Do I Receive Tickets?', content: 'Top 40% of members (of those with 500+ points) get first access to event tickets. More points = better priority. If you don\'t recieve tickets, your points roll over next month—unless you are inactive for 40 days, then your account will become inactive, to give those who are active a fair chance.' },
                  { title: '💸 What\'s the 12% Admin Fee?', content: 'Yes, there\'s a 12% fee on your pool to cover operations: payments processing, customer support, event partnerships, and platform maintenance. The pool you see on your dashboard is already calculated after this fee.' },
                  { title: '📊 Where Does My Money Go?', content: 'Your contributions go into a secure community pool. This pool is used to buy actual concert and festival tickets. When you get tickets, you get real tickets to real events. Money isn\'t "kept"—it\'s converted to experiences.' },
                  { title: '🏆 What If I Don\'t Recieve Tickets?', content: 'If you don\'t recieve tickets in a month, your points stay with you and roll over. You can recieve tickets in future months. If you stop contributing for 40+ days, you lose 15 points/day to encourage active participation.' },
                  { title: '📝 Is This Legal?', content: 'GrooveFund operates as a stokvel—a traditional South African savings club. We\'re transparent about all fees and rules upfront. Everything is auditable. You can see the pool size and tickets bought right on your dashboard.' },
                  { title: '🔒 Is My Money Safe?', content: 'All payments are processed through POPIA-compliant systems. Your data is encrypted. The pool is managed transparently with full audit trails. We don\'t hold money—it\'s immediately converted to community pool and tickets.' },
                  { title: '❓ How Do Points Work?', content: 'R500 contribution = 500 points instantly. You need 500+ points to qualify for top 40%. Tickets cost 495 points per slot. 1 slot = R700-R1000 events. 2 slots = R1200-R1500 events. More points = better ticket access.' },
                ].map((rule, idx) => (
                  <RuleAccordion key={idx} title={rule.title} content={rule.content} />
                ))}
              </div>
              <div style={{ maxWidth: '900px', margin: '48px auto', background: 'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)', border: '2px solid #FF751F', borderRadius: '16px', padding: '24px', textAlign: 'center', }}>
                <p style={{ fontSize: '14px', color: '#1F2937', margin: 0, fontWeight: 600 }}>
                  ✅ <strong>100% Transparent</strong> • All fees disclosed • Points earned instantly • Real tickets to real events
                </p>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: '12px 0 0 0' }}>
                  See our full terms and transparency report in the footer.
                </p>
              </div>
            </section>

            {/* What Members Say Section */}
            <div style={{ marginBottom: 80 }}>
              <div style={{ marginBottom: 60, textAlign: 'center' }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1F2937', marginBottom: 12, textAlign: 'center' }}>
                  What Groovers Say 💬
                </h2>
                <p style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 0, fontWeight: 400 }}>
                  Real stories from our amazing community
                </p>
              </div>
              <style>{`
                .testimonial-card { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }
                .testimonial-card:nth-child(1) { animation-delay: 0.2s; }
                .testimonial-card:nth-child(2) { animation-delay: 0.3s; }
                .testimonial-card:nth-child(3) { animation-delay: 0.4s; }
                .quote-mark { position: absolute; top: -10px; left: 0; font-size: 48px; color: #FF751F; opacity: 0.2; }
              `}</style>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                {[
                  { name: 'Thabo', location: 'Cape Town', content: 'GrooveFund made my concert dreams possible. Finally saving with friends towards something meaningful!', icon: '🎤' },
                  { name: 'Naledi', location: 'Johannesburg', content: 'The community aspect is amazing. We motivate each other to keep our streaks going.', icon: '💪' },
                  { name: 'Lerato', location: 'Durban', content: 'Best financial decision I made. I can now prioritise fun without feeling guilty.', icon: '📈' },
                ].map((testimonial, i) => (
                  <div key={i} className="testimonial-card" style={{ background: 'white', padding: 28, borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative', }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(255, 117, 31, 0.12)'; e.currentTarget.style.borderColor = '#FF751F' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = '#E5E7EB' }} >
                    <div style={{ background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', color: 'white', padding: 16, borderRadius: 16, marginBottom: 16, fontSize: 14, lineHeight: 1.6, fontWeight: 400, position: 'relative', }}>
                      <div className="quote-mark">"</div>
                      "{testimonial.content}"
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 2 }}>
                          {testimonial.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 400 }}>
                          {testimonial.location}
                        </div>
                      </div>
                      <div style={{ fontSize: 28, transition: 'transform 0.3s ease', }}
                      data-testimonial-emoji>
                        {testimonial.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div style={{ background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', padding: '48px 24px', borderRadius: 16, textAlign: 'center', marginBottom: 60 }}>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: 'white', marginBottom: 12 }}>Ready to Groove?</h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', marginBottom: 32, fontWeight: 400 }}>Join hundreds of South Africans saving together for unforgettable experiences</p>
              <button onClick={() => { setDisplayName(''); setCurrentScreen(1); window.scrollTo(0, 0) }} style={{ padding: '14px 32px', background: 'white', color: '#FF751F', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }} >
                Get Started Now
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{background: '#1F2937', color: 'white', padding: '48px 20px 32px 20px', marginTop: '64px'}}>
          <div style={{maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px'}}>
            {/* Column 1: About */}
            <div>
              <p style={{fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0'}}>About</p>
              <p style={{fontSize: '14px', color: '#E5E7EB', margin: '0 0 12px 0'}}>South Africa's first concert stokvel.</p>
              <p style={{fontSize: '13px', color: '#9CA3AF', lineHeight: '1.6', margin: 0}}>Save R500/month. Attend the best concerts in South Africa. Together.</p>
            </div>
            {/* Column 2: Quick Links */}
            <div>
              <p style={{fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0'}}>Quick Links</p>
              <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                <li style={{marginBottom: '12px'}}><a href="/signup" style={{color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer'}} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ How It Works</a></li>
                <li style={{marginBottom: '12px'}}><a href="#" style={{color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer'}} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ Events</a></li>
                <li style={{marginBottom: '12px'}}><a href="/" style={{color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer'}} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ Home</a></li>
              </ul>
            </div>
            {/* Column 3: Resources */}
            <div>
              <p style={{fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0'}}>Resources</p>
              <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                <li style={{marginBottom: '12px'}}><a href="/blog" style={{color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer'}} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}> 📝 Blog & Insights</a></li>
                <li style={{marginBottom: '12px'}}><a href="/help" style={{color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer'}} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ Help & Support</a></li>
                <li style={{marginBottom: '12px'}}><a href="/contact" style={{color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer'}} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ Contact Us</a></li>
              </ul>
            </div>
            {/* Column 4: Terms & Transparency */}
            <div>
              <p style={{fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0'}}>🛡️ Transparency</p>
              <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                <li style={{marginBottom: '12px'}}><a href="/terms" style={{color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer'}} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>📋 Terms & Rules</a></li>
                <li style={{marginBottom: '12px'}}><a href="/transparency" style={{color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer'}} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>🔒 Privacy Policy</a></li>
                <li style={{marginBottom: '12px'}}><a href="/transparency" style={{color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer'}} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>📊 Transparency Report</a></li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #374151', paddingTop: '32px' }}>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0, textAlign: 'center' }}>© 2026 GrooveFund. All rights reserved. Made with 🧡 in South Africa.</p>
          </div>
        </div>
      </div>
    )
  }

  if (currentScreen === 2) {
    return (
      <div style={container}>
        <Header />
        <ProgressBar />
        <div style={content}>
          <h1 style={h1}>Let's Get to Know You</h1>
          <div style={{ background: '#F0F9FF', padding: 12, borderRadius: 12, border: '1px solid #BFDBFE', marginBottom: 24, fontSize: 12, color: '#1E40AF', lineHeight: 1.5 }}>
            🔒 Encrypted & protected under POPIA. <a href="#" style={{ color: '#1E40AF', fontWeight: 600, textDecoration: 'none' }}>Privacy</a>
          </div>
          
          <input placeholder="Full Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={input} />
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={input} />
          <input placeholder="SA ID / Passport" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} style={input} />
          <input placeholder="Street Address" value={address} onChange={(e) => setAddress(e.target.value)} style={input} />
          <input placeholder="Mobile" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={input} />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} />

          {/* Monthly Contribution Selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 12 }}>Monthly Contribution</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {['500', '1000', '1500'].map((amount) => (
                <button key={amount} onClick={() => setMonthlyAmount(amount)} style={{ padding: '16px 12px', border: monthlyAmount === amount ? 'none' : '1px solid #E5E7EB', borderRadius: 12, background: monthlyAmount === amount ? 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)' : 'white', color: monthlyAmount === amount ? 'white' : '#1F2937', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.2s' }}>
                  R{amount}
                </button>
              ))}
            </div>
            <input placeholder="Custom amount" type="number" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} style={{ ...input, marginBottom: 0, padding: '12px 14px', fontSize: 14, textAlign: 'center' }} />
          </div>

          {/* Concert Interest Question */}
          <div style={{ marginBottom: 24, padding: 16, background: '#FFF5ED', border: '2px solid #FFE4CC', borderRadius: 12 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 16 }}>🎵 Would you be keen to go to events with other Groovers?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => setConcertInterested(true)} style={{ padding: '14px 16px', border: concertInterested === true ? 'none' : '1px solid #E5E7EB', borderRadius: 12, background: concertInterested === true ? 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)' : 'white', color: concertInterested === true ? 'white' : '#1F2937', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.2s', boxShadow: concertInterested === true ? '0 4px 12px rgba(255, 117, 31, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)' }} onMouseEnter={(e) => { if (concertInterested !== true) { e.currentTarget.style.borderColor = '#FF751F'; e.currentTarget.style.background = '#FFF5ED' } }} onMouseLeave={(e) => { if (concertInterested !== true) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white' } }} >
                ✨ Yes I'm Keen
              </button>
              <button onClick={() => setConcertInterested(false)} style={{ padding: '14px 16px', border: concertInterested === false ? 'none' : '1px solid #E5E7EB', borderRadius: 12, background: concertInterested === false ? '#E5E7EB' : 'white', color: '#1F2937', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.2s', boxShadow: concertInterested === false ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.05)' }} onMouseEnter={(e) => { if (concertInterested !== false) { e.currentTarget.style.borderColor = '#9CA3AF'; e.currentTarget.style.background = '#F3F4F6' } }} onMouseLeave={(e) => { if (concertInterested !== false) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white' } }} >
                Nah, I'm Cool
              </button>
            </div>
          </div>

          {/* Terms & Commitment */}
          <div style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer', marginTop: 3, flexShrink: 0 }} />
              <label style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, cursor: 'pointer' }}>I agree to the <a href="#" style={{ color: '#FF751F', fontWeight: 600, textDecoration: 'none' }}>Terms</a></label>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 0, gap: 12 }}>
              <input type="checkbox" checked={agreeCommitment} onChange={(e) => setAgreeCommitment(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer', marginTop: 3, flexShrink: 0 }} />
              <label style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, cursor: 'pointer' }}>I commit to saving R{monthlyAmount}/month</label>
            </div>
          </div>
        </div>
        <div style={buttonContainer}>
          <button onClick={handleBack} style={secondaryBtn}>Back</button>
          <button onClick={handleNext} disabled={!canProceedScreen2} style={{...primaryBtn, opacity: !canProceedScreen2 ? 0.5 : 1, cursor: !canProceedScreen2 ? 'not-allowed' : 'pointer'}}>Next</button>
        </div>
      </div>
    )
  }

  if (currentScreen === 3) {
    return (
      <div style={container}>
        <Header />
        <ProgressBar />
        <div style={content}>
          <h1 style={h1}>You're Almost In</h1>
          <p style={subtitle}>Your invite code is ready to share</p>
          
          {agreeTerms && agreeCommitment && (
            <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '2px solid #E5E7EB', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Invite Code</div>
              <div style={{ fontSize: 40, fontWeight: 700, background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 3, marginBottom: 12, fontFamily: 'monospace' }}>
                {referralCode}
              </div>
              <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 0, lineHeight: 1.5 }}>Share with friends. You both earn 50 vibe points. 🎁</p>
            </div>
          )}

          <div style={{ background: '#F0F9FF', padding: 16, borderRadius: 12, border: '1px solid #BFDBFE', marginBottom: 24, fontSize: 13, color: '#1E40AF', lineHeight: 1.6 }}>
            ✅ Your profile is secure. Monthly contributions via EFT/YOCO. Cancel anytime.
          </div>
        </div>
        <div style={buttonContainer}>
          <button onClick={handleBack} style={secondaryBtn}>Back</button>
          <button onClick={handleComplete} disabled={!canProceedScreen3 || loading} style={{ ...primaryBtn, opacity: (!canProceedScreen3 || loading) ? 0.5 : 1, cursor: (!canProceedScreen3 || loading) ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Setting up...' : "You're In. Let's Go 🎉"}
          </button>
        </div>
      </div>
    )
  }

  return null
}