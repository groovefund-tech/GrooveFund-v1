import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/router'

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

interface Member {
  user_id: string
  email: string
  display_name: string
  rank?: number
  effective_points?: number
  referral_code?: string
}

export default function ProfileMenu({
  displayName,
  userStreak,
  confirmedPoints,
  totalSlots,
  availableSlots,
  member,
}: {
  displayName: string
  userStreak?: UserStreak
  confirmedPoints?: number
  totalSlots?: number
  availableSlots?: number
  member?: Member
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(displayName)
  const [editPhone, setEditPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [myTickets, setMyTickets] = useState<any[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [newDisplayName, setNewDisplayName] = useState<string>(displayName || '')
   const [showProfileModal, setShowProfileModal] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    checkAdminStatus()
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadMyTickets()
    }
  }, [isOpen])

  const checkAdminStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single()

      if (data) {
        setIsAdmin(true)
      }
    } catch (err) {
      // User is not admin, that's fine
    }
  }

  const handleSaveName = async () => {
    if (!editName.trim()) {
      setErrorMessage('Display name cannot be empty')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setErrorMessage('Not authenticated')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          display_name: editName.trim(),
          phone: editPhone || null,
        })
        .eq('id', user.id)

      if (error) {
        setErrorMessage('Failed to update: ' + error.message)
        setLoading(false)
        return
      }

      setErrorMessage(null)
      setIsEditing(false)
      alert('✅ Profile updated!')
      // Refresh the profile data if needed

        // ✅ RELOAD THE DASHBOARD DATA
      window.location.reload() // Simple refresh
      // OR if you have a loadDashboard function:
      // await loadDashboard()

    } catch (err) {
      console.error('Error:', err)
      setErrorMessage('Error updating profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const loadMyTickets = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('event_members')
        .select('ticket_id, ticket_url, event:events(name, start_at)')
        .eq('user_id', user.id)
        .not('ticket_url', 'is', null)

      if (!error && data && data.length > 0) {
        setMyTickets(data)
      } else {
        setMyTickets([])
      }
    } catch (err) {
      console.error('Error loading tickets:', err)
      setMyTickets([])
    }
  }

  const updateProfile = async () => {
    if (!newDisplayName.trim()) {
      setErrorMessage('Display name cannot be empty')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setErrorMessage('Not authenticated')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: newDisplayName.trim() })
        .eq('id', user.id)

      if (error) {
        setErrorMessage('Failed: ' + error.message)
        return
      }

      setShowProfileModal(false)
      alert('✅ Profile updated!')
      // Reload profile data if needed

    } catch (err) {
      setErrorMessage('Error updating profile')
    }
  }

  const userInitial = displayName?.charAt(0).toUpperCase() || 'U'

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Avatar Button */}
      <button
        aria-label="Profile Menu"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 700,
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(255, 117, 31, 0.3)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {userInitial}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
            marginTop: '12px',
            minWidth: '380px',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {/* PROFILE HEADER SECTION */}
          <div
            style={{
              padding: '20px',
              borderBottom: '1px solid #E5E7EB',
              background: 'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)',
            }}
          >
            {/* Name and Tier */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(255, 117, 31, 0.3)',
                }}
              >
                {userInitial}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', fontWeight: 500 }}>
                  Account
                </p>
                <p style={{ margin: '4px 0 0 0', fontWeight: 700, fontSize: '16px', color: '#1F2937' }}>
                  {displayName}
                </p>
              </div>
            </div>

            {/* Tier Badge */}
            {userStreak?.tier && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: `${userStreak.tier.color}15`,
                  border: `1px solid ${userStreak.tier.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <span style={{ fontSize: '16px' }}>{userStreak.tier.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>
                    {userStreak.tier.name}
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>
                    {userStreak.currentMonth} month{userStreak.currentMonth !== 1 ? 's' : ''} 🔥
                  </p>
                </div>
              </div>
            )}

            {/* Referral Code Section */}
            <div
              style={{
                padding: '12px 16px',
                background: '#F9FAFB',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                marginTop: '12px',
                marginBottom: '12px',
              }}
            >
              <p
                style={{
                  margin: '0 0 6px 0',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Your Referral Code
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#FF751F',
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                  }}
                >
                  {member?.referral_code || 'N/A'}
                </span>
                {member?.referral_code && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(member.referral_code!)
                      alert('✅ Referral code copied!')
                    }}
                    style={{
                      padding: '4px 8px',
                      background: '#FFF5ED',
                      border: '1px solid #FFE4CC',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#FF751F',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FF751F'
                      e.currentTarget.style.color = 'white'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FFF5ED'
                      e.currentTarget.style.color = '#FF751F'
                    }}
                  >
                    📋 Copy
                  </button>
                )}
              </div>
            </div>

            {/* Rank Badge */}
            {member?.rank && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: 0,
                }}
              >
                <span style={{ fontSize: '14px' }}>👑</span>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>
                  Rank #{member.rank}
                </p>
              </div>
            )}
          </div>

          {/* QUICK STATS SECTION */}
          {(confirmedPoints !== undefined || totalSlots !== undefined || userStreak?.currentMonth) && (
            <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {confirmedPoints !== undefined && (
                  <div
                    style={{
                      padding: '12px',
                      background: '#F9FAFB',
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>
                      Balance
                    </p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FF751F' }}>
                      {confirmedPoints.toLocaleString()}
                    </p>
                  </div>
                )}
                {totalSlots !== undefined && (
                  <div
                    style={{
                      padding: '12px',
                      background: '#F9FAFB',
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>
                      Spots
                    </p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#FF751F' }}>
                      {availableSlots}/{totalSlots}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACCOUNT MENU SECTION */}
          <div style={{ padding: '8px' }}>
            {/* Edit Display Name */}
            <button
              onClick={() => setIsEditing(true)}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#1F2937',
                fontWeight: 500,
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FFF5ED'
                e.currentTarget.style.color = '#FF751F'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = '#1F2937'
              }}
            >
              ✏️ Update Your Profile
            </button>

            {/* Your Transactions */}
            <Link href="/payments" style={{ textDecoration: 'none' }}>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#1F2937',
                  fontWeight: 500,
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FFF5ED'
                  e.currentTarget.style.color = '#FF751F'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = '#1F2937'
                }}
              >
                💳 Your Transactions
              </button>
            </Link>
          </div>

          {/* MY GROOVE TICKETS SECTION */}
          {myTickets.length > 0 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
              <h4
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                🎫 My Groove Tickets
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myTickets.map((ticket: any) => {
                  const eventDate = ticket.event?.start_at ? new Date(ticket.event.start_at) : null
                  const daysUntil = eventDate
                    ? Math.max(
                        0,
                        Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      )
                    : null

                  return (
                    <div
                      key={ticket.ticket_id}
                      style={{
                        padding: '12px',
                        background: '#F9FAFB',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#FFFFFF'
                        e.currentTarget.style.borderColor = '#FF751F'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F9FAFB'
                        e.currentTarget.style.borderColor = '#E5E7EB'
                      }}
                    >
                      <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#1F2937', fontSize: '13px' }}>
                        {ticket.event?.name}
                      </p>
                      <p style={{ margin: '0 0 8px 0', color: '#6B7280', fontSize: '12px' }}>
                        {eventDate ? formatDate(eventDate.toISOString()) : 'Date TBA'}
                        {daysUntil !== null && daysUntil > 0 && (
                          <span style={{ color: '#FF751F', fontWeight: 600, marginLeft: '4px' }}>
                            • {daysUntil}d away
                          </span>
                        )}
                      </p>
                      {ticket.ticket_url && (
                        <a
                          href={ticket.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            color: '#FF751F',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '12px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: '#FFF5ED',
                            transition: 'all 0.2s ease',
                            border: '1px solid #FFE4CC',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)'
                            e.currentTarget.style.color = 'white'
                            e.currentTarget.style.borderColor = '#FF751F'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FFF5ED'
                            e.currentTarget.style.color = '#FF751F'
                            e.currentTarget.style.borderColor = '#FFE4CC'
                          }}
                        >
                          ⬇️ Download PDF
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ADMIN DASHBOARD SECTION */}
          {isAdmin && (
            <div style={{ borderTop: '1px solid #E5E7EB', padding: '8px' }}>
              <Link href="/admin/payments" style={{ textDecoration: 'none' }}>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#FF751F',
                    fontWeight: 600,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FFF5ED'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none'
                  }}
                >
                  ⚙️ Admin Dashboard
                </button>
              </Link>
            </div>
          )}

          {/* LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#EF4444',
              fontWeight: 600,
              borderRadius: '8px',
              marginTop: 0,
              borderTop: '1px solid #E5E7EB',
              paddingTop: '12px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FEE2E2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            🚪 Logout
          </button>
        </div>
      )}

      {/* EDIT NAME MODAL */}
      {isEditing && (
        <div
          onClick={() => setIsEditing(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              padding: '32px',
              borderRadius: '24px',
              minWidth: '400px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
            }}
          >
            <h2
              style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1F2937',
                fontFamily: 'Poppins',
              }}
            >
              Edit Profile
            </h2>

            {/* Error Message */}
            {errorMessage && (
              <div
                style={{
                  padding: '12px',
                  marginBottom: '16px',
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  color: '#DC2626',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Display Name */}
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
                Display Name
              </p>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'Poppins',
                }}
                placeholder="Your display name"
              />
            </label>

            {/* Phone Number */}
            <label style={{ display: 'block', marginBottom: '24px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
                Phone Number
              </p>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'Poppins',
                }}
                placeholder="Your phone number"
              />
            </label>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: 'white',
                  color: '#1F2937',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  fontFamily: 'Poppins',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF751F'
                  e.currentTarget.style.background = '#FFF5ED'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB'
                  e.currentTarget.style.background = 'white'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  fontFamily: 'Poppins',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}