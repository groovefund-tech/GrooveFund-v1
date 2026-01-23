import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import ProfileMenu from '../components/ProfileMenu'
import { supabase } from '../lib/supabase'

interface FAQ {
  id: number
  question: string
  answer: string
}

const FAQs: FAQ[] = [
  {
    id: 1,
    question: "My Groove Balance isn't updating, what do I do?",
    answer: "Your Groove Balance reflects within 15 minutes of contributing. If delayed, email us at support@groovefund.co.za with your phone number and contribution receipt.",
  },
  {
    id: 2,
    question: "How do I change my email or phone number?",
    answer: "You can update your details in the 'Edit Profile' section under Quick Actions.",
  },
  {
    id: 3,
    question: "I Locked in my slot for an event, now what?",
    answer: "Once you've Locked in your slot, your spot is reserved. You'll receive updates via WhatsApp & email closer to the event. When you qualify for tickets, they will be sent to your profile under your account dashboard.",
  },
  {
    id: 4,
    question: "Why am I not ranked on the Leaderboard?",
    answer: "You need to make your first monthly contribution and have 'Paid' status to be ranked. Check your payment status in your profile.",
  },
  {
    id: 5,
    question: "How do I invite friends and get points?",
    answer: "Share your unique referral code with friends. When they sign up using your code, you both earn 50 Vibe Points!",
  },
  {
    id: 6,
    question: "Can I change my selected events?",
    answer: "Yes! You can add or remove events anytime from your dashboard until the qualification deadline.",
  },
  {
    id: 7,
    question: "What if I miss a monthly payment?",
    answer: "Your account stays active but you won't earn rewards that month. You can resume anytime. After day 40 of inactivity, you will be downgraded to 'Inactive' status.",
  },
  {
    id: 8,
    question: "How do I cancel my subscription?",
    answer: "Go to 'Manage Plan' in your Account settings, or email support@groovefund.co.za with 'Cancel My Groove' in the subject line.",
  },
]

export default function Help() {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [displayName, setDisplayName] = useState('User')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        setDisplayName(profile.display_name || 'User')
      }
    } catch (err) {
      console.error('Failed to load user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleFAQ = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
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
            <ProfileMenu displayName={displayName} member={{ display_name: displayName } as any} />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #F9FAFB 0%, #FFF5ED 100%)',
          padding: '32px 24px',
          overflowX: 'hidden',
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

          {/* HERO SECTION */}
          <section style={{ marginBottom: '48px', textAlign: 'center' }}>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 800,
                color: '#1F2937',
                margin: '0 0 8px 0',
              }}
            >
              ❓ Help & FAQs
            </h1>
            <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
              Find answers to common questions about GrooveFund.
            </p>
          </section>

          {/* SEARCH-LIKE INTRO */}
          <section
            style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              padding: '24px',
              marginBottom: '48px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: '#6B7280',
                textAlign: 'center',
              }}
            >
              💡 Can't find what you're looking for?{' '}
              <a
                href="mailto:support@groovefund.co.za"
                style={{
                  color: '#FF751F',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none'
                }}
              >
                Contact support@groovefund.co.za
              </a>
            </p>
          </section>

          {/* FAQ ACCORDION */}
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
              Frequently Asked Questions
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FAQs.map((faq) => (
                <div
                  key={faq.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    boxShadow: expandedId === faq.id
                      ? '0 10px 25px rgba(0, 0, 0, 0.08)'
                      : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  {/* FAQ HEADER */}
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    style={{
                      width: '100%',
                      padding: '20px',
                      background: expandedId === faq.id ? '#FFF5ED' : 'white',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (expandedId !== faq.id) {
                        e.currentTarget.style.background = '#F9FAFB'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (expandedId !== faq.id) {
                        e.currentTarget.style.background = 'white'
                      }
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#1F2937',
                        textAlign: 'left',
                      }}
                    >
                      {faq.question}
                    </h3>
                    <span
                      style={{
                        fontSize: '20px',
                        transition: 'transform 0.2s ease',
                        transform:
                          expandedId === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {/* FAQ ANSWER */}
                  {expandedId === faq.id && (
                    <div
                      style={{
                        padding: '0 20px 20px 20px',
                        borderTop: '1px solid #E5E7EB',
                        background: 'white',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          color: '#6B7280',
                          lineHeight: '1.6',
                        }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* CONTACT SECTION */}
          <section style={{ marginTop: '48px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                borderRadius: '16px',
                padding: '32px 24px',
                color: 'white',
                textAlign: 'center',
                boxShadow: '0 10px 25px rgba(255, 117, 31, 0.3)',
              }}
            >
              <h2
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '24px',
                  fontWeight: 700,
                }}
              >
                Still need help?
              </h2>
              <p
                style={{
                  margin: '0 0 20px 0',
                  fontSize: '14px',
                  opacity: 0.95,
                }}
              >
                Our support team is here to help
              </p>
              <a
                href="mailto:support@groovefund.co.za"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: 'white',
                  color: '#FF751F',
                  textDecoration: 'none',
                  borderRadius: '10px',
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
                📧 Email Support
              </a>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}