// pages/dashboard.tsx
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import ProfileMenu from '../components/ProfileMenu'
import issueTicket from './api/admin/issue-ticket'
import Image from 'next/image'
import { TierInfo, UserStreak, Member } from '../lib/types'



export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const router = useRouter()
  const [member, setMember] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [nextGrooves, setNextGrooves] = useState<any[]>([])
  const [suggested, setSuggested] = useState<any[]>([])
  const [totalSlots, setTotalSlots] = useState(0)
  const [availableSlots, setAvailableSlots] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState<number>(0)
  const [backfillAmount, setBackfillAmount] = useState(500)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState(member?.display_name ?? '')
  const [authReady, setAuthReady] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [confirmedPoints, setConfirmedPoints] = useState(0)
  const [pendingPoints, setPendingPoints] = useState(0)
  const [ticketedEvents, setTicketedEvents] = useState<any[]>([])
  const [membersForEvent, setMembersForEvent] = useState<any[]>([])
  const [confirmationModal, setConfirmationModal] = useState<any>({ isOpen: false, title: '', message: '', onConfirm: () => {}, isLoading: false })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const [adminNotifications, setAdminNotifications] = useState([])
  const [userStreak, setUserStreak] = useState({
    currentMonth: 0, // consecutive months
    totalSpots: 0, // total spots unlocked
    tier: null as any,
    lastContributionMonth: new Date().toISOString().slice(0, 7) // YYYY-MM
    })
  const [totalPoolAmount, setTotalPoolAmount] = useState(0)
  const [totalTicketsPurchased, setTotalTicketsPurchased] = useState(0)


  const [dismissedLeaderboardTip, setDismissedLeaderboardTip] = useState(() => {
    if (typeof window !== 'undefined') {
      if (!member?.id) return false
        return localStorage.getItem('dismissedLeaderboardTip') === 'true'
    }
    return false
 })
  const isTopMember = member?.rank && member.rank <= 40
   
  const updateProfile = async () => {
    if (!newDisplayName.trim()) { setErrorMessage('Display name cannot be empty'); return }
    try {
      const res = await fetch('/api/update-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_name: newDisplayName }) })
      if (!res.ok) { setErrorMessage('Failed to update profile'); return }
      setErrorMessage(null)
      setShowProfileModal(false)
      await loadDashboard()
    } catch (err) { console.error(err); setErrorMessage('Error updating profile') }
  }
  
  const backfillPayment = async () => {
    if (!member?.user_id) return
    try {
      const res = await fetch('/api/admin/backfill-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_user_id: member.user_id, amount: backfillAmount }) })
      const data = await res.json()
      if (res.ok) { setErrorMessage(null); await loadDashboard() } else { setErrorMessage(data.error || 'Backfill failed') }
    } catch (err) { console.error(err); setErrorMessage('Error processing backfill') }
  }


   const membersWith500Plus = leaderboard.filter((m: any) => m.effective_points >= 500).length
   const top40Threshold = Math.ceil(membersWith500Plus * 0.4)
   const isInTop40Badge = member?.effective_points >= 500 && member.rank <= top40Threshold


  const handleTopUp = async (amount: number) => {
    if (!topUpAmount || !member?.user_id) {
      setErrorMessage('Please enter an amount')
      return
    }

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: topUpAmount,
          user_id: member.user_id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Unable to start top-up')
        return
      }

      localStorage.setItem('pendingCheckoutId', data.checkoutId)
      window.location.href = data.checkoutUrl
    } catch (err) {
      console.error(err)
      setErrorMessage('Error starting payment')
    }
  }

  {/* Calculate top 40% OUTSIDE the JSX */}
  
 useEffect(() => {
      const checkProfile = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) { setProfileError('Not authenticated'); return }
          const { data, error } = await supabase.from('profiles').select('id').eq('id', user.id).single()
          if (error || !data) setProfileError("We're setting up your Groove account. Please refresh the page.")
          else setProfileError(null)
        } catch (err) { setProfileError('Unable to load profile. Please try again.') }
        finally { setIsLoadingProfile(false) }
      }
      checkProfile()
    }, [])

  const toggleEvent = (eventId: string) => {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId))
  }

  const applyAdminPayment = async () => {
    if (!member?.user_id) return
    try {
      await fetch('/api/admin/apply-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_user_id: member.user_id, amount: 500 }) })
      await loadDashboard()
      setErrorMessage(null)
    } catch (err) { console.error(err); setErrorMessage('Error applying payment') }
  }

  const joinEvent = async (eventId: string, eventName: string) => {
    console.log('🔍 DEBUGGING: Attempting to lock event:', { eventId, eventName })
    
    setConfirmationModal({
      isOpen: true,
      title: `Lock In ${eventName}?`,
      message: `You're about to lock a spot for this event. You can free it up later if needed.`,
      onConfirm: async () => {
        setConfirmationModal((prev: any) => ({
          ...prev,
          isLoading: true,
        }))
        try {
          if (availableSlots <= 0) {
            setErrorMessage(
              'No available spots. Add Groove Balance to get more spots.'
            )
            setConfirmationModal({
              isOpen: false,
              title: '',
              message: '',
              onConfirm: () => {},
            })
            return
          }

          const { data: { session } } = await supabase.auth.getSession()
          const user = session?.user

          if (!user) {
            setErrorMessage('Not authenticated')
            return
          }

          console.log('🔍 DEBUGGING: Calling join_event RPC with:', { 
            p_user_id: user.id, 
            p_event_id: eventId 
          })

          const { data, error } = await supabase.rpc('join_event', {
            p_user_id: user.id,
            p_event_id: eventId,
          })

          console.log('🔍 DEBUGGING: RPC Response:', { data, error })

          if (error) {
            console.error('🔍 DEBUGGING: RPC Error:', error)
            setErrorMessage(error.message || 'Failed to join event')
          } else {
            setErrorMessage(`🎉 You're locked in and building your streak!`)
            await loadDashboard()
          }
        } catch (err) {
          console.error('Failed to lock spot:', err)
          setErrorMessage('Unable to lock spot for event. Please try again.')
        } finally {
          setConfirmationModal({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: () => {},
          })
        }
      },
      isLoading: false,
    })
  }

  const freeUpSlot = async (eventId: string, eventName: string) => {
    setConfirmationModal({
      isOpen: true,
      title: `Release spot for ${eventName}?`,
      message: `You will lose this spot and the slot will be freed.`,
      onConfirm: async () => {
        setConfirmationModal((prev: any) => ({ ...prev, isLoading: true }))
        try {
          const { data: sessionData } = await supabase.auth.getSession()
          const user = sessionData.session?.user
          if (!user) { router.push('/login'); return }
          const { error } = await supabase.rpc('free_up_slot', { p_user_id: user.id, p_event_id: eventId })
          if (error) { setErrorMessage(error.message || 'Failed to release spot') } else { setErrorMessage(null); await loadDashboard() }
        } catch (err) { console.error('Releasing slot crashed:', err); setErrorMessage('Unable to release spot. Please try again.') }
        finally { setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} }) }
      },
      isLoading: false,
    })
  }

  if (loading) return <div style={{ padding: 32 }}>Loading Your Grooves…</div>
  if (!member) return <div style={{ padding: 32 }}>No member record.</div>

  const joinedIds = (nextGrooves ?? []).map((e: any) => e.id)
  const slotsAfter = Math.floor((confirmedPoints + topUpAmount) / 500)
  const userInitial = member?.display_name?.charAt(0).toUpperCase() || 'U'


  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        setLoading(false)
        return
      }

      const [
        { data: profileRow },
        { data: memberRow },
        { data: leaderboardRows },
        { data: joinedRows },
        { data: streakData } ,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, monthly_slots_used')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('leaderboard_view')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('leaderboard_view')
          .select('*')
          .order('rank', { ascending: true })
          .limit(10),
        supabase
          .from('event_members')
          .select('event:events(*), ticket_issued, active')
          .eq('user_id', user.id)
          .eq('active', true),
         supabase
          .from('profiles')
          .select('current_streak_month, streak_tier, last_contribution_month')
          .eq('id', user.id)
          .single() 
      ])
     
      const confirmed = memberRow?.effective_points ?? 0
      setConfirmedPoints(Math.floor(confirmed))
      setPendingPoints(0)

      const activeNext = Array.isArray(joinedRows)
        ? joinedRows
            .filter((r: any) => r.active === true)
            .map((r: any) => r.event)
        : []

      const joinedIds = new Set(activeNext.map((e: any) => e.id))
        
      // ADD THIS: Set streak state
      if (streakData) {
        setUserStreak({
          currentMonth: streakData.current_streak_month || 0,
          totalSpots: 0,
          tier: getTierInfo(streakData.current_streak_month || 0),
          lastContributionMonth: streakData.last_contribution_month
        })
      }
    console.log('Streak data loaded:', streakData)
    console.log('dismissedLeaderboardTip:', dismissedLeaderboardTip)
    console.log('localStorage value:', localStorage.getItem('dismissedLeaderboardTip'))

      const { data: openEvents } = await supabase
        .from('events')
        .select('*, event_members(count)')
        .eq('status', 'open')

      const suggestedEvents = (openEvents ?? []).filter(
        (e: any) => !joinedIds.has(e.id)
      )

      const tSlots = Math.floor(confirmed / 500)
      // Calculate actual slots used by summing slot_cost from all active events
      const slotsUsed = activeNext.reduce((sum, event) => {
        return sum + (event.slot_cost || 1)
      }, 0)
      const avail = Math.max(0, tSlots - slotsUsed)  // ✅ CORRECT

      setMember({
        ...memberRow,
        monthly_slots_used: profileRow?.monthly_slots_used,
      })
      setLeaderboard(leaderboardRows ?? [])
      setNextGrooves(activeNext)
      setSuggested(suggestedEvents)
      setTotalSlots(tSlots)
      setAvailableSlots(avail)

    } catch (err) {
      console.error('Error loading dashboard:', err)
      setErrorMessage('Failed to load dashboard. Please refresh.')
    } finally {
      setLoading(false)
    }
   console.log('🔍 Dashboard component rendering')
   console.log('🔍 Supabase client:', supabase)

  }, [router])
  
  const getTierInfo = (consecutiveMonths: number) => {
  if (consecutiveMonths >= 24) return { 
    name: 'Stokvel Legend', 
    emoji: '💎', 
    color: '#7C3AED',
    description: "You're legendary. 24 months of pure momentum."
  }
  if (consecutiveMonths >= 12) return { 
    name: 'Stokvel Guardian', 
    emoji: '💎', 
    color: '#FF751F',
    description: "You're a force. A year of commitment unlocked."
  }
  if (consecutiveMonths >= 6) return { 
    name: 'Stokvel Champion', 
    emoji: '🥇', 
    color: '#F59E0B',
    description: "You're unstoppable. Your dedication is showing."
  }
  if (consecutiveMonths >= 3) return { 
    name: 'Stokvel Builder', 
    emoji: '🥈', 
    color: '#9CA3AF',
    description: "You're proving consistency matters. Keep the rhythm going."
  }
  if (consecutiveMonths >= 1) return { 
    name: 'Stokvel Starter', 
    emoji: '🥉', 
    color: '#B45309',
    description: "You've started. You're building the foundation."
  }
  return null
}

    const checkStreakMilestone = (months: number) => {
    if (months === 3) return "🚀 Stokvel Builder unlocked! Your consistency is paying off. Keep pushing."
    if (months === 6) return "🚀 Stokvel Champion unlocked! You're on fire. Keep the momentum going."
    if (months === 12) return "🚀 Stokvel Guardian unlocked! A year of pure dedication."
    if (months === 24) return "🚀 Stokvel Legend unlocked! You're a community pillar."
    return null
    }

      // After successful spot unlock:

    useEffect(() => {
      console.log('🔍 Component mounted, about to call loadPoolMetrics')
      loadPoolMetrics()
    }, [])

  const loadPoolMetrics = async () => {
    try {
      // Calculate total pool
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')

      console.log('🔍 Payment query result:', { paymentData, paymentError })

      if (!paymentError && paymentData) {
        const total = paymentData.reduce((sum, p) => sum + p.amount, 0)
        console.log('💰 Total pool amount:', total)
        setTotalPoolAmount(total)
      } else if (paymentError) {
        console.error('❌ Payment query error:', paymentError)
      }

      // Count total tickets issued
      const { data: ticketData, error: ticketError } = await supabase
        .from('event_members')
        .select('id')
        .eq('ticket_issued', true)

      console.log('🔍 Ticket query result:', { ticketData, ticketError })

      if (!ticketError && ticketData) {
        console.log('🎫 Total tickets purchased:', ticketData.length)
        setTotalTicketsPurchased(ticketData.length)
      } else if (ticketError) {
        console.error('❌ Ticket query error:', ticketError)
      }
    } catch (err) {
      console.error('Error loading pool metrics:', err)
    }
  }

  const handleRetry = () => { setIsLoadingProfile(true); setProfileError(null); window.location.reload() }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { setErrorMessage('Not authenticated'); return }
      setAuthReady(true)
    }
    checkAuth()
  }, [])

  useEffect(() => { if (authReady) loadDashboard() }, [authReady, loadDashboard])
  

  return (
    <>
      {isLoadingProfile ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '20px' }}>
          <p>Setting up your Groove profile...</p>
        </div>
      ) : profileError ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '20px', padding: '20px' }}>
          <p style={{ color: '#d32f2f', marginBottom: '20px' }}>⚠️ {profileError}</p>
          <button onClick={handleRetry} className="btn-primary">Retry</button>
        </div>
      ) : (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9FAFB 0%, #FFF5ED 100%)', overflowX: 'hidden' }}>
          {/* HEADER */}
          <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', position: 'sticky', top: 0, zIndex: 40 }}>
            <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Logo */}
            <Image src="/images/logo.png" alt="GrooveFund" width={120} height={40} style={{ cursor: 'pointer', width: 'auto', height: '32px' }} onClick={() => router.push('/dashboard')} />

              <div></div>
              {/* Right: Rank + Points + Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Rank Badge */}
                {isInTop40Badge && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', borderRadius: '20px', border: 'none', color: 'white', fontSize: '12px', fontWeight: 600 }}>
                    <span>👑</span>
                    <span>TOP 40%</span>
                  </div>
                )}
                  {/* Points Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'white', borderRadius: '20px', border: '1px solid #E5E7EB' }}>
                  <span style={{ fontSize: '18px' }}>⚡</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>{confirmedPoints}</span>
                </div>
                <ProfileMenu
                  displayName={member?.display_name || 'Profile'}
                  userStreak={userStreak}
                  confirmedPoints={confirmedPoints}
                  totalSlots={totalSlots}
                  availableSlots={availableSlots}
                  member={member}
                />
              </div>
            </div>
          </header>
          

          {/* MAIN CONTENT */}
          <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px', overflowX: 'hidden' }}>
            {errorMessage && (
              <div className={`alert-box ${errorMessage.includes('successfully') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '24px' }}>
                <span>{errorMessage}</span>
                <button onClick={() => setErrorMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>✕</button>
              </div>
            )}

            

            {/* HERO SECTION */}
            <section style={{ marginBottom: '48px' }}>
              <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#1F2937', margin: '0 0 8px 0' }}>Hey {member?.display_name?.split(' ')[0] || 'there'} 👋</h1>
              <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>Save smarter. Groove harder. Together.</p>
            </section>

            {!dismissedLeaderboardTip && (
            <div style={{ padding: '12px 16px', background: '#FFF5ED', borderRadius: '12px', border: '1px solid #FFE4CC', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.5', flex: 1 }}>
                <strong style={{ color: '#FF751F', display: 'block', marginBottom: '4px' }}>📊 Welcome To The GrooveFund Community!</strong>
                How it works: Build your Groove Balance by Locking In your Grooves. 1 spot = 500 points. Your place on the Leaderboard is final every 29th, 12pm. Top 40% Groovers are issued tickets at the end of the month. The higher your Groove Balance, the higher you climb. Only Groovers with 1 and more spots qualify for the Top 40%.
                When we issue a ticket to you = -495 points. The next tickets are then bought at the end of the next month. Dates may change so keep notifications open! Your Groove Streak is separate, it tracks your monthly consistency to unlock special perks - did someone say VIP tickets?! Haha, enough with the boring stuff, your journey starts NOW!
                
                Keep Grooving, Keep Climbing! 🚀
                </div>
                <button 
                onClick={() => {
                    setDismissedLeaderboardTip(true)
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('dismissedLeaderboardTip', 'true')
                    }
                    }}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '16px' }}
                >
                ✕
                </button>
            </div>
            )}

            {/* STATS GRID */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '48px' }}>
            <div className="stat-card">
                <div className="stat-label">Groove Balance</div>
                <div className="stat-value">{confirmedPoints}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Keep Climbing!</div>
            </div>
            <div className="stat-card">
                <div className="stat-label">Spots Available</div>
                <div className="stat-value">{availableSlots}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>/ {totalSlots} total</div>
            </div>

            {/* Transparency Section - Pool Size & Tickets Bought */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24, marginBottom: 32 }}>
              {/* Pool Size Card */}
              <div style={{
                background: 'linear-gradient(135deg, #FFF5ED 0%, #FFE8D6 100%)',
                padding: 20,
                borderRadius: 16,
                border: '2px solid #FF751F',
                boxShadow: '0 4px 12px rgba(255, 117, 31, 0.1)',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  🏦 Pool Fund
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#FF751F', marginBottom: 4 }}>
                  R{((totalPoolAmount * 0.88) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 400, lineHeight: 1.4 }}>
                  <div>Total pool (after 12% admin fee)</div>
                  <div style={{ marginTop: 4, fontSize: 11, color: '#9CA3AF' }}>All members' contributions</div>
                </div>
              </div>

              {/* Tickets Bought Card */}
              <div style={{
                background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FF 100%)',
                padding: 20,
                borderRadius: 16,
                border: '2px solid #4F46E5',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.1)',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  🎫 Tickets Secured
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#4F46E5', marginBottom: 4 }}>
                  {totalTicketsPurchased || 0}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 400, lineHeight: 1.4 }}>
                  <div>Community tickets booked</div>
                  <div style={{ marginTop: 4, fontSize: 11, color: '#9CA3AF' }}>Building together 🎵</div>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div style={{
              background: '#F0F9FF',
              border: '1px solid #BFDBFE',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}>
              <div style={{ fontSize: 13, color: '#1E40AF', fontWeight: 500, lineHeight: 1.6 }}>
                💡 <strong>Transparency Matters:</strong> The pool shows what's actually available after our 12% admin fee. More pool = better chances for everyone. Keep contributing to grow the fund!
              </div>
            </div>

            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)' }}>
                <button onClick={() => setShowTopUp(true)} style={{ width: '100%', padding: '12px 0', background: 'white', color: '#FF751F', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>⚡ Top Up</button>
            </div>
            </section>
            
            {/* STREAK WIDGET */}
            {userStreak.currentMonth > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                borderRadius: '20px',
                padding: '24px',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: '24px',
                boxShadow: '0 8px 20px rgba(255, 117, 31, 0.3)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                  {userStreak.tier?.emoji}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', opacity: 0.95 }}>
                  {userStreak.tier?.name}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>
                  {userStreak.currentMonth} month streak 🔥
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9, lineHeight: '1.5' }}>
                  {userStreak.tier?.description}
                </div>
              </div>
            )}

            {/* GROOVES CONTENT FIRST */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' }}>
             
              {/* NEXT GROOVES */}
              
              <section>
               <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1F2937', margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '3px solid rgba(255, 117, 31, 0.15)', letterSpacing: '-0.5px' }}>🥳 Your Locked Grooves</h2>
                {nextGrooves.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-title">No Grooves locked yet</div><div className="empty-state-text">Lock your spot for a Groove below</div></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {nextGrooves.map((e: any) => (
                    <div key={e.id} className="event-card" style={{ background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)', transition: 'all 0.3s ease' }}>
                        {/* EVENT IMAGE */}
                        {e.image_url ? (
                        <img 
                            src={e.image_url} 
                            alt={e.name} 
                            style={{ width: '100%', height: '160px', objectFit: 'cover' }} 
                            onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            }}
                        />
                        ) : (
                        <div style={{ width: '100%', height: '160px', background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 600 }}>No Image</div>
                        )}
                        
                        {/* EVENT INFO */}
                        <div style={{ padding: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', margin: '0 0 12px 0' }}>{e.name}</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
                            <div><strong>Date:</strong> {new Date(e.start_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</div>
                            <div><strong>Time:</strong> {new Date(e.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div style={{ gridColumn: '1 / -1' }}><strong>Location:</strong> {e.city}{e.venue ? ` · ${e.venue}` : ''}</div>
                        </div>
                        {/* ADD COUNTDOWN HERE */}
                            {(() => {
                            const daysUntil = e.start_at ? Math.max(0, Math.ceil((new Date(e.start_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null
                            return daysUntil !== null && daysUntil > 0 ? (
                                <div style={{ fontSize: '11px', color: '#FF751F', fontWeight: 700, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
                                🔥 {daysUntil} {daysUntil === 1 ? 'day' : 'days'} to go!
                                </div>
                            ) : null
                            })()}

                        {/* BUTTON AT BOTTOM */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                        <span style={{ fontSize: '11px', color: '#FF751F', fontWeight: 700 }}>
                          {e.slot_cost && e.slot_cost > 1 ? `uses ${e.slot_cost} spots` : 'uses 1 spot'}
                        </span>
                        {joinedIds.includes(e.id) ? (
                          <button onClick={() => freeUpSlot(e.id, e.name)} className="btn-danger" style={{ padding: '8px 12px', fontSize: '12px' }}>
                            Release Spot
                          </button>
                        ) : (
                          <button disabled={availableSlots <= 0} onClick={() => joinEvent(e.id, e.name)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', opacity: availableSlots <= 0 ? 0.5 : 1, cursor: availableSlots <= 0 ? 'not-allowed' : 'pointer' }}>
                            Lock Spot
                          </button>
                        )}
                      </div>
                        </div>
                    </div>
                    ))}
                  </div>
                )}
              </section>

              {/* RECOMMENDED GROOVES */}
              <section>
               <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1F2937', margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '3px solid rgba(255, 117, 31, 0.15)', letterSpacing: '-0.5px' }}>🎵 Discover Grooves</h2>
                {suggested.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-title">No Grooves available yet.</div><div className="empty-state-text">Check back soon for new community Grooves</div></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {suggested.map((event: any) => {
                    const isExpanded = expandedEventId === event.id
                    const isJoined = joinedIds.includes(event.id)
                    return (
                        <div key={event.id} className="event-card" style={{ background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)', transition: 'all 0.3s ease' }}>
                        {/* EVENT IMAGE */}
                        {event.image_url ? (
                            <img 
                            src={event.image_url} 
                            alt={event.name} 
                            style={{ width: '100%', height: '160px', objectFit: 'cover' }} 
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                            }}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '160px', background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 600 }}>No Image</div>
                        )}
                        
                        {/* EVENT INFO */}
                        <div style={{ padding: '16px' }}>
                            
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', margin: '0 0 12px 0' }}>{event.name}</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
                            <div><strong>Date:</strong> {new Date(event.start_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</div>
                            <div><strong>Time:</strong> {new Date(event.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div style={{ gridColumn: '1 / -1' }}><strong>Location:</strong> {event.city}{event.venue ? ` · ${event.venue}` : ''}</div>
                            </div>
                             {/* ADD COUNTDOWN HERE */}
                            {(() => {
                            const daysUntil = event.start_at ? Math.max(0, Math.ceil((new Date(event.start_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null
                            return daysUntil !== null && daysUntil > 0 ? (
                                <div style={{ fontSize: '11px', color: '#FF751F', fontWeight: 700, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
                                🔥 {daysUntil} {daysUntil === 1 ? 'day' : 'days'} to go!
                                </div>
                            ) : null
                            })()}

                            {/* BUTTON AT BOTTOM */}
                            <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#FF751F', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>Popular in {event.city}</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                            <span style={{ fontSize: '11px', color: '#FF751F', fontWeight: 700 }}>
                              {event.slot_cost && event.slot_cost > 1 ? `uses ${event.slot_cost} spots` : 'uses 1 spot'}
                            </span>
                            {joinedIds.includes(event.id) ? (
                              <button onClick={() => freeUpSlot(event.id, event.name)} className="btn-danger" style={{ padding: '8px 12px', fontSize: '12px' }}>
                                Release Spot
                              </button>
                            ) : (
                              <button disabled={availableSlots <= 0} onClick={() => joinEvent(event.id, event.name)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', opacity: availableSlots <= 0 ? 0.5 : 1, cursor: availableSlots <= 0 ? 'not-allowed' : 'pointer' }}>
                                Lock Spot
                              </button>
                            )}
                          </div>
                        </div>
                        </div>
                    )
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* LEADERBOARD + QUICK ACTIONS (BOTTOM) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* LEADERBOARD */}
              <section>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: '2px solid rgba(255, 117, 31, 0.1)' }}>🏆 Top Groove Members</h3>
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)' }}>
                  {leaderboard.slice(0, 5).map((l: any, i: number) => (
                    <div key={l.user_id} className="leaderboard-item" style={{ padding: '12px 16px', borderBottom: i < 4 ? '1px solid #E5E7EB' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="leaderboard-rank" style={{ fontSize: '14px', fontWeight: 700, color: '#FF751F', minWidth: '30px' }}>#{l.rank}</div>
                      <div className="leaderboard-name" style={{ flex: 1, fontSize: '14px', color: '#1F2937', fontWeight: 500 }}>{l.display_name ?? 'Anon'}</div>
                      <div className="leaderboard-points" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>{l.effective_points}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push('/leaderboard')} style={{ marginTop: '12px', color: '#FF751F', background: 'none', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'center', transition: 'all 0.2s ease' }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}>View Full Leaderboard →</button>
              </section>


            {/* QUICK ACTIONS */}
            <section style={{ background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '16px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', margin: '0 0 12px 0' }}>⚡ Quick Actions</h3>
              <button onClick={() => setShowTopUp(true)} className="btn-primary" style={{ width: '100%', marginBottom: '12px', fontSize: '13px', padding: '10px', fontWeight: 600 }}>Top Up Groove Balance</button>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  setTimeout(() => {
                    const profileButton = document.querySelector('[aria-label="Profile Menu"]') as HTMLButtonElement
                    if (profileButton) profileButton.click()
                  }, 300)
                }}
                className="btn-secondary"
                style={{ width: '100%', marginBottom: '12px', fontSize: '13px', padding: '10px', fontWeight: 600 }}
              >
                Edit Profile
              </button>
              <button onClick={() => router.push('/help')} className="btn-secondary" style={{ width: '100%', fontSize: '13px', padding: '10px', fontWeight: 600 }}>❓ Help & FAQs</button>
            </section>
              </div>
          </main>

          {/* MODALS */}
          {showTopUp && (
            <div className="modal-backdrop">
              <div className="modal-content">
                <h3 className="modal-title">Add to your Groove Balance</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {[500, 1000, 1500].map((preset) => (
                    <button key={preset} onClick={() => setTopUpAmount(preset)} style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: topUpAmount === preset ? 'none' : '2px solid #E5E7EB', background: topUpAmount === preset ? 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)' : 'white', color: topUpAmount === preset ? 'white' : '#111827', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Poppins, sans-serif' }} >R{preset}</button>
                  ))}
                </div>
                <input type="number" min={0} step={50} placeholder="Amount (ZAR)" value={topUpAmount} onChange={(e) => setTopUpAmount(Number(e.target.value))} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E5E7EB', marginBottom: '12px', fontSize: '13px', boxSizing: 'border-box' }} />
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '10px', marginBottom: '16px', fontSize: '12px', color: '#374151' }}>
                  <div>New Balance: <strong>{confirmedPoints + topUpAmount} pts</strong></div>
                  <div>New Spots: <strong>{slotsAfter}</strong></div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowTopUp(false)} className="btn-secondary" style={{ flex: 1, fontSize: '13px', padding: '10px' }}>Cancel</button>
                  <button onClick={handleTopUp} className="btn-primary" style={{ flex: 1, fontSize: '13px', padding: '10px' }}>Add Groove Balance</button>
                </div>
              </div>
            </div>
          )}
          
            <div style={{ position: 'fixed', top: 60, right: 24, zIndex: 50 }}>
           
            </div>
            
          {confirmationModal.isOpen && (
            <div className="modal-backdrop">
              <div className="modal-content">
                <h3 className="modal-title">{confirmationModal.title}</h3>
                <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>{confirmationModal.message}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })} disabled={confirmationModal.isLoading} className="btn-secondary" style={{ flex: 1, fontSize: '13px', padding: '10px', opacity: confirmationModal.isLoading ? 0.5 : 1 }}>Cancel</button>
                  <button onClick={confirmationModal.onConfirm} disabled={confirmationModal.isLoading} className="btn-primary" style={{ flex: 1, fontSize: '13px', padding: '10px', opacity: confirmationModal.isLoading ? 0.5 : 1 }}>{confirmationModal.isLoading ? 'Processing...' : 'Confirm'}</button>
                <button
                  onClick={() => router.push('/referrals')}
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    fontSize: '13px',
                    padding: '10px',
                    fontWeight: 600,
                  }}
                >
                  🎁 Refer & Earn
                </button>
                </div>
              </div>
            </div>
          )}
         
          {isAdmin && showAdminPanel && (
            <div style={{ border: '1px solid #E5E7EB', padding: '16px', borderRadius: '12px', marginTop: '16px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', marginBottom: '12px' }}>Admin Panel</h3>
              <button onClick={applyAdminPayment} style={{ fontSize: '13px', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer', marginBottom: '8px', width: '100%' }}>+500 points</button>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input type="number" min={0} step={50} value={backfillAmount} onChange={(e) => setBackfillAmount(Number(e.target.value))} placeholder="Amount" style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', boxSizing: 'border-box' }} />
                <button onClick={backfillPayment} style={{ fontSize: '13px', padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>Apply</button>
              </div>
              <button onClick={() => setShowAdminPanel(false)} style={{ fontSize: '12px', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', cursor: 'pointer', opacity: 0.7, width: '100%' }}>Close</button>
            </div>
          )}
          {adminNotifications.filter((n: any) => !n.read).length > 0 && (
            <div style={{ padding: '16px', background: '#FEE2E2', borderRadius: '12px', border: '1px solid #FCA5A5', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', marginBottom: '8px' }}>
                ⚠️ {adminNotifications.filter((n: any) => !n.read).length} Action{adminNotifications.filter((n: any) => !n.read).length > 1 ? 's' : ''} Required
                </div>
                {adminNotifications.filter((n: any) => !n.read).map((notif: any) => (
                <div key={notif.id} style={{ fontSize: '12px', color: '#991B1B', marginBottom: '6px', padding: '8px', background: 'white', borderRadius: '6px' }}>
                    <strong>{notif.action}:</strong> {notif.details}
                </div>
                ))}
            </div>
            )}
        </div>
      )}
    </>
  )
}
