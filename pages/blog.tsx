// pages/blog.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

interface BlogArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  featured: boolean
  image_emoji: string
  read_time: string
  created_at: string
  updated_at: string
  published: boolean
}

export default function Blog() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('blog_articles')
        .select('*')
        .eq('published', true) // Only fetch published articles
        .order('created_at', { ascending: false })

      // Filter by category if selected
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading articles:', error)
        return
      }

      setArticles(data || [])
    } catch (err) {
      console.error('Failed to load articles:', err)
    } finally {
      setLoading(false)
    }
  }


  const categories = [
    { id: 'all', label: 'All Articles' },
    { id: 'events', label: 'Events' },
    { id: 'education', label: 'Learning' },
    { id: 'tips', label: 'Tips' },
    { id: 'community', label: 'Community' }
  ]

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(a => a.category === selectedCategory)
  
  const featuredArticle = filteredArticles.find(a => a.featured)
  const otherArticles = filteredArticles.filter(a => !a.featured)

  const Header = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
      <button
        onClick={() => router.push('/')}
        style={{
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 600,
          color: '#6B7280',
          cursor: 'pointer',
          fontFamily: 'Poppins',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#1F2937' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280' }}
      >
        ← Back
      </button>

      <div style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
        <img src="/images/logo.png" alt="GrooveFund" width={120} height={40} style={{ width: 'auto', height: '32px' }} />
      </div>

      <button onClick={() => router.push('/login')} style={{ padding: '10px 20px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 117, 31, 0.2)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
        Log in
      </button>
    </div>
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FAFAFA', fontFamily: 'Poppins, sans-serif', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
        <p style={{ fontSize: 16, color: '#6B7280', fontWeight: 400 }}>Loading blog articles...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FAFAFA', fontFamily: 'Poppins, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Header />
        </div>
      </div>

      {/* Hero Banner */}
      {/* Hero Banner with Background Image */}
        <section style={{
          background: 'linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url(/images/backgrounds/GrooveFund_Hero2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed', // Parallax effect
          padding: '120px 20px',
          textAlign: 'center',
          color: 'white',
          marginBottom: 60,
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
            
            <h1 style={{
              fontSize: 44,
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 700,
              marginBottom: 12,
              lineHeight: 1.2,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}>
              GrooveFund Blog & Insights
            </h1>
            
            <p style={{
              fontSize: 18,
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 400,
              maxWidth: 600,
              margin: '0 auto',
              textShadow: '0 1px 5px rgba(0, 0, 0, 0.5)',
            }}>
              Discover concert tips, music guides, and everything about the stokvel lifestyle
            </p>
          </div>
        </section>

      {/* Main Content */}
      <div style={{ padding: '0 20px', flex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Featured Article */}
          {featuredArticle && (
            <div style={{
              background: 'white',
              borderRadius: 20,
              overflow: 'hidden',
              border: '3px solid #FF751F',
              marginBottom: 60,
              boxShadow: '0 12px 32px rgba(255, 117, 31, 0.15)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 0 }}>
                <div style={{
                  background: 'linear-gradient(135deg, #FFF5ED 0%, #FFE8D6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 100,
                  minHeight: 280,
                }}>
                  {featuredArticle.image_emoji}
                </div>

                <div style={{ padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'white',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 16,
                    }}>
                      ⭐ Featured
                    </div>

                    <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1F2937', marginBottom: 12, lineHeight: 1.3 }}>
                      {featuredArticle.title}
                    </h2>
                    <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.6, marginBottom: 16, fontWeight: 400 }}>
                      {featuredArticle.excerpt}
                    </p>

                    <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#9CA3AF', fontWeight: 500 }}>
                      <span>{new Date(featuredArticle.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{featuredArticle.read_time}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/blog/${featuredArticle.slug}`)}
                    style={{
                      marginTop: 24,
                      padding: '12px 28px',
                      background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'Poppins',
                      transition: 'all 0.3s',
                      width: 'fit-content',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 117, 31, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    Read Article →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 48, overflowX: 'auto', paddingBottom: 12 }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 999,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Poppins',
                  transition: 'all 0.2s',
                  background: selectedCategory === cat.id ? 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)' : 'white',
                  color: selectedCategory === cat.id ? 'white' : '#1F2937',
                  borderStyle: selectedCategory === cat.id ? 'none' : 'solid',
                  borderWidth: selectedCategory === cat.id ? '0' : '2px',
                  borderColor: selectedCategory === cat.id ? 'transparent' : '#E5E7EB',
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== cat.id) {
                    e.currentTarget.style.borderColor = '#FF751F'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== cat.id) {
                    e.currentTarget.style.borderColor = '#E5E7EB'
                  }
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 80 }}>
            {otherArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => router.push(`/blog/${article.slug}`)}
                style={{
                  background: 'white',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(255, 117, 31, 0.12)'
                  e.currentTarget.style.borderColor = '#FF751F'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'
                  e.currentTarget.style.borderColor = '#E5E7EB'
                }}
              >
                <div style={{ background: 'linear-gradient(135deg, #FFF5ED 0%, #FFE8D6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                  {article.image_emoji}
                </div>

                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '4px 12px', background: '#FEF3E2', borderRadius: 999, fontSize: 11, fontWeight: 600, color: '#FF751F', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {article.category}
                      </span>
                      <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400 }}>
                        {new Date(article.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', marginBottom: 8, lineHeight: 1.4 }}>
                      {article.title}
                    </h3>
                    <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 0, fontWeight: 400 }}>
                      {article.excerpt}
                    </p>
                  </div>
                  <div style={{ fontSize: 12, color: '#FF751F', fontWeight: 600, marginTop: 16 }}>
                    {article.read_time} →
                  </div>
                </div>
              </div>
            ))}
          </div>

          {otherArticles.length === 0 && !featuredArticle && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>No articles found</h3>
              <p style={{ fontSize: 16, color: '#6B7280', fontWeight: 400 }}>Try selecting a different category</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', padding: '48px 20px', textAlign: 'center', marginTop: 60 }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 12 }}>Ready to Groove?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.9)', marginBottom: 24, fontWeight: 400 }}>Join thousands of Groovers saving for unforgettable concerts</p>
          <button
            onClick={() => router.push('/signup')}
            style={{ padding: '14px 32px', background: 'white', color: '#FF751F', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)' }}
          >
            Get Started Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#1F2937', color: 'white', padding: '60px 20px 40px', marginTop: 0 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ marginBottom: 24 }}>
              <img src="/images/logo.png" alt="GrooveFund" width={120} height={40} style={{ width: 'auto', height: '32px', marginBottom: 16 }} />
              <p style={{ fontSize: 14, color: '#D1D5DB', lineHeight: 1.6, fontWeight: 400, marginBottom: 0 }}>
                South Africa's first concert stokvel. Save and groove with thousands of music lovers.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 32, marginBottom: 32 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Quick Links</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <a href="/signup" style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'none', fontWeight: 400, transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#FF751F' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF' }}>
                    → How It Works
                  </a>
                  <a href="#" style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'none', fontWeight: 400, transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#FF751F' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF' }}>
                    → Events
                  </a>
                  <a href="/" style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'none', fontWeight: 400, transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#FF751F' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF' }}>
                    → Home
                  </a>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Resources</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <a href="/blog" style={{ fontSize: 14, color: '#FF751F', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 6 }} onMouseEnter={(e) => { e.currentTarget.style.color = '#E66A1A' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#FF751F' }}>
                    📝 Blog
                  </a>
                  <a href="/help" style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'none', fontWeight: 400, transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#FF751F' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF' }}>
                    → Help
                  </a>
                  <a href="/contact" style={{ fontSize: 14, color: '#9CA3AF', textDecoration: 'none', fontWeight: 400, transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#FF751F' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF' }}>
                    → Contact
                  </a>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.1)', marginBottom: 24 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 0, fontWeight: 400 }}>
              © 2026 GrooveFund. All rights reserved. Made with 🧡 in South Africa.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
              <a href="/terms" style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none', fontWeight: 400, transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#FF751F' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF' }}>
                Terms
              </a>
              <a href="/privacy" style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none', fontWeight: 400, transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#FF751F' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF' }}>
                Privacy
              </a>
              <a href="/cookies" style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none', fontWeight: 400, transition: 'color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#FF751F' }} onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF' }}>
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}