
// pages/transparency.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Image from 'next/image'

interface TransparencyData {
  totalMembers: number
  totalContributed: number
  poolSize: number
  adminFeeTotal: number
  ticketsIssued: number
  activeMembers: number
}

export default function TransparencyReport() {
  const [data, setData] = useState<TransparencyData>({
    totalMembers: 0,
    totalContributed: 0,
    poolSize: 0,
    adminFeeTotal: 0,
    ticketsIssued: 0,
    activeMembers: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadTransparencyData()
  }, [])

  const loadTransparencyData = async () => {
    try {
      // Get total members
      const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })

      // Get total contributions and pool data
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('status', 'completed')

      const totalContributed =
        payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      const adminFee = totalContributed * 0.12
      const poolSize = totalContributed * 0.88

      // Get tickets issued
      const { count: ticketCount } = await supabase
        .from('event_members')
        .select('*', { count: 'exact' })
        .eq('ticket_issued', true)

      // Get active members (contributed in last 40 days)
      const fortyDaysAgo = new Date()
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40)

      const { data: activePayments } = await supabase
        .from('payments')
        .select('user_id', { count: 'exact' })
        .eq('status', 'completed')
        .gte('created_at', fortyDaysAgo.toISOString())

      const uniqueActiveUsers = new Set(
        activePayments?.map(p => p.user_id) || []
      )

      setData({
        totalMembers: memberCount || 0,
        totalContributed,
        poolSize: Math.round(poolSize),
        adminFeeTotal: Math.round(adminFee),
        ticketsIssued: ticketCount || 0,
        activeMembers: uniqueActiveUsers.size,
      })
    } catch (err) {
      console.error('Error loading transparency data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', background: '#FAFAFA', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Image src="/images/logo.png" alt="GrooveFund" width={120} height={40} style={{ cursor: 'pointer', width: 'auto', height: '32px' }} onClick={() => router.push('/')} />
          <button onClick={() => router.push('/login')} style={{ padding: '10px 20px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.2s', }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 117, 31, 0.2)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
            Log in
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 20px' }}>
        {/* ========== TRANSPARENCY REPORT SECTION ========== */}
        
     

        {/* ========== PRIVACY POLICY SECTION ========== */}
        
        {/* Privacy Hero */}
        <section style={{ textAlign: 'center', marginBottom: '64px', paddingTop: '48px', borderTop: '2px solid #E5E7EB' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#1F2937', margin: '0 0 12px 0', lineHeight: 1.1 }}>
            🔒 Privacy Policy
          </h1>
          <p style={{ fontSize: '18px', color: '#6B7280', margin: '0 0 32px 0', maxWidth: '600px', margin: '0 auto 32px' }}>
            We keep your data safe.
          </p>
        </section>

        {/* Privacy Sections */}
        <section style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gap: '24px', marginBottom: '64px' }}>
          {[
            {
              title: 'What Info We Collect',
              emoji: '📋',
              items: [
                'Your full name, DOB, and ID/Passport number',
                'Your address, email, and phone number',
                'Your bank details (for monthly contributions)',
                'Whether you want to attend concerts with other Groovers',
                'Your monthly contribution amount',
              ],
              footer: 'We only ask for what we actually need. Promise.',
            },
            {
              title: 'What We Do With It',
              emoji: '🔄',
              items: [
                'Process your monthly contributions securely',
                'Calculate your Groove Balance score and leaderboard rank',
                'Match you with events based on your preferences',
                'Send you event reminders and updates',
                'Stay compliant with South African law',
              ],
              footer: 'We never sell your data. We never share it without asking. Period.',
            },
            {
              title: 'How We Protect Your Data (POPIA)',
              emoji: '🔒',
              items: [
                'All data encrypted in transit and at rest',
                'Stored on Supabase (ISO 27001 certified - bank-level security)',
                'Only authorized GrooveFund team members can access it',
                'No third parties. No exceptions.',
              ],
            },
            {
              title: 'Your Rights',
              emoji: '✋',
              items: [
                'See what data we have about you',
                'Fix anything that is wrong',
                'Ask us to delete your info (within legal limits)',
                'Get your data in a portable format',
                'Tell us to stop processing your info',
              ],
              footer: 'Want to exercise these rights? Email support@groovefund.co.za',
            },
            {
              title: 'Payment Security',
              emoji: '💳',
              description: 'Your bank details go through YOCO (PCI-DSS certified payment processor). We never see or store your raw bank info.',
            },
            {
              title: 'Cookies & Tracking',
              emoji: '🍪',
              description: 'We use essential cookies to keep you logged in. No tracking pixels, no ad networks. You can disable cookies anytime.',
            },
            {
              title: 'Questions?',
              emoji: '💬',
              footer: 'GrooveFund Support • support@groovefund.co.za | Scuti Group (Pty) Ltd • Reg No: 2024/043905/07',
            },
          ].map((section, idx) => (
            <div key={idx} style={{ background: 'white', padding: '28px', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', transition: 'all 0.3s ease', }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 117, 31, 0.1)'; e.currentTarget.style.borderColor = '#FF751F' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = '#E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '32px' }}>{section.emoji}</div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', margin: 0 }}>
                  {section.title}
                </h2>
              </div>
              {section.description && (
                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6', marginBottom: '16px' }}>
                  {section.description}
                </p>
              )}
              {section.items && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: section.footer ? '16px' : 0 }}>
                  {section.items.map((item, i) => (
                    <li key={i} style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6', marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px', }} >
                      <span style={{ color: '#FF751F', fontWeight: 700, marginTop: '2px', flexShrink: 0 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {section.footer && (
                <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0, fontStyle: 'italic' }}>
                  {section.footer}
                </p>
              )}
            </div>
          ))}
        </section>

        {/* CTA Section */}
        <section style={{ background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', padding: '48px', borderRadius: '20px', textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '12px' }}>Ready to Join the Movement?</h2>
          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '32px' }}>Groovers are already saving for unforgettable experiences.</p>
          <button onClick={() => router.push('/onboarding')} style={{ padding: '14px 40px', background: 'white', color: '#FF751F', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }} >
            Start Saving Now 🎵
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: '#1F2937', color: 'white', padding: '48px 20px 32px 20px', marginTop: '64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          {/* Column 1: About */}
          <div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>About</p>
            <p style={{ fontSize: '14px', color: '#E5E7EB', margin: '0 0 12px 0' }}>South Africa's first concert stokvel.</p>
            <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.6', margin: 0 }}>Save R500/month. Attend the best concerts in South Africa. Together.</p>
          </div>
          {/* Column 2: Quick Links */}
          <div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>Quick Links</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}><a href="/onboarding" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ How It Works</a></li>
              <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ Events</a></li>
              <li style={{ marginBottom: '12px' }}><a href="/" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ Home</a></li>
            </ul>
          </div>
          {/* Column 3: Resources */}
          <div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>Resources</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}><a href="/blog" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>📝 Blog & Insights</a></li>
              <li style={{ marginBottom: '12px' }}><a href="/help" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ Help & Support</a></li>
              <li style={{ marginBottom: '12px' }}><a href="/contact" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ Contact Us</a></li>
            </ul>
          </div>
          {/* Column 4: Terms & Transparency */}
          <div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>🛡️ Transparency</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}><a href="/terms" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>📋 Terms and Rules</a></li>
              <li style={{ marginBottom: '12px' }}><a href="/privacy" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>🔒 Privacy Policy</a></li>
              <li style={{ marginBottom: '12px' }}><a href="/transparency" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>📊 Transparency Report</a></li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #374151', paddingTop: '32px' }}>
          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0, textAlign: 'center' }}>© 2026 GrooveFund. All rights reserved. Made with 🧡 in South Africa.</p>
        </div>
      </footer>
    </div>
  )
}
