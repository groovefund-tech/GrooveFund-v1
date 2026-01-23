import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
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

export default function Leaderboard() {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [userStreak, setUserStreak] = useState<UserStreak>({
    currentMonth: 0,
    tier: null,
    lastContributionMonth: new Date().toISOString().slice(0, 7),
  })
  const pageSize = 50

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

  const loadLeaderboard = useCallback(async () => {
    setLoading(true)
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    if (!user) {
      router.push('/login')
      return
    }

    // 1. Full leaderboard (paginated)
    const offset = (page - 1) * pageSize
    const { data: leaderboardRows } = await supabase
      .from('leaderboard_view')
      .select('*')
      .order('rank', { ascending: true })
      .range(offset, offset + pageSize - 1)

    // 2. Current user's row (even if not in top 50)
    const { data: userRow } = await supabase
      .from('leaderboard_view')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 3. User's streak data
    const { data: streakData } = await supabase
      .from('profiles')
      .select('current_streak_month, streak_tier, last_contribution_month')
      .eq('id', user.id)
      .single()

    if (streakData) {
      setUserStreak({
        currentMonth: streakData.current_streak_month || 0,
        tier: getTierInfo(streakData.current_streak_month || 0),
        lastContributionMonth: streakData.last_contribution_month,
      })
    }

    setLeaderboard(leaderboardRows ?? [])
    setCurrentUser(userRow ?? null)
    setLoading(false)
  }, [page, router])

  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  if (loading)
    return (
      <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh' }}>
        Loading Leaderboard…
      </div>
    )

  // Filter members with 500+ points
  const qualifyingMembers = leaderboard.filter(
    (user: any) => user.effective_points >= 500
  )

  // Calculate top 40% of qualifying members only
  const top40Percent = Math.floor(qualifyingMembers.length * 0.4)

  const isUserOnPage = leaderboard.some(
    (u: any) => u.user_id === currentUser?.user_id
  )

  // Get highest points for visualization
  const maxPoints = Math.max(...leaderboard.map((u: any) => u.effective_points), 1000)

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
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
          {/* Logo */}
          <Image
            src="/images/logo.png"
            alt="GrooveFund"
            width={120}
            height={40}
            style={{ cursor: 'pointer', width: 'auto', height: '32px' }}
            onClick={() => router.push('/dashboard')}
          />
          <div></div>
          {/* Right: Points + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {currentUser?.effective_points && (
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
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1F2937',
                  }}
                >
                  {currentUser.effective_points}
                </span>
              </div>
            )}
            <ProfileMenu
              displayName={currentUser?.display_name || 'Profile'}
              userStreak={userStreak}
              confirmedPoints={currentUser?.effective_points}
              member={currentUser}
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
              🏆 Leaderboard
            </h1>
            <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
              Rank up, earn tickets, and build your Groove streak.
            </p>
          </section>

          {/* STATS OVERVIEW */}
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
                }}
              >
                Total Members
              </p>
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#FF751F',
                }}
              >
                {leaderboard.length}+
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
                }}
              >
                Top 40% Threshold
              </p>
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#FF751F',
                }}
              >
                #{top40Percent}
              </p>
            </div>

            {currentUser && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                  borderRadius: '16px',
                  padding: '20px',
                  color: 'white',
                  boxShadow: '0 10px 25px rgba(255, 117, 31, 0.3)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    opacity: 0.95,
                  }}
                >
                  Your Rank
                </p>
                <p
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '32px',
                    fontWeight: 800,
                  }}
                >
                  #{currentUser.rank}
                </p>
              </div>
            )}
          </section>

          {/* CURRENT USER HIGHLIGHT (if not on page) */}
          {currentUser && !isUserOnPage && (
            <section style={{ marginBottom: '48px' }}>
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  border: '2px solid #FF751F',
                  padding: '24px',
                  boxShadow: '0 10px 25px rgba(255, 117, 31, 0.15)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '24px',
                    alignItems: 'center',
                  }}
                >
                  {/* Left: Your Position */}
                  <div>
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
                      Your Current Position
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '12px',
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontSize: '48px',
                          fontWeight: 800,
                          color: '#FF751F',
                        }}
                      >
                        #{currentUser.rank}
                      </h2>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          color: '#6B7280',
                          fontWeight: 500,
                        }}
                      >
                        of {leaderboard.length}+ members
                      </p>
                    </div>
                  </div>

                  {/* Right: User Info & Stats */}
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#1F2937',
                          marginBottom: '4px',
                        }}
                      >
                        {currentUser.display_name ?? 'Anonymous'}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          color: '#6B7280',
                          fontWeight: 500,
                        }}
                      >
                        {currentUser.effective_points} points
                      </p>
                    </div>

                    {/* Tier Badge */}
                    {userStreak?.tier && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: `${userStreak.tier.color}15`,
                          border: `1px solid ${userStreak.tier.color}30`,
                          borderRadius: '8px',
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>
                          {userStreak.tier.emoji}
                        </span>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#1F2937',
                          }}
                        >
                          {userStreak.tier.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top 40% Indicator */}
                {currentUser.effective_points >= 500 &&
                  qualifyingMembers.findIndex(
                    (m: any) => m.user_id === currentUser.user_id
                  ) +
                    1 <=
                    top40Percent && (
                    <div
                      style={{
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid #E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>✨</span>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#FF751F',
                        }}
                      >
                        You're in the TOP 40% and will receive a ticket at month end!
                      </p>
                    </div>
                  )}
              </div>
            </section>
          )}

          {/* LEADERBOARD CARDS */}
          <section>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#1F2937',
                margin: '0 0 24px 0',
                paddingBottom: '16px',
                borderBottom: '3px solid rgba(255, 117, 31, 0.15)',
                letterSpacing: '-0.5px',
              }}
            >
              🎯 Groove Rankings
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
                marginBottom: '48px',
              }}
            >
              {leaderboard.map((user: any) => {
                const isCurrentUser = user.user_id === currentUser?.user_id
                const qualifies = user.effective_points >= 500
                const rankInQualifying =
                  qualifyingMembers.findIndex(
                    (m: any) => m.user_id === user.user_id
                  ) + 1
                const isTop40 = qualifies && rankInQualifying <= top40Percent
                const medal = getMedalEmoji(user.rank)
                const progressPercent = (user.effective_points / maxPoints) * 100

                return (
                  <div
                    key={user.user_id}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      border: isCurrentUser ? '2px solid #FF751F' : '1px solid #E5E7EB',
                      padding: '20px',
                      boxShadow: isCurrentUser
                        ? '0 10px 25px rgba(255, 117, 31, 0.15)'
                        : '0 10px 25px rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentUser) {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow =
                          '0 15px 35px rgba(0, 0, 0, 0.12)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentUser) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow =
                          '0 10px 25px rgba(0, 0, 0, 0.08)'
                      }
                    }}
                  >
                    {/* Badge Section */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '16px',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background:
                            medal || user.rank <= 10
                              ? 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)'
                              : '#F3F4F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: medal || user.rank <= 10 ? 'white' : '#1F2937',
                          fontWeight: 700,
                          fontSize: '18px',
                          boxShadow:
                            medal || user.rank <= 10
                              ? '0 4px 12px rgba(255, 117, 31, 0.3)'
                              : 'none',
                        }}
                      >
                        {medal ? medal : `#${user.rank}`}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#1F2937',
                          }}
                        >
                          {user.display_name ?? 'Anonymous'}
                          {isCurrentUser && (
                            <span
                              style={{
                                color: '#FF751F',
                                fontWeight: 600,
                                marginLeft: '6px',
                              }}
                            >
                              ← You
                            </span>
                          )}
                        </p>
                        <p
                          style={{
                            margin: '2px 0 0 0',
                            fontSize: '12px',
                            color: '#6B7280',
                          }}
                        >
                          Rank #{user.rank}
                        </p>
                      </div>
                    </div>

                    {/* Points Section */}
                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: '8px',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#6B7280',
                          }}
                        >
                          Groove Balance
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#FF751F',
                          }}
                        >
                          {user.effective_points}
                        </p>
                      </div>
                      {/* Progress Bar */}
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          background: '#E5E7EB',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #FF751F 0%, #FF8C42 100%)',
                            width: `${progressPercent}%`,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {isTop40 && (
                        <span
                          style={{
                            backgroundColor: '#FF751F',
                            color: '#FFFFFF',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          🎟️ TOP 40%
                        </span>
                      )}
                      {user.rank <= 10 && (
                        <span
                          style={{
                            backgroundColor: '#FFF5ED',
                            color: '#FF751F',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: '1px solid #FFE4CC',
                          }}
                        >
                          🔥 Top 10
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* PAGINATION */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '48px',
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '10px 16px',
                background: page === 1 ? '#E5E7EB' : 'white',
                color: page === 1 ? '#9CA3AF' : '#1F2937',
                border: page === 1 ? '1px solid #E5E7EB' : '1px solid #E5E7EB',
                borderRadius: '10px',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (page > 1) {
                  e.currentTarget.style.background = '#FFF5ED'
                  e.currentTarget.style.borderColor = '#FF751F'
                }
              }}
              onMouseLeave={(e) => {
                if (page > 1) {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.borderColor = '#E5E7EB'
                }
              }}
            >
              ← Previous
            </button>

            <div
              style={{
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1F2937',
                  padding: '0 8px',
                }}
              >
                Page {page}
              </span>
            </div>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={leaderboard.length < pageSize}
              style={{
                padding: '10px 16px',
                background:
                  leaderboard.length < pageSize ? '#E5E7EB' : 'white',
                color: leaderboard.length < pageSize ? '#9CA3AF' : '#1F2937',
                border:
                  leaderboard.length < pageSize
                    ? '1px solid #E5E7EB'
                    : '1px solid #E5E7EB',
                borderRadius: '10px',
                cursor:
                  leaderboard.length < pageSize
                    ? 'not-allowed'
                    : 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (leaderboard.length >= pageSize) {
                  e.currentTarget.style.background = '#FFF5ED'
                  e.currentTarget.style.borderColor = '#FF751F'
                }
              }}
              onMouseLeave={(e) => {
                if (leaderboard.length >= pageSize) {
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.borderColor = '#E5E7EB'
                }
              }}
            >
              Next →
            </button>
          </div>

          {/* Footer Info */}
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
              <strong style={{ color: '#1F2937' }}>💡 How it works:</strong> Your final rank updates every 29th at
              12pm. Top 40% members qualify for monthly tickets. Build your
              Groove Balance by locking in events, and watch your streak grow!
            </p>
          </div>
        </div>
      </main>
    </>
  )
}