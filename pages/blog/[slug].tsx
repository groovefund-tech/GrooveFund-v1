'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

export default function BlogArticle() {
  const router = useRouter()
  const { slug } = router.query
  const [article, setArticle] = useState<BlogArticle | null>(null)
  const [loading, setLoading] = useState(true)

  // ✅ HOOK #1: useEffect
  useEffect(() => {
    if (slug) {
      loadArticle()
    }
  }, [slug])

  // ✅ FUNCTION: loadArticle
  const loadArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single()

      if (error) {
        console.error('Error loading article:', error)
        router.push('/blog')
        return
      }

      setArticle(data)
    } catch (err) {
      console.error('Failed to load article:', err)
      router.push('/blog')
    } finally {
      setLoading(false)
    }
  }

  // ✅ COMPONENT: Header
  const Header = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
      <button onClick={() => router.push('/blog')}>← Back to Blog</button>
      <img src="/images/logo.png" alt="GrooveFund" width={120} height={40} />
      <button onClick={() => router.push('/login')}>Log in</button>
    </div>
  )

  // ✅ CONDITIONAL RENDERS (BEFORE main JSX)
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading article...</div>
  }

  if (!article) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Article not found</div>
  }

  // ✅ MAIN RETURN (after all hooks, functions, and conditions)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Header />
        </div>
      </div>

      {/* Article Hero */}
      <div style={{ background: 'linear-gradient(135deg, #FFF5ED 0%, #FFE8D6 100%)', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}>{article.image_emoji}</div>
          <div style={{ display: 'inline-block', padding: '8px 16px', background: '#FEF3E2', borderRadius: 999, marginBottom: 24 }}>
            {article.category}
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
            {article.title}
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 16, color: '#6B7280' }}>
            <span>{new Date(article.created_at).toLocaleDateString('en-ZA')}</span>
            <span>•</span>
            <span>{article.read_time}</span>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div style={{ padding: '60px 20px', flex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, ...props }) => <a {...props} style={{ color: '#FF751F', textDecoration: 'underline', cursor: 'pointer' }} />,
              img: ({ node, ...props }) => <img {...props} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', margin: '16px 0' }} />,
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', padding: '48px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 12 }}>Ready to Groove?</h2>
        <p style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.9)' }}>Join thousands of Groovers saving for unforgettable concerts</p>
        <button onClick={() => router.push('/signup')} style={{ padding: '14px 32px', background: 'white', color: '#FF751F', border: 'none', borderRadius: 999 }}>
          Get Started Now
        </button>
      </div>
    </div>
  )
}