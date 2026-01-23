// pages/contact.tsx
'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Image from 'next/image'

type InquiryType = 'event_suggestion' | 'question' | 'partnership'

interface FormData {
  name: string
  email: string
  phone: string
  inquiryType: InquiryType
  message: string
  concertName?: string
  location?: string
  concertDate?: string
  mainAct?: string
  companyName?: string
}

export default function Contact() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'question',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Please fill in all required fields')
      return false
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }
    if (!formData.message.trim()) {
      setError('Please enter a message')
      return false
    }
    if (formData.inquiryType === 'event_suggestion') {
      if (!formData.concertName?.trim() || !formData.location?.trim() || !formData.mainAct?.trim()) {
        setError('Please fill in all event suggestion fields')
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setLoading(true)

    try {
      const { error: dbError } = await supabase
        .from('contact_inquiries')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          inquiry_type: formData.inquiryType,
          message: formData.message,
          concert_name: formData.concertName || null,
          location: formData.location || null,
          concert_date: formData.concertDate || null,
          main_act: formData.mainAct || null,
          company_name: formData.companyName || null,
          created_at: new Date().toISOString(),
        }])

      if (dbError) {
        setError('Failed to submit. Please try again.')
        setLoading(false)
        return
      }

      setSubmitted(true)
      setLoading(false)

      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

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

  if (submitted) {
    return (
      <div style={{ fontFamily: 'Poppins, sans-serif', background: '#FAFAFA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '48px 20px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 600 }}>
            <div style={{ fontSize: 80, marginBottom: 24 }}>✅</div>
            <h1 style={{ fontSize: 48, fontWeight: 800, color: '#1F2937', marginBottom: 12, lineHeight: 1.1 }}>Thank You!</h1>
            <p style={{ fontSize: 18, color: '#6B7280', marginBottom: 32, lineHeight: 1.6 }}>We received your inquiry and will get back to you within 24 hours at support@groovefund.co.za</p>
            <div style={{ background: 'white', padding: 32, borderRadius: 16, border: '1px solid #E5E7EB', marginBottom: 32 }}>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>In the meantime, check out our <a href="/transparency" style={{ color: '#FF751F', fontWeight: 600, textDecoration: 'none' }}>Transparency Report</a> or <a href="/privacy" style={{ color: '#FF751F', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a> to learn more about GrooveFund.</p>
            </div>
            <button onClick={() => router.push('/')} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }} >
              Back to Home
            </button>
          </div>
        </main>
        <footer style={{ background: '#1F2937', color: 'white', padding: '48px 20px 32px 20px', marginTop: 'auto' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>About</p>
              <p style={{ fontSize: '14px', color: '#E5E7EB', margin: '0 0 12px 0' }}>South Africa's first concert stokvel.</p>
              <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.6', margin: 0 }}>Save R500/month. Attend the best concerts. Together.</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>Quick Links</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '12px' }}><a href="/onboarding" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ How It Works</a></li>
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

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', background: '#FAFAFA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 20px', width: '100%' }}>
        <section style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#1F2937', margin: '0 0 12px 0', lineHeight: 1.1 }}>💬 Get in Touch</h1>
          <p style={{ fontSize: '18px', color: '#6B7280', margin: '0 0 32px 0', maxWidth: '600px', marginBottom: '0 auto 32px' }}>We'd love to hear from you. Suggest an event, ask questions, or explore partnership opportunities!</p>
        </section>

        <section style={{ maxWidth: '700px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 32, padding: 24, background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
              <label style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', display: 'block', marginBottom: 16 }}>What can we help you with?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {[
                  { value: 'event_suggestion', label: '🎵 Event Suggestion', desc: 'Recommend a concert or festival' },
                  { value: 'question', label: '❓ Questions', desc: 'Ask us anything' },
                  { value: 'partnership', label: '🤝 Partnership Inquiry', desc: 'Work with us' }
                ].map((option) => (
                  <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: formData.inquiryType === option.value ? 'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)' : 'white', border: formData.inquiryType === option.value ? '2px solid #FF751F' : '1px solid #E5E7EB', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { if (formData.inquiryType !== option.value) { e.currentTarget.style.borderColor = '#FF751F'; e.currentTarget.style.background = '#FFF5ED' } }} onMouseLeave={(e) => { if (formData.inquiryType !== option.value) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white' } }} >
                    <input type="radio" name="inquiryType" value={option.value} checked={formData.inquiryType === option.value} onChange={handleInputChange} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{option.label}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 32, padding: 24, background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', margin: '0 0 16px 0' }}>Your Details</h3>
              <input type="text" name="name" placeholder="Full Name *" value={formData.name} onChange={handleInputChange} style={{ width: '100%', padding: '12px 14px', marginBottom: 12, border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontFamily: 'Poppins', boxSizing: 'border-box' }} />
              <input type="email" name="email" placeholder="Email Address *" value={formData.email} onChange={handleInputChange} style={{ width: '100%', padding: '12px 14px', marginBottom: 12, border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontFamily: 'Poppins', boxSizing: 'border-box' }} />
              <input type="tel" name="phone" placeholder="Phone Number *" value={formData.phone} onChange={handleInputChange} style={{ width: '100%', padding: '12px 14px', marginBottom: 0, border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontFamily: 'Poppins', boxSizing: 'border-box' }} />
            </div>

            {formData.inquiryType === 'event_suggestion' && (
              <div style={{ marginBottom: 32, padding: 24, background: 'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)', border: '2px solid #FFE4CC', borderRadius: 16, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', margin: '0 0 16px 0' }}>Event Details</h3>
                <input type="text" name="concertName" placeholder="Concert/Festival Name *" value={formData.concertName || ''} onChange={handleInputChange} style={{ width: '100%', padding: '12px 14px', marginBottom: 12, border: '1px solid #FFE4CC', borderRadius: 12, fontSize: 14, fontFamily: 'Poppins', boxSizing: 'border-box', background: 'white' }} />
                <input type="text" name="mainAct" placeholder="Main Artist/Act *" value={formData.mainAct || ''} onChange={handleInputChange} style={{ width: '100%', padding: '12px 14px', marginBottom: 12, border: '1px solid #FFE4CC', borderRadius: 12, fontSize: 14, fontFamily: 'Poppins', boxSizing: 'border-box', background: 'white' }} />
                <input type="text" name="location" placeholder="City/Location *" value={formData.location || ''} onChange={handleInputChange} style={{ width: '100%', padding: '12px 14px', marginBottom: 12, border: '1px solid #FFE4CC', borderRadius: 12, fontSize: 14, fontFamily: 'Poppins', boxSizing: 'border-box', background: 'white' }} />
                <input type="date" name="concertDate" value={formData.concertDate || ''} onChange={handleInputChange} style={{ width: '100%', padding: '12px 14px', marginBottom: 0, border: '1px solid #FFE4CC', borderRadius: 12, fontSize: 14, fontFamily: 'Poppins', boxSizing: 'border-box', background: 'white' }} />
              </div>
            )}

            {formData.inquiryType === 'partnership' && (
              <div style={{ marginBottom: 32, padding: 24, background: 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%)', border: '2px solid #DBEAFE', borderRadius: 16, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', margin: '0 0 16px 0' }}>Partnership Details</h3>
                <input type="text" name="companyName" placeholder="Company/Organization Name" value={formData.companyName || ''} onChange={handleInputChange} style={{ width: '100%', padding: '12px 14px', marginBottom: 0, border: '1px solid #DBEAFE', borderRadius: 12, fontSize: 14, fontFamily: 'Poppins', boxSizing: 'border-box', background: 'white' }} />
              </div>
            )}

            <div style={{ marginBottom: 24, padding: 24, background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: 8 }}>
                {formData.inquiryType === 'event_suggestion' ? 'Why should we feature this event?' : formData.inquiryType === 'partnership' ? 'Tell us about your partnership proposal' : 'Your Message'} *
              </label>
              <textarea name="message" placeholder="Tell us more..." value={formData.message} onChange={handleInputChange} style={{ width: '100%', padding: '12px 14px', minHeight: 120, border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 14, fontFamily: 'Poppins', boxSizing: 'border-box' }} />
            </div>

            {error && (
              <div style={{ marginBottom: 24, padding: 16, background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 12, color: '#DC2626', fontSize: 14 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px 24px', background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Poppins', transition: 'all 0.3s', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 12px rgba(255, 117, 31, 0.2)' }} onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 117, 31, 0.3)' } }} onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 117, 31, 0.2)' } }} >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </section>

        <section style={{ marginTop: 80, marginBottom: 64 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            {[
              { icon: '📧', title: 'Email', desc: 'support@groovefund.co.za', link: 'mailto:support@groovefund.co.za' },
              { icon: '✅', title: 'Whatsapp', desc: '081 344 3547 (Whatsapp only)' },
              { icon: '💬', title: 'Response Time', desc: 'We reply within 24 hours', link: null },
              { icon: '🔒', title: 'Privacy', desc: 'Your data is encrypted & safe', link: '/privacy' }
            ].map((info, i) => (
              <div key={i} style={{ background: 'white', padding: 28, borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', textAlign: 'center', transition: 'all 0.3s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 117, 31, 0.1)'; e.currentTarget.style.borderColor = '#FF751F' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = '#E5E7EB' }} >
                <div style={{ fontSize: 40, marginBottom: 12 }}>{info.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>{info.title}</h3>
                {info.link ? (
                  <a href={info.link} style={{ fontSize: 14, color: '#FF751F', fontWeight: 600, textDecoration: 'none' }}>
                    {info.desc}
                  </a>
                ) : (
                  <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>{info.desc}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer style={{ background: '#1F2937', color: 'white', padding: '48px 20px 32px 20px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>About</p>
            <p style={{ fontSize: '14px', color: '#E5E7EB', margin: '0 0 12px 0' }}>South Africa's first concert stokvel.</p>
            <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.6', margin: 0 }}>Save R500/month. Attend the best concerts. Together.</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>Quick Links</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}><a href="/onboarding" style={{ color: '#E5E7EB', textDecoration: 'none', transition: 'color 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>→ How It Works</a></li>
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