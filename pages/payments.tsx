import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import ProfileMenu from '../components/ProfileMenu'
import Image from 'next/image'

interface TierInfo {
  name: string
  emoji: string
  color: string
  description: string
}

interface UserStreak {
  currentMonth: number
  tier: TierInfo | null
  lastContributionMonth: string
}

interface Payment {
  id: string
  amount: number
  created_at: string
  status: string
  provider: string
  notes: string | null
}

interface MemberInfo {
  email: string
  display_name: string
  effective_points?: number
}

export default function Payments() {
  const [member, setMember] = useState<MemberInfo | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')
  const [userStreak, setUserStreak] = useState<UserStreak>({
    currentMonth: 0,
    tier: null,
    lastContributionMonth: new Date().toISOString().slice(0, 7),
  })
  const router = useRouter()

  const getTierInfo = (consecutiveMonths: number) => {
    if (consecutiveMonths >= 24)
      return {
        name: 'Stokvel Legend',
        emoji: '💎',
        color: '#7C3AED',
        description: "You're legendary. 24 months of pure momentum.",
      }
    if (consecutiveMonths >= 12)
      return {
        name: 'Stokvel Guardian',
        emoji: '💎',
        color: '#FF751F',
        description: "You're a force. A year of commitment unlocked.",
      }
    if (consecutiveMonths >= 6)
      return {
        name: 'Stokvel Champion',
        emoji: '🥇',
        color: '#F59E0B',
        description: "You're unstoppable. Your dedication is showing.",
      }
    if (consecutiveMonths >= 3)
      return {
        name: 'Stokvel Builder',
        emoji: '🥈',
        color: '#9CA3AF',
        description: "You're proving consistency matters. Keep the rhythm going.",
      }
    if (consecutiveMonths >= 1)
      return {
        name: 'Stokvel Starter',
        emoji: '🥉',
        color: '#B45309',
        description: "You've started. You're building the foundation.",
      }
    return null
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      // Get member info and streak data
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, display_name, current_streak_month, streak_tier, last_contribution_month')
        .eq('id', user.id)
        .single()

      if (profile) {
        setMember({
          email: profile.email,
          display_name: profile.display_name,
        })

        setUserStreak({
          currentMonth: profile.current_streak_month || 0,
          tier: getTierInfo(profile.current_streak_month || 0),
          lastContributionMonth: profile.last_contribution_month,
        })
      }

      // Get leaderboard data for points
      const { data: leaderboardData } = await supabase
        .from('leaderboard_view')
        .select('effective_points')
        .eq('user_id', user.id)
        .single()

      if (leaderboardData && member) {
        setMember((prev) => ({
          ...prev!,
          effective_points: leaderboardData.effective_points,
        }))
      }

      // Get payment history
      const { data: paymentData } = await supabase
        .from('payments')
        .select('id, amount, created_at, status, provider, notes')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setPayments(paymentData || [])
    } catch (err) {
      console.error('Load payments error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return (
      <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh' }}>
        Loading Payment History…
      </div>
    )

  // Filter payments
  const filteredPayments = filterStatus === 'all'
    ? payments
    : payments.filter((p) => p.status === filterStatus)

  // Calculate stats
  const completedPayments = payments.filter((p) => p.status === 'completed')
  const totalSpent = completedPayments.reduce((sum, p) => sum + p.amount, 0)
  const amountSaved = totalSpent > 0 ? Math.round(totalSpent * 0.38) : 0

  // Group payments by month
  const groupedPayments: { [key: string]: Payment[] } = {}
  filteredPayments.forEach((payment) => {
    const date = new Date(payment.created_at)
    const monthKey = date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
    })
    if (!groupedPayments[monthKey]) {
      groupedPayments[monthKey] = []
    }
    groupedPayments[monthKey].push(payment)
  })

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'stripe':
        return '💳'
      case 'paypal':
        return '🅿️'
      case 'manual':
      case 'admin':
        return '✋'
      default:
        return '💰'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#D1FAE5', text: '#065F46', icon: '✅' }
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E', icon: '⏳' }
      case 'failed':
        return { bg: '#FEE2E2', text: '#7F1D1D', icon: '❌' }
      default:
        return { bg: '#F3F4F6', text: '#374151', icon: '❓' }
    }
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
            {member?.effective_points && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: 'white',
                  borderRadius: '20px',
                  border: '1px solid #E5E7EB',
                }}
              >
                <span style={{ fontSize: '18px' }}>⚡</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                  {member.effective_points}
                </span>
              </div>
            )}
            <ProfileMenu
              displayName={member?.display_name || 'Profile'}
              userStreak={userStreak}
              confirmedPoints={member?.effective_points}
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
          overflowX: 'hidden',
        }}
      >
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
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
          <section style={{ marginBottom: '48px' }}>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 800,
                color: '#1F2937',
                margin: '0 0 8px 0',
              }}
            >
              💳 Payment History
            </h1>
            <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
              Track all your Groove Balance top-ups and transactions.
            </p>
          </section>

          {/* USER INFO CARD */}
          {member && (
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                padding: '24px',
                marginBottom: '48px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <p
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '12px',
                      color: '#6B7280',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Account Holder
                  </p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>
                    {member.display_name}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                    {member.email}
                  </p>
                </div>

                {userStreak?.tier && (
                  <div>
                    <p
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '12px',
                        color: '#6B7280',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Groove Streak
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>
                        {userStreak.tier.emoji}
                      </span>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
                          {userStreak.tier.name}
                        </p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                          {userStreak.currentMonth} month{userStreak.currentMonth !== 1 ? 's' : ''} 🔥
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
                Total Transactions
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#FF751F',
                }}
              >
                {payments.length}
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                {completedPayments.length} completed
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
                Total Saved
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#FF751F',
                }}
              >
                R{amountSaved.toLocaleString()}
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                {totalSpent > 0 ? 'You are Grooving responsibly' : 'Start saving today'}
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
                Total Points Earned
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#FF751F',
                }}
              >
                {totalSpent.toLocaleString()}
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                From your top-ups
              </p>
            </div>
          </section>

          {/* FILTER TABS */}
          {payments.length > 0 && (
            <div style={{ marginBottom: '32px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['all', 'completed', 'pending', 'failed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: filterStatus === status ? 'none' : '1px solid #E5E7EB',
                    background:
                      filterStatus === status
                        ? 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)'
                        : 'white',
                    color: filterStatus === status ? 'white' : '#1F2937',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (filterStatus !== status) {
                      e.currentTarget.style.background = '#FFF5ED'
                      e.currentTarget.style.borderColor = '#FF751F'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filterStatus !== status) {
                      e.currentTarget.style.background = 'white'
                      e.currentTarget.style.borderColor = '#E5E7EB'
                    }
                  }}
                >
                  {status === 'all' ? 'All Transactions' : `${status.charAt(0).toUpperCase() + status.slice(1)}`}
                </button>
              ))}
            </div>
          )}

          {/* TRANSACTIONS TIMELINE */}
          {filteredPayments.length === 0 ? (
            <div
              style={{
                background: 'white',
                padding: '48px 24px',
                borderRadius: '16px',
                textAlign: 'center',
                border: '1px solid #E5E7EB',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
              }}
            >
              <p style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#1F2937' }}>
                No transactions yet
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                Top up your Groove Balance to get started!
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  marginTop: '16px',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Top Up Now
              </button>
            </div>
          ) : (
            <div>
              {Object.entries(groupedPayments).map(([month, monthPayments]) => (
                <div key={month} style={{ marginBottom: '48px' }}>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#1F2937',
                      margin: '0 0 16px 0',
                      paddingBottom: '12px',
                      borderBottom: '2px solid rgba(255, 117, 31, 0.15)',
                    }}
                  >
                    {month}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {monthPayments.map((payment) => {
                      const statusColor = getStatusColor(payment.status)
                      const date = new Date(payment.created_at)

                      return (
                        <div
                          key={payment.id}
                          style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid #E5E7EB',
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: '16px',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(4px)'
                            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.08)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          {/* LEFT: Transaction Details */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '20px' }}>
                                {getProviderIcon(payment.provider)}
                              </span>
                              <div>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
                                  +{payment.amount} points
                                </p>
                                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                                  {date.toLocaleDateString('en-ZA', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6B7280', textTransform: 'capitalize' }}>
                              Via {payment.provider}
                            </p>
                            {payment.notes && (
                              <p
                                style={{
                                  margin: '8px 0 0 0',
                                  fontSize: '12px',
                                  color: '#6B7280',
                                  fontStyle: 'italic',
                                }}
                              >
                                "{payment.notes}"
                              </p>
                            )}
                          </div>

                          {/* RIGHT: Status Badge */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: '8px',
                            }}
                          >
                            <div
                              style={{
                                background: statusColor.bg,
                                color: statusColor.text,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>{statusColor.icon}</span>
                              <span style={{ textTransform: 'capitalize' }}>
                                {payment.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FOOTER INFO */}
          <div
            style={{
              marginTop: '48px',
              padding: '20px',
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              textAlign: 'center',
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
              <strong style={{ color: '#1F2937' }}>💡 About Groove Balance:</strong> Each top-up adds points to your account. 500 points = 1 Spot. Use your
              spots to lock in events and build your Groove Streak!
            </p>
          </div>
        </div>
      </main>
    </>
  )
}