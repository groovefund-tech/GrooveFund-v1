// pages/terms.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'

function TermsAccordion({ title, emoji, description, details, items }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div onClick={() => setIsOpen(!isOpen)} style={{ background: isOpen ? 'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)' : 'white', border: isOpen ? '2px solid #FF751F' : '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: isOpen ? '0 8px 24px rgba(255, 117, 31, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.05)', }} onMouseEnter={(e) => { if (!isOpen) { e.currentTarget.style.borderColor = '#FF751F'; e.currentTarget.style.background = '#FFF5ED'; } }} onMouseLeave={(e) => { if (!isOpen) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white'; } }} >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', }} >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <span style={{ fontSize: '24px' }}>{emoji}</span>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', margin: 0, }} > {title} </h3>
        </div>
        <span style={{ fontSize: '20px', transition: 'transform 0.3s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, }} > ▼ </span>
      </div>
      {isOpen && ( <div style={{ marginTop: '16px', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
        {description && ( <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 16px 0', lineHeight: '1.6', }} > {description} </p> )}
        {details && ( <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
          {details.map((detail, i) => ( <li key={i} style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px', }} >
            <span style={{ color: '#FF751F', fontWeight: 700, marginTop: '2px', flexShrink: 0 }}>✓</span>
            {detail}
          </li> ))}
        </ul> )}
        {items && ( <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((item, i) => ( <li key={i} style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6', marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px', }} >
            <span style={{ color: '#FF751F', fontWeight: 700, marginTop: '2px', flexShrink: 0 }}>✓</span>
            {item}
          </li> ))}
        </ul> )}
      </div> )}
    </div>
  )
}

export default function Terms() {
  const router = useRouter()

  const sections = [
    { title: 'Acceptance of Terms', emoji: '📋', description: 'By creating an account and using GrooveFund, you agree to these Terms of Service and understand that GrooveFund operates as a traditional stokvel (community savings club) under South African law.' },
    { title: 'What is GrooveFund?', emoji: '🎵', description: 'GrooveFund is a concert stokvel—a community-based savings model where members contribute monthly to a collective pool used to purchase event tickets. This is NOT an investment scheme, gambling, or financial trading platform. It\'s a traditional South African savings club modernized for concert access.', details: [ 'Members contribute R500+/month', 'Pool is used ONLY for concert & festival tickets', 'Top 40% (500+ points) get priority ticket access', 'Operated as traditional stokvel under common law', ] },
    { title: 'Membership Requirements', emoji: '👤', items: [ 'You must be 18 years or older', 'Valid South African ID/Passport required', 'Valid South African bank account for EFT', 'You must provide accurate personal information', 'False information = automatic termination', 'One account per person (verified by ID)', ] },
    { title: 'Monthly Contributions', emoji: '💰', items: [ 'Minimum: R500/month (or your chosen amount)', 'Payments via EFT direct debit or YOCO', 'Processed on the same date each month', 'Failed payments = suspension after 40 days', 'You can increase your amount anytime (next cycle)', 'You can increase within 30 days', '12% admin fee deducted from pool for operations', 'Remaining 88% goes to ticket purchases', 'Contributions are NON-REFUNDABLE once processed', ] },
    { title: 'Points System & Winning Tickets', emoji: '🎫', items: [ 'R500 contribution = 500 points instantly', 'Points appear on leaderboard same day', 'Points roll over monthly (no expiration)', 'Top 40% members (500+ points) get priority access', 'Tickets cost 495 points per slot', '1 slot = gets you R700-R1000 event tickets | 2 slots = gets you R1200-R1500 event tickets | 3 slots = gets you R1800-R2000 event tickets', 'Allocation: Random selection within top 40%', 'You cannot gift tickets to other members', 'Ticket reselling = instant permanent ban', 'Non-winners\' points roll to next period (no loss)', ] },
    { title: 'Streaks & Inactive Penalties', emoji: '🔥', items: [ 'Making monthly payments builds your streak', 'Streaks unlock member rewards and exclusives', '40+ days without contribution = penalty starts', 'Inactive penalty: -15 points per day after 40 days', 'One new R500 payment resets the penalty counter', 'You can pause (not cancel) for up to 60 days', ] },
    { title: 'How the 12% Admin Fee is Used', emoji: '💸', items: [ '40% → Payment processing (EFT, YOCO, security)', '25% → Customer support & member services', '20% → Event partnerships & venue relationships', '15% → Platform security, POPIA compliance, servers', 'Full breakdown available on Transparency page', 'Fee is disclosed upfront (not hidden)', ] },
    { title: 'Events & Tickets', emoji: '🎪', items: [ 'Tickets are real—to actual concerts and festivals', 'GrooveFund partners with verified venues', 'Tickets are members-only (cannot gift to non-members)', 'Ticket delivery: Digital (email) or physical (mail)', 'GrooveFund can modify event details with notice', 'When events cancel festivals and concerts, we will only refund points to members who recieved tickets once the event organiser has completely refunded GrooveFund.', 'If YOU miss an event, refund is at venue discretion', 'Reselling tickets = permanent ban', 'No scalping or unauthorized ticket transfer', ] },
    { title: 'Community Conduct & Safety', emoji: '🤝', items: [ 'Respect all members regardless of race, gender, orientation', 'Harassment, racism, or sexism = instant ban', 'No explicit, vulgar, or spam content', 'No impersonation or false identity', 'No hacking, phishing, or system abuse', 'No bots or automated access', 'GrooveFund moderates conversations and reports', 'Report violations to support@groovefund.co.za', ] },
    { title: 'Data Privacy & Security', emoji: '🔒', items: [ 'All data encrypted and POPIA-compliant', 'Payment data processed by certified providers (YOCO)', 'ID numbers used ONLY for verification & KYC', 'We do NOT sell your data to third parties', 'You can request data deletion anytime', 'Deleted data: 30 days grace, then permanently removed', 'Bank details stored securely, never shared', 'See Privacy Policy for full details', ] },
    { title: 'Account Management', emoji: '⚙️', items: [ 'You can update your profile anytime', 'You can pause contributions (up to 60 days)', 'You can increase/decrease contribution amount', 'You can delete your account anytime', 'Deleted = no future access, rewards forfeited', 'You can reactivate within 30 days (no data loss)', 'After 30 days: data permanently deleted', ] },
    { title: 'Payment Processing & Authorization', emoji: '💳', items: [ 'Payments processed by YOCO (certified provider)', 'By joining, you authorize monthly EFT deductions', 'You can cancel anytime (takes 1 billing cycle)', 'Failed payment after 40 days = account suspension', 'We do NOT store credit card details', 'All transactions are encrypted & secure', 'Receipt provided for every payment', ] },
    { title: 'Limitation of Liability', emoji: '⚖️', items: [ 'GrooveFund is provided "as-is"', 'No guarantee of 100% uptime', 'Not liable for internet/technical issues on your end', 'Not liable for missed events due to your actions', 'Not liable for data loss (we maintain backups)', 'Not liable for third-party payment processor errors', 'In case of disputes: arbitration via South African courts', ] },
    { title: 'Intellectual Property', emoji: '©️', description: 'All GrooveFund logos, designs, content, and platform code are owned by GrooveFund/Scuti Group. Your profile content (photos, messages) remains yours, but you grant GrooveFund a license to display it on the platform.' },
    { title: 'Changes to These Terms', emoji: '📝', items: [ 'We can update terms anytime', 'Major changes: we\'ll email you 30 days notice', 'Continued use = acceptance of new terms', 'Old terms archived on our website', ] },
    { title: 'Termination & Account Suspension', emoji: '🚫', items: [ 'You can delete your account anytime', 'We can suspend for violations (24hr notice)', 'We can ban for serious violations (instant)', 'Reasons for ban: harassment, fraud, ticket scalping, illegal activity', 'Banned members: forfeited points & pending rewards', 'Appeals: email support@groovefund.co.za within 14 days', ] },
    { title: 'Why We\'re Reliable', emoji: '✅', details: [ '✓ Real tickets to real events (see Transparency page)', '✓ Top 40% ALWAYS get tickets (no favoritism)', '✓ Pool size visible on dashboard (updated hourly)', '✓ All fees disclosed upfront (12%)', '✓ POPIA-compliant & secure payments', '✓ Operated under South African common law (stokvel)', '✓ Full audit trails available', '✓ Transparent fee breakdown', ] },
    { title: 'Dispute Resolution', emoji: '⚖️', items: [ 'Contact us first: support@groovefund.co.za', 'We\'ll respond within 7 business days', 'Escalate to: support@groovefund.co.za', 'South African law applies', 'Jurisdiction: South African courts', ] },
    { title: 'Contact & Legal Info', emoji: '📧', description: 'GrooveFund is operated by Scuti Group (Pty) Ltd | Registration No: 2024/043905/07 | Email: legal@groovefund.co.za | Hours: 10am-3pm SAST Mon-Fri' },
  ]

  const Header = () => (
    <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 40 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Image src="/images/logo.png" alt="GrooveFund" width={120} height={40} style={{ cursor: 'pointer', width: 'auto', height: '32px' }} onClick={() => router.push('/')} />
        <button onClick={() => router.push('/login')} style={{ padding: '10px 20px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 117, 31, 0.2)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }} >
          Log in
        </button>
      </div>
    </header>
  )

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', background: '#FAFAFA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 20px', width: '100%', flex: 1 }}>
        <section style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#1F2937', margin: '0 0 12px 0', lineHeight: 1.1 }}>
            📋 Terms & Rules
          </h1>
          <p style={{ fontSize: '18px', color: '#6B7280', margin: '0 0 32px 0', maxWidth: '600px', margin: '0 auto 32px' }}>
            Everything you need to know about how GrooveFund works. These terms are clear, fair, and designed to protect our community.
          </p>
        </section>

        <section style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gap: '12px', marginBottom: '64px' }}>
          {sections.map((section, idx) => (
            <TermsAccordion key={idx} title={section.title} emoji={section.emoji} description={section.description} details={section.details} items={section.items} />
          ))}
        </section>

        <section style={{ background: 'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)', border: '2px solid #FF751F', borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', marginBottom: '12px' }}>Have Questions?</h2>
          <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '24px', lineHeight: 1.6 }}>
            We're here to help. Reach out to our support team and we'll answer any questions about these terms.
          </p>
          <button onClick={() => router.push('/contact')} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 117, 31, 0.3)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }} >
            Get in Touch
          </button>
        </section>
      </main>

      <footer style={{ background: '#1F2937', color: 'white', padding: '48px 20px 32px 20px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>About</p>
            <p style={{ fontSize: '14px', color: '#E5E7EB', margin: '0 0 12px 0' }}>South Africa's first concert stokvel.</p>
            <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.6', margin: 0 }}>Save R500/month. Attend the best concerts in South Africa. Together.</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>Quick Links</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}><a href="/signup" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ How It Works</a></li>
              <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ Events</a></li>
              <li style={{ marginBottom: '12px' }}><a href="/" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ Home</a></li>
            </ul>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>Resources</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}><a href="/blog" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>📝 Blog</a></li>
              <li style={{ marginBottom: '12px' }}><a href="/help" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ Help</a></li>
              <li style={{ marginBottom: '12px' }}><a href="/contact" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ Contact</a></li>
            </ul>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>🛡️ Transparency</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}><a href="/terms" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>📋 Terms</a></li>
              <li style={{ marginBottom: '12px' }}><a href="/privacy" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>🔒 Privacy</a></li>
              <li style={{ marginBottom: '12px' }}><a href="/transparency" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>📊 Transparency</a></li>
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