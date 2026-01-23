import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    setError('')
    setLoading(true)

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && email && password) {
      handleLogin()
    }
  }

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', background: '#FAFAFA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Image src="/images/logo.png" alt="GrooveFund" width={120} height={40} style={{ cursor: 'pointer', width: 'auto', height: '32px' }} onClick={() => router.push('/')} />
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>Don't have an account?</span>
            <button onClick={() => router.push('/signup')} style={{ padding: '10px 20px', border: 'none', borderRadius: 12, background: '#F3F4F6', color: '#1F2937', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#E5E7EB' }} onMouseLeave={(e) => { e.currentTarget.style.background = '#F3F4F6' }} >
              Sign up
            </button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ background: 'white', padding: '48px', borderRadius: '20px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)', maxWidth: '450px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1F2937', margin: '0 0 8px 0' }}>Welcome Back</h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>Log in to your GrooveFund account and check your progress.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin() }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: 'Poppins',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#FF751F'
                  e.currentTarget.style.outline = 'none'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 117, 31, 0.1), 0 4px 12px rgba(255, 117, 31, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  fontSize: 14,
                  fontFamily: 'Poppins',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#FF751F'
                  e.currentTarget.style.outline = 'none'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 117, 31, 0.1), 0 4px 12px rgba(255, 117, 31, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
              />
            </div>

            {error && (
              <div style={{ padding: 12, background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 12, color: '#DC2626', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: loading || !email || !password ? '#D1D5DB' : 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                fontFamily: 'Poppins',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(255, 117, 31, 0.2)',
              }}
              onMouseEnter={(e) => {
                if (!loading && email && password) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 117, 31, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 117, 31, 0.2)'
              }}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/forgot-password" style={{ color: '#FF751F', textDecoration: 'none', fontSize: 14, fontWeight: 600, transition: 'color 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }} onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}>
              Forgot your password?
            </Link>
          </div>
        </div>
      </main>

      <footer style={{ background: '#1F2937', color: 'white', padding: '32px 20px', marginTop: 'auto', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>Quick Links</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li><a href="/" style={{ color: '#E5E7EB', textDecoration: 'none', fontSize: 13 }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>Home</a></li>
                <li><a href="/signup" style={{ color: '#E5E7EB', textDecoration: 'none', fontSize: 13 }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>How It Works</a></li>
              </ul>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>Policies</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li><a href="/terms" style={{ color: '#E5E7EB', textDecoration: 'none', fontSize: 13 }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>Terms</a></li>
                <li><a href="/privacy" style={{ color: '#E5E7EB', textDecoration: 'none', fontSize: 13 }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>Privacy</a></li>
              </ul>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>Support</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li><a href="/contact" style={{ color: '#E5E7EB', textDecoration: 'none', fontSize: 13 }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>Contact</a></li>
                <li><a href="/transparency" style={{ color: '#E5E7EB', textDecoration: 'none', fontSize: 13 }} onMouseEnter={(e) => e.currentTarget.style.color = '#FF751F'} onMouseLeave={(e) => e.currentTarget.style.color = '#E5E7EB'}>Transparency</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #374151', paddingTop: '16px' }}>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>© 2026 GrooveFund. All rights reserved. Made with 🧡 in South Africa.</p>
        </div>
      </footer>
    </div>
  )
}