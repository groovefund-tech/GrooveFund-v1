import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'
import Image from 'next/image'
import ProfileMenu from '../../components/ProfileMenu'

interface Event {
  id: string
  name: string
  event_date: string
  city: string
  venue: string
  location?: string
  ticket_type: string
  capacity: number
  status: string
  price: string | number
  slot_cost: string | number
  image_url?: string
}

export default function AdminEvents() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [adminName, setAdminName] = useState('Admin')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    event_date: '',
    city: '',
    venue: '',
    location: '',
    ticket_type: '',
    capacity: '',
    status: 'open',
    price: '',
    slot_cost: '1',
    image_url: '',
  })

  useEffect(() => {
    checkAdmin()
    loadEvents()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get admin profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, is_admin')
      .eq('id', user.id)
      .single()

    if (profile) {
      setAdminName(profile.display_name || 'Admin')
    }

    if (!profile?.is_admin) {
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)
  }

  const loadEvents = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false })
      setEvents(data || [])
    } catch (err) {
      console.error('Failed to load events:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const res = await fetch('/api/admin/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const result = await res.json()

      if (res.ok) {
        setSuccessMessage('✅ Event created successfully!')
        setForm({
          name: '',
          event_date: '',
          city: '',
          venue: '',
          location: '',
          ticket_type: '',
          capacity: '',
          status: 'open',
          price: '',
          slot_cost: '1',
          image_url: '',
        })
        setShowForm(false)
        loadEvents()
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrorMessage(`❌ ${result.error || 'Failed to create event'}`)
      }
    } catch (err) {
      setErrorMessage(`❌ ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    setLoading(false)
  }

  const deleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Delete "${eventName}"? This cannot be undone.`)) return

    setLoading(true)
    setErrorMessage('')

    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId)
      if (error) {
        setErrorMessage(`❌ ${error.message}`)
      } else {
        setSuccessMessage('✅ Event deleted successfully!')
        setEvents(events.filter((e) => e.id !== eventId))
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (err) {
      setErrorMessage(`❌ ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin)
    return (
      <div style={{ padding: 32, textAlign: 'center', minHeight: '100vh' }}>
        Loading Admin Dashboard…
      </div>
    )

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
            <div
              style={{
                padding: '8px 16px',
                background: '#FFF5ED',
                borderRadius: '20px',
                border: '1px solid #FFE4CC',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#FF751F' }}>
                🛡️ Admin Access
              </span>
            </div>
            <ProfileMenu displayName={adminName} member={{ display_name: adminName } as any} />
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
          {/* HERO SECTION */}
          <section style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1
                  style={{
                    fontSize: '48px',
                    fontWeight: 800,
                    color: '#1F2937',
                    margin: '0 0 8px 0',
                  }}
                >
                  🎵 Manage Grooves
                </h1>
                <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
                  Create and manage Grooves for your community.
                </p>
              </div>
              <button
                onClick={() => router.push('/admin/payments')}
                style={{
                  padding: '10px 16px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1F2937',
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
                ← Back to Admin
              </button>
            </div>
          </section>

          {/* ALERT MESSAGES */}
          {successMessage && (
            <div
              style={{
                padding: '16px',
                background: '#D1FAE5',
                border: '1px solid #A7F3D0',
                borderRadius: '12px',
                color: '#065F46',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{successMessage}</span>
              <button
                onClick={() => setSuccessMessage('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#065F46',
                }}
              >
                ✕
              </button>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                padding: '16px',
                background: '#FEE2E2',
                border: '1px solid #FECACA',
                borderRadius: '12px',
                color: '#DC2626',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#DC2626',
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* CREATE EVENT BUTTON */}
          <div style={{ marginBottom: '48px' }}>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                padding: '12px 24px',
                background: showForm
                  ? 'white'
                  : 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                color: showForm ? '#1F2937' : 'white',
                border: showForm ? '1px solid #E5E7EB' : 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!showForm) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {showForm ? '✕ Cancel' : '➕ Create New Groove'}
            </button>
          </div>

          {/* CREATE EVENT FORM */}
          {showForm && (
            <section style={{ marginBottom: '48px' }}>
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  padding: '32px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                }}
              >
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#1F2937',
                    margin: '0 0 24px 0',
                  }}
                >
                  🎬 Create New Groove
                </h2>

                <form onSubmit={handleSubmit}>
                  {/* Row 1 */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Event Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Black Coffee Weekender"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Event Date *
                      </label>
                      <input
                        type="date"
                        value={form.event_date}
                        onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        City *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Cape Town"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Venue *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Investec Cape Town Art Fair"
                        value={form.venue}
                        onChange={(e) => setForm({ ...form, venue: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Capacity *
                      </label>
                      <input
                        type="number"
                        placeholder="Max attendees"
                        value={form.capacity}
                        onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Ticket Type
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., General Entry"
                        value={form.ticket_type}
                        onChange={(e) => setForm({ ...form, ticket_type: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Price (R)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 750"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Spot Cost *
                      </label>
                      <input
                        type="number"
                        placeholder="How many spots this costs"
                        value={form.slot_cost}
                        onChange={(e) => setForm({ ...form, slot_cost: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 5 */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Status
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="open">Open</option>
                        <option value="full">Full</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Image URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={form.image_url}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      background: loading
                        ? '#D1D5DB'
                        : 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {loading ? '🔄 Creating...' : '✅ Create Groove'}
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* EVENTS LIST */}
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
              📋 All Grooves ({events.length})
            </h2>

            {events.length === 0 ? (
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                }}
              >
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>
                  No Grooves yet
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6B7280' }}>
                  Create your first event to get started
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '24px',
                }}
              >
                {events.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      overflow: 'hidden',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)'
                      e.currentTarget.style.boxShadow =
                        '0 20px 40px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow =
                        '0 10px 25px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    {/* Event Image */}
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.name}
                        style={{
                          width: '100%',
                          height: '160px',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '160px',
                          background:
                            'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 600,
                        }}
                      >
                        No Image
                      </div>
                    )}

                    {/* Event Info */}
                    <div style={{ padding: '20px', flex: 1 }}>
                      <h3
                        style={{
                          margin: '0 0 12px 0',
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#1F2937',
                        }}
                      >
                        {event.name}
                      </h3>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '12px' }}>
                        <div style={{ color: '#6B7280' }}>
                          <p style={{ margin: 0, fontWeight: 600, color: '#1F2937' }}>
                            📅 Date
                          </p>
                          <p style={{ margin: '4px 0 0 0' }}>
                            {new Date(event.event_date).toLocaleDateString('en-ZA', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div style={{ color: '#6B7280' }}>
                          <p style={{ margin: 0, fontWeight: 600, color: '#1F2937' }}>
                            📍 Location
                          </p>
                          <p style={{ margin: '4px 0 0 0' }}>
                            {event.city}
                          </p>
                        </div>
                      </div>

                      <p
                        style={{
                          margin: '0 0 16px 0',
                          fontSize: '12px',
                          color: '#6B7280',
                        }}
                      >
                        <strong>Venue:</strong> {event.venue}
                      </p>

                      {/* Status Badge */}
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          marginBottom: '16px',
                          background:
                            event.status === 'open'
                              ? '#D1FAE5'
                              : event.status === 'full'
                              ? '#FEF08A'
                              : '#FEE2E2',
                          color:
                            event.status === 'open'
                              ? '#065F46'
                              : event.status === 'full'
                              ? '#92400E'
                              : '#DC2626',
                        }}
                      >
                        {event.status === 'open'
                          ? '✅ Open'
                          : event.status === 'full'
                          ? '⚠️ Full'
                          : '❌ Closed'}
                      </div>

                      {/* Event Details */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '12px', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              color: '#6B7280',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            Capacity
                          </p>
                          <p style={{ margin: '4px 0 0 0', color: '#1F2937', fontWeight: 700 }}>
                            {event.capacity} spots
                          </p>
                        </div>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              color: '#6B7280',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                          >
                            Spot Cost
                          </p>
                          <p style={{ margin: '4px 0 0 0', color: '#FF751F', fontWeight: 700 }}>
                            {event.slot_cost} spot{event.slot_cost !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {event.price && (
                        <p
                          style={{
                            margin: '0 0 16px 0',
                            fontSize: '12px',
                            color: '#6B7280',
                          }}
                        >
                          <strong>Price:</strong> R{event.price}
                        </p>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteEvent(event.id, event.name)}
                      disabled={loading}
                      style={{
                        margin: '16px',
                        padding: '10px 16px',
                        background: '#FEE2E2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background = '#FCA5A5'
                          e.currentTarget.style.color = 'white'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#FEE2E2'
                        e.currentTarget.style.color = '#DC2626'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}