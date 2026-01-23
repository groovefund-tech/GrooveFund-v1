'use client';

import { useState, useEffect, ReactNode, ChangeEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'
import Image from 'next/image'
import ProfileMenu from '../../components/ProfileMenu'

interface Member {
  id: string
  email: string
  display_name: string
  phone?: string
  current_points: ReactNode
  created_at: string
}

interface Payment {
  id: string
  amount: number
  created_at: string
  status: string
  provider: string
  notes: string | null
  reference: string | null
}

interface PendingPayment {
  id: string
  user_id: string
  amount: number
  created_at: string
  status: string
  provider: string
  reference: string | null
  profile: {
    display_name: string
    email: string
  }
}

interface Event {
  id: string
  name: string
  start_at: string
  venue: string
  capacity: number
  status?: string
}

interface EventMember {
  user_id: string
  ticket_issued: boolean
  ticket_id: string | null
  active: boolean
  profiles: {
    display_name: string
    email: string
  }
  current_points?: number
  rank?: number
}

interface BlogImage {
  id: string
  url: string
  alt_text: string
  caption: string
}

interface BlogArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  read_time: string
  image_emoji: string
  featured_image: string
  featured_images: BlogImage[]
  featured: boolean
  published: boolean
  created_at: string
  // SEO Fields
  meta_description: string
  meta_title: string
  focus_keywords: string
  og_image: string
  og_title: string
  og_description: string
  canonical_url: string
  schema_markup: string
}

export default function AdminPayments() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'payments' | 'events' | 'audit' | 'blog'>('payments')
  const [adminName, setAdminName] = useState('Admin')

  // Payments state
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([])
  const [paymentForm, setPaymentForm] = useState({ amount: '', notes: '' })
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set())
  const [approvingBatch, setApprovingBatch] = useState(false)

  // Events state
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventMembers, setEventMembers] = useState<EventMember[]>([])
  const [issuingTicket, setIssuingTicket] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [attachingPdf, setAttachingPdf] = useState<string | null>(null)

  // Blog state - ENHANCED with SEO
  const [blogArticles, setBlogArticles] = useState<BlogArticle[]>([])
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [charCounts, setCharCounts] = useState({
    title: 0,
    metaTitle: 0,
    metaDescription: 0,
    excerpt: 0,
    ogTitle: 0,
    ogDescription: 0,
  })

  // Kill Switch
  const [automationPaused, setAutomationPaused] = useState(false)
  const router = useRouter()

  // ===== ADMIN CHECK =====
  useEffect(() => {
    checkAdmin()
  }, [])

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'payments') {
      loadMembers()
      loadPendingPayments()
    } else if (activeTab === 'events') {
      loadEvents()
    } else if (activeTab === 'audit') {
      loadAuditLogs()
    } else if (activeTab === 'blog') {
      loadBlogArticles()
    }
  }, [activeTab])

  // Filter members search
  useEffect(() => {
    const results = members.filter((m) =>
      `${m.display_name} ${m.email}`.toLowerCase().includes(search.toLowerCase())
    )
    setFilteredMembers(results)
  }, [search, members])

  const checkAdmin = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        setAdminName(profile.display_name || 'Admin')
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single()

      if (error || !data) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
    } catch (err) {
      console.error('checkAdmin crash:', err)
      router.push('/dashboard')
    }
  }

  useEffect(() => {
    if (selectedEvent && eventMembers.length > 0) {
      const fetchRanks = async () => {
        const userIds = eventMembers.map((m) => m.user_id)
        const { data } = await supabase
          .from('leaderboard_view')
          .select('user_id, rank')
          .in('user_id', userIds)
        if (data) {
          const rankMap = Object.fromEntries(data.map((r: any) => [r.user_id, r.rank]))
          const withRanks = eventMembers.map((m: any) => ({
            ...m,
            rank: rankMap[m.user_id],
          }))
          setEventMembers(withRanks)
        }
      }
      fetchRanks()
    }
  }, [selectedEvent, eventMembers.length])

  // ===== PAYMENTS FUNCTIONS =====
  const loadMembers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/get-members')
      const data = await res.json()
      if (Array.isArray(data)) {
        setMembers(data)
        setFilteredMembers(data)
      }
    } catch (err) {
      console.error('Failed to load Groove members:', err)
    }
    setLoading(false)
  }

  const loadPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(
          'id, user_id, amount, created_at, status, provider, reference, profiles!user_id(display_name, email)'
        )
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Failed to load pending payments:', error)
        return
      }

      const formattedData = (data || []).map((payment: any) => ({
        ...payment,
        profile: Array.isArray(payment.profiles) ? payment.profiles[0] : payment.profiles,
      }))
      setPendingPayments(formattedData)
    } catch (err) {
      console.error('loadPendingPayments crash:', err)
    }
  }

  const loadPaymentHistory = async (userId: string) => {
    const { data } = await supabase
      .from('payments')
      .select('id, amount, created_at, status, provider, notes, reference')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setPaymentHistory(data || [])
  }

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member)
    loadPaymentHistory(member.id)
    setPaymentForm({ amount: '', notes: '' })
  }

  const togglePaymentSelection = (paymentId: string) => {
    const newSelected = new Set(selectedPayments)
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId)
    } else {
      newSelected.add(paymentId)
    }
    setSelectedPayments(newSelected)
  }

  const handleBatchApprove = async () => {
    if (selectedPayments.size === 0) {
      alert('No payments selected')
      return
    }

    setApprovingBatch(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const approvePromises = Array.from(selectedPayments).map((paymentId) =>
        fetch('/api/admin/apply-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_id: paymentId,
            admin_user_id: user?.id,
          }),
        })
      )

      const results = await Promise.all(approvePromises)
      const allOk = results.every((r) => r.ok)

      if (allOk) {
        alert(`✅ Approved ${selectedPayments.size} payments`)
        setSelectedPayments(new Set())
        loadPendingPayments()
        loadMembers()
      } else {
        alert('❌ Some payments failed to approve')
      }
    } catch (err) {
      console.error('Batch approve error:', err)
      alert('Error approving payments')
    }
    setApprovingBatch(false)
  }

  const handleRejectPayment = async (paymentId: string) => {
    const confirm = window.confirm('Are you sure you want to reject this payment?')
    if (!confirm) return

    try {
      const { error } = await supabase.from('payments').update({ status: 'rejected' }).eq('id', paymentId)
      if (error) throw error
      alert('✅ Payment rejected')
      loadPendingPayments()
    } catch (err) {
      console.error('Reject error:', err)
      alert('Error rejecting payment')
    }
  }

  const handleApplyPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember || !paymentForm.amount) return

    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const res = await fetch('/api/admin/apply-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_user_id: selectedMember.id,
        amount: parseInt(paymentForm.amount),
        notes: paymentForm.notes,
        admin_user_id: user?.id,
      }),
    })

    if (res.ok) {
      alert('✅ Payment applied')
      setPaymentForm({ amount: '', notes: '' })
      loadMembers()
      loadPaymentHistory(selectedMember.id)
    } else {
      const error = await res.json()
      alert('❌ ' + error.error)
    }
    setLoading(false)
  }

  // ===== EVENTS FUNCTIONS =====
  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, start_at, venue, capacity, status')
        .eq('status', 'open')
        .order('start_at', { ascending: false })

      if (error) {
        console.error('Error loading events:', error)
        return
      }
      setEvents(data || [])
    } catch (err) {
      console.error('Failed to load events:', err)
    }
  }

  const loadEventMembers = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_members')
        .select('user_id, ticket_issued, ticket_id, active, profiles!user_id(display_name, email)')
        .eq('event_id', eventId)
        .eq('active', true)

      if (!error) {
        const formatted = (data || []).map((m: any) => ({
          ...m,
          profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
        }))
        setEventMembers(formatted as EventMember[])
      }
    } catch (err) {
      console.error('Failed to load event members:', err)
    }
  }

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event)
    loadEventMembers(event.id)
  }

  const handleIssueTicket = async (memberId: string) => {
    if (!selectedEvent) return
    setIssuingTicket(memberId)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('event_members')
        .update({ ticket_issued: true })
        .eq('event_id', selectedEvent.id)
        .eq('user_id', memberId)

      if (error) {
        alert(`❌ Failed to issue ticket: ${error.message}`)
        return
      }

      alert(`✅ Ticket issued! Now attach the PDF.`)
      loadEventMembers(selectedEvent.id)
    } catch (err) {
      console.error('Error issuing ticket:', err)
      alert('Error issuing ticket')
    }
    setIssuingTicket(null)
  }

  // ==== AUDIT LOG FUNCTIONS ====
  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!error) {
        setAuditLogs(data || [])
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    }
  }

  const handleAttachPdf = async (memberId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!selectedEvent) return

    setAttachingPdf(memberId)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        const res = await fetch('/api/admin/upload-ticket-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: selectedEvent.id,
            user_id: memberId,
            file_base64: base64,
            file_name: file.name,
          }),
        })

        const result = await res.json()
        if (!res.ok) {
          alert(`Error: ${result.error}`)
        } else {
          alert('✅ PDF uploaded and saved!')
          loadEventMembers(selectedEvent.id)
        }
        setAttachingPdf(null)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setAttachingPdf(null)
    }
  }

  // ===== BLOG FUNCTIONS - ENHANCED WITH SEO =====
  const loadBlogArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading blog articles:', error)
        return
      }
      setBlogArticles(data || [])
    } catch (err) {
      console.error('Failed to load blog articles:', err)
    }
  }

  const handleImageUpload = async (file: File, articleId?: string) => {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Image must be less than 5MB')
    return
  }

  setUploadingImage(true)
  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      
      // Compress using canvas directly
      const img = document.createElement('img') as HTMLImageElement
      img.onload = async () => {
        const canvas = document.createElement('canvas') as HTMLCanvasElement
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          alert('Failed to get canvas context')
          return
        }

        // Set max dimensions
        const maxWidth = 1200
        const maxHeight = 800
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8)

        console.log('Original size:', file.size, 'bytes')
        console.log('Compressed size:', Math.round(compressedBase64.length / 1024), 'KB')

        const res = await fetch('/api/admin/upload-blog-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: compressedBase64,
            file_name: file.name.replace(/\\.[^/.]+$/, '.jpg'),
          }),
        })

        const result = await res.json()
        if (res.ok && editingArticle) {
          setEditingArticle({
            ...editingArticle,
            featured_image: result.imageUrl,
          })
          alert('✅ Image uploaded!')
        } else {
          alert(`Error: ${result.error}`)
        }
        setUploadingImage(false)
      }
      img.src = base64
    }
    reader.readAsDataURL(file)
  } catch (err) {
    console.error('Upload error:', err)
    alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    setUploadingImage(false)
  }
}

const handleCreateArticle = async (articleData: BlogArticle) => {
  try {
    // Remove the id field before inserting
    const { id, ...dataToInsert } = articleData

    const { error } = await supabase
      .from('blog_articles')
      .insert([dataToInsert])

    if (error) {
      alert('Error creating article: ' + error.message)
      return
    }

    alert('✅ Article created!')
    loadBlogArticles()
    setEditingArticle(null)
  } catch (err) {
    console.error('Create error:', err)
    alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'))
  }
}

const handleSaveArticle = async (article: BlogArticle) => {
  try {
    const { error } = await supabase
      .from('blog_articles')
      .update({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        read_time: article.read_time,
        image_emoji: article.image_emoji,
        featured_image: article.featured_image,
        featured_images: article.featured_images,
        featured: article.featured,
        published: article.published,
        updated_at: new Date().toISOString(),
        // SEO Fields
        meta_description: article.meta_description,
        meta_title: article.meta_title,
        focus_keywords: article.focus_keywords,
        og_image: article.og_image,
        og_title: article.og_title,
        og_description: article.og_description,
        canonical_url: article.canonical_url,
        schema_markup: article.schema_markup,
      })
      .eq('id', article.id)

    if (error) {
      alert('Error saving article: ' + error.message)
      return
    }

    alert('✅ Article updated!')
    setEditingArticle(null)
    loadBlogArticles()
  } catch (err) {
    console.error('Save error:', err)
    alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'))
  }
}

const handleTogglePublish = async (articleId: string, currentlyPublished: boolean) => {
  try {
    const newStatus = !currentlyPublished
    
    const { error } = await supabase
      .from('blog_articles')
      .update({ published: newStatus })
      .eq('id', articleId)

    if (error) {
      console.error('Toggle publish error:', error)
      alert('Error: ' + error.message)
      return
    }

    alert(`✅ Article ${newStatus ? 'published' : 'unpublished'}!`)
    // Reload to get the latest data
    await loadBlogArticles()
  } catch (err) {
    console.error('Toggle publish error:', err)
    alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'))
  }
}

  const handleDeleteArticle = async (articleId: string) => {
    try {
      const { error } = await supabase.from('blog_articles').delete().eq('id', articleId)
      if (error) {
        alert('Error deleting article: ' + error.message)
        return
      }
      alert('✅ Article deleted!')
      loadBlogArticles()
    } catch (err) {
      alert('Error: ' + err)
    }
  }

  const generateMetaTitle = () => {
    if (!editingArticle) return ''
    // Recommended: 50-60 characters
    return editingArticle.title.substring(0, 60)
  }

  const generateMetaDescription = () => {
    if (!editingArticle) return ''
    // Recommended: 155-160 characters
    return editingArticle.excerpt.substring(0, 155)
  }

  const generateCanonicalUrl = () => {
    if (!editingArticle) return ''
    return `https://groovefund.co.za/blog/${editingArticle.slug}`
  }

  const generateSchemaMarkup = () => {
    if (!editingArticle) return ''

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: editingArticle.title,
      description: editingArticle.excerpt,
      image: editingArticle.featured_image,
      datePublished: editingArticle.created_at,
      author: {
        '@type': 'Organization',
        name: 'GrooveFund',
      },
      publisher: {
        '@type': 'Organization',
        name: 'GrooveFund',
        logo: {
          '@type': 'ImageObject',
          url: 'https://groovefund.co.za/logo.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': generateCanonicalUrl(),
      },
    }

    return JSON.stringify(schema, null, 2)
  }

  // ===== RENDER =====
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
                <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#1F2937', margin: '0 0 8px 0' }}>
                  ⚙️ Admin Dashboard
                </h1>
                <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
                  Manage payments, events, content, and community activity.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
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
                ← Back
              </button>
            </div>
          </section>

          {/* TAB NAVIGATION */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '32px',
              borderBottom: '2px solid #E5E7EB',
            }}
          >
            {(['payments', 'events', 'audit', 'blog'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '14px 24px',
                  background:
                    activeTab === tab ? 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)' : 'transparent',
                  color: activeTab === tab ? 'white' : '#1F2937',
                  border: 'none',
                  borderRadius: '10px 10px 0 0',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab) {
                    e.currentTarget.style.background = '#FFF5ED'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {tab === 'payments' && '💰 Payments'}
                {tab === 'events' && '🎵 Events & Tickets'}
                {tab === 'audit' && '📋 Audit Log'}
                {tab === 'blog' && '📝 Blog Articles'}
              </button>
            ))}
          </div>

          {/* ===== PAYMENTS TAB ===== */}
          {activeTab === 'payments' && (
            <>
              {/* Batch Approval Section */}
              {pendingPayments.length > 0 && (
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                      <span style={{ fontSize: '24px' }}>⚠️</span>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1F2937' }}>
                          {pendingPayments.length} Payment{pendingPayments.length !== 1 ? 's' : ''} Pending
                          Verification
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
                          Review and approve these payments to credit user balances
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        maxHeight: 400,
                        overflowY: 'auto',
                        background: '#F9FAFB',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        marginBottom: '16px',
                      }}
                    >
                      {pendingPayments.map((payment) => (
                        <div
                          key={payment.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '16px',
                            borderBottom: '1px solid #E5E7EB',
                            gap: '16px',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPayments.has(payment.id)}
                            onChange={() => togglePaymentSelection(payment.id)}
                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#1F2937',
                                marginBottom: '4px',
                              }}
                            >
                              <span style={{ color: '#FF751F', fontWeight: 800 }}>R{payment.amount}</span> —{' '}
                              {payment.profile?.display_name || 'Unknown'}
                            </p>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6B7280' }}>
                              {payment.profile?.email} • {new Date(payment.created_at).toLocaleDateString()}
                            </p>
                            {payment.reference && (
                              <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>
                                Ref: {payment.reference}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRejectPayment(payment.id)}
                            style={{
                              padding: '8px 16px',
                              background: '#FEE2E2',
                              border: '1px solid #FECACA',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#DC2626',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#FCA5A5'
                              e.currentTarget.style.color = 'white'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#FEE2E2'
                              e.currentTarget.style.color = '#DC2626'
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={handleBatchApprove}
                        disabled={selectedPayments.size === 0 || approvingBatch}
                        style={{
                          flex: 1,
                          padding: '12px 24px',
                          background:
                            selectedPayments.size === 0
                              ? '#D1D5DB'
                              : 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: selectedPayments.size === 0 ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedPayments.size > 0) {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        {approvingBatch
                          ? 'Approving...'
                          : `✅ Approve Selected (${selectedPayments.size})`}
                      </button>
                      <button
                        onClick={() => setSelectedPayments(new Set())}
                        style={{
                          padding: '12px 24px',
                          background: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
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
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Members & Payments Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: selectedMember ? '1fr 1fr' : '1fr',
                  gap: '32px',
                  minHeight: '60vh',
                }}
              >
                {/* Left: Member List */}
                <section>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#1F2937',
                      margin: '0 0 16px 0',
                      paddingBottom: '12px',
                      borderBottom: '2px solid rgba(255, 117, 31, 0.15)',
                    }}
                  >
                    🎯 Groove Members
                  </h3>
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      marginBottom: '16px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      maxHeight: '70vh',
                      overflowY: 'auto',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    {filteredMembers.length === 0 ? (
                      <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6B7280' }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>
                          {search ? 'No members found' : 'No Groove members'}
                        </p>
                      </div>
                    ) : (
                      

                        filteredMembers.map((member) => {
                        const points =
                          typeof member.current_points === 'number' ? member.current_points : 0
                        const qualifyingMembers = filteredMembers.filter((m) => {
                          const mPoints = typeof m.current_points === 'number' ? m.current_points : 0
                          return mPoints >= 500
                        })
                        const top40Percent = Math.floor(qualifyingMembers.length * 0.4)
                        const rankInQualifying =
                          qualifyingMembers.findIndex((m) => {
                            const mPoints =
                              typeof m.current_points === 'number' ? m.current_points : 0
                            return mPoints >= 500 && m.id === member.id
                          }) + 1
                        const isTop40 = points >= 500 && rankInQualifying <= top40Percent

                        return (
                          <div
                            key={member.id}
                            onClick={() => handleSelectMember(member)}
                            style={{
                              padding: '16px',
                              borderBottom: '1px solid #E5E7EB',
                              cursor: 'pointer',
                              background:
                                selectedMember?.id === member.id
                                  ? 'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)'
                                  : 'white',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (selectedMember?.id !== member.id)
                                e.currentTarget.style.background = '#F9FAFB'
                            }}
                            onMouseLeave={(e) => {
                              if (selectedMember?.id !== member.id) e.currentTarget.style.background = 'white'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#1F2937' }}>
                                {member.display_name}
                              </p>
                              {isTop40 && (
                                <span
                                  style={{
                                    backgroundColor: '#FF751F',
                                    color: '#FFFFFF',
                                    padding: '2px 8px',
                                    borderRadius: 12,
                                    fontSize: 10,
                                    fontWeight: 700,
                                  }}
                                >
                                  👑 TOP 40%
                                </span>
                              )}
                            </div>
                            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6B7280' }}>
                              {member.email}
                            </p>
                            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6B7280' }}>
                              📱 {member.phone || 'No phone on file'}
                            </p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#FF751F', fontWeight: 700 }}>
                              ⚡ {points} pts{' '}
                              {points >= 500 && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    color: '#6B7280',
                                    fontWeight: 500,
                                    marginLeft: '4px',
                                  }}
                                >
                                  (#{rankInQualifying} of {qualifyingMembers.length})
                                </span>
                              )}
                            </p>
                          </div>
                        )
                      })
                    )}
                  </div>
                </section>

                {/* Right: Member Details & Manual Payment */}
                {selectedMember && (
                  <section>
                    <div
                      style={{
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid #E5E7EB',
                        padding: '24px',
                        marginBottom: '24px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      <p
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: '12px',
                          color: '#6B7280',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Account
                      </p>
                      <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#1F2937' }}>
                        {selectedMember.display_name}
                      </h2>
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6B7280' }}>
                        {selectedMember.email}
                      </p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#FF751F' }}>
                        Balance: {selectedMember.current_points} points
                      </p>
                    </div>

                    <h3
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#1F2937',
                        margin: '0 0 16px 0',
                        paddingBottom: '12px',
                        borderBottom: '2px solid rgba(255, 117, 31, 0.15)',
                      }}
                    >
                      📜 Payment History
                    </h3>
                    {paymentHistory.length === 0 ? (
                      <p style={{ color: '#6B7280', fontSize: '13px' }}>No payments yet</p>
                    ) : (
                      <div
                        style={{
                          marginBottom: '32px',
                          maxHeight: 300,
                          overflowY: 'auto',
                          background: 'white',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB',
                        }}
                      >
                        {paymentHistory.map((payment) => (
                          <div key={payment.id} style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 700, color: '#1F2937' }}>+{payment.amount} pts</span>
                              <span style={{ color: '#6B7280' }}>
                                {new Date(payment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div style={{ color: '#6B7280', marginBottom: '4px' }}>
                              {payment.provider} •{' '}
                              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                                {payment.status}
                              </span>
                            </div>
                            {payment.notes && (
                              <div style={{ color: '#9CA3AF', fontStyle: 'italic' }}>"{payment.notes}"</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <h3
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#1F2937',
                        margin: '0 0 16px 0',
                        paddingBottom: '12px',
                        borderBottom: '2px solid rgba(255, 117, 31, 0.15)',
                      }}
                    >
                      ➕ Apply Manual Payment
                    </h3>
                    <form onSubmit={handleApplyPayment}>
                      <input
                        type="number"
                        placeholder="Amount (points)"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          marginBottom: '12px',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                        }}
                      />
                      <textarea
                        placeholder="Notes (e.g., 'January contribution')"
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          marginBottom: '16px',
                          fontSize: '14px',
                          minHeight: 80,
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '12px 24px',
                          background: loading ? '#D1D5DB' : 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          fontSize: '13px',
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
                        {loading ? 'Applying...' : '✅ Apply Payment'}
                      </button>
                    </form>
                  </section>
                )}
              </div>
            </>
          )}

          {/* ===== EVENTS TAB ===== */}
          {activeTab === 'events' && (
            <div style={{ display: 'grid', gridTemplateColumns: selectedEvent ? '1fr 1fr' : '1fr', gap: '32px' }}>
              {/* Left: Events List */}
              <section>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#1F2937',
                    margin: '0 0 16px 0',
                    paddingBottom: '12px',
                    borderBottom: '2px solid rgba(255, 117, 31, 0.15)',
                  }}
                >
                  🎵 Grooves
                </h3>

                <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => router.push('/admin/events')}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    🎬 Manage Grooves
                  </button>
                </div>

                <div
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  {events.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6B7280' }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>No Grooves available</p>
                    </div>
                  ) : (
                    events.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleSelectEvent(event)}
                        style={{
                          padding: '16px',
                          borderBottom: '1px solid #E5E7EB',
                          cursor: 'pointer',
                          background:
                            selectedEvent?.id === event.id
                              ? 'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)'
                              : 'white',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedEvent?.id !== event.id) {
                            e.currentTarget.style.background = '#F9FAFB'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedEvent?.id !== event.id) {
                            e.currentTarget.style.background = 'white'
                          }
                        }}
                      >
                        <p style={{ margin: '0 0 6px 0', fontWeight: 700, fontSize: '14px', color: '#1F2937' }}>
                          {event.name}
                        </p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6B7280' }}>
                          📅{' '}
                          {new Date(event.start_at).toLocaleDateString('en-ZA', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#FF751F', fontWeight: 600 }}>
                          🎫 Cap: {event.capacity}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Right: Event Members & Ticket Issuance */}
              {selectedEvent && (
                <section>
                  <div
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      padding: '24px',
                      marginBottom: '24px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '12px',
                        color: '#6B7280',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Event Details
                    </p>
                    <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 700, color: '#1F2937' }}>
                      {selectedEvent.name}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                          Venue
                        </p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#1F2937', fontWeight: 500 }}>
                          {selectedEvent.venue}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                          Date
                        </p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#1F2937', fontWeight: 500 }}>
                          {new Date(selectedEvent.start_at).toLocaleDateString('en-ZA')}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                          Capacity
                        </p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#1F2937', fontWeight: 500 }}>
                          {selectedEvent.capacity} spots
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                          Members Joined
                        </p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#FF751F', fontWeight: 700 }}>
                          {eventMembers.length}/{selectedEvent.capacity}
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#1F2937',
                      margin: '0 0 16px 0',
                      paddingBottom: '12px',
                      borderBottom: '2px solid rgba(255, 117, 31, 0.15)',
                    }}
                  >
                    🎫 Issue Tickets to Groovers
                  </h3>

                  {eventMembers.length === 0 ? (
                    <div
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '32px 24px',
                        textAlign: 'center',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                        No Groovers have joined this event yet
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid #E5E7EB',
                        maxHeight: '60vh',
                        overflowY: 'auto',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      {eventMembers.map((member: any) => (
                        <div
                          key={member.user_id}
                          style={{
                            padding: '16px',
                            borderBottom: '1px solid #E5E7EB',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '16px',
                          }}
                        >
                          <div>
                            <p style={{ margin: '0 0 6px 0', fontWeight: 700, fontSize: '14px', color: '#1F2937' }}>
                              {member.profiles?.display_name}
                            </p>
                            <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6B7280' }}>
                              {member.profiles?.email}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: '12px',
                                color: member.ticket_issued ? '#16A34A' : '#DC2626',
                                fontWeight: 600,
                              }}
                            >
                              {member.ticket_issued ? '✅ Ticket Issued' : '❌ Ticket Not Issued'}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            <button
                              onClick={() => handleIssueTicket(member.user_id)}
                              disabled={issuingTicket === member.user_id}
                              style={{
                                padding: '8px 16px',
                                background:
                                  issuingTicket === member.user_id
                                    ? '#D1D5DB'
                                    : 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: issuingTicket === member.user_id ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (issuingTicket !== member.user_id) {
                                  e.currentTarget.style.transform = 'translateY(-2px)'
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                              }}
                            >
                              {issuingTicket === member.user_id ? 'Issuing...' : '🎫 Issue'}
                            </button>
                            <label
                              style={{
                                padding: '8px 16px',
                                background: '#4F46E5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                              }}
                            >
                              📎 PDF
                              <input
                                type="file"
                                accept=".pdf"
                                style={{ display: 'none' }}
                                onChange={(e) => handleAttachPdf(member.user_id, e)}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {/* ===== AUDIT LOG TAB ===== */}
          {activeTab === 'audit' && (
            <section>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#1F2937',
                  margin: '0 0 24px 0',
                  paddingBottom: '12px',
                  borderBottom: '2px solid rgba(255, 117, 31, 0.15)',
                }}
              >
                📋 Audit Log
              </h3>

              {auditLogs.length === 0 ? (
                <div
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '48px 24px',
                    textAlign: 'center',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>No audit logs yet</p>
                </div>
              ) : (
                <div
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    overflow: 'hidden',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div style={{ 
                      background: 'white', 
                      borderRadius: '16px', 
                      border: '1px solid #E5E7EB', 
                      overflow: 'visible', // Make sure this is visible, not hidden
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)', 
                    }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '16px',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#6B7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Action
                        </th>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '16px',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#6B7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          User ID
                        </th>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '16px',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#6B7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr
                          key={log.id}
                          style={{ borderBottom: '1px solid #E5E7EB', transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#F9FAFB'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white'
                          }}
                        >
                          <td style={{ padding: '16px', fontSize: '13px', color: '#1F2937' }}>
                            {log.action}
                          </td>
                          <td style={{ padding: '16px', fontSize: '13px', color: '#6B7280', fontFamily: 'monospace' }}>
                            {log.user_id}
                          </td>
                          <td style={{ padding: '16px', fontSize: '13px', color: '#6B7280' }}>
                            {new Date(log.created_at).toLocaleDateString('en-ZA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ===== BLOG TAB - ENHANCED WITH SEO ===== */}
          {activeTab === 'blog' && (
            <section>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#1F2937',
                  margin: '0 0 24px 0',
                  paddingBottom: '12px',
                  borderBottom: '2px solid rgba(255, 117, 31, 0.15)',
                }}
              >
                📝 Manage Blog Articles
              </h3>

              {/* Create New Article Button */}
              <button
                onClick={() => {
                  setEditingArticle({
                    id: '',
                    title: '',
                    slug: '',
                    excerpt: '',
                    content: '',
                    category: 'events',
                    read_time: '5 min read',
                    image_emoji: '📖',
                    featured_image: '',
                    featured_images: [],
                    featured: false,
                    published: false,
                    created_at: new Date().toISOString(),
                    meta_description: '',
                    meta_title: '',
                    focus_keywords: '',
                    og_image: '',
                    og_title: '',
                    og_description: '',
                    canonical_url: '',
                    schema_markup: '',
                  })
                }}
                style={{
                  marginBottom: '32px',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                + New Article
              </button>

              {/* Articles List */}
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  overflow: 'visible',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#6B7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Title
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#6B7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Category
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#6B7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#6B7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          textAlign: 'center',
                          padding: '16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#6B7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogArticles.map((article) => (
                      <tr
                        key={article.id}
                        style={{ borderBottom: '1px solid #E5E7EB', transition: 'all 0.2s ease' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F9FAFB'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white'
                        }}
                      >
                        <td style={{ padding: '16px', fontSize: '14px', color: '#1F2937', fontWeight: 600 }}>
                          {article.title}
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', color: '#6B7280' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              background: '#FEF3E2',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#FF751F',
                              textTransform: 'capitalize',
                            }}
                          >
                            {article.category}
                          </span>
                        </td>
                        <td style={{ 
                            padding: '16px', 
                            textAlign: 'center',
                            minWidth: '200px', // Add minimum width
                            whiteSpace: 'nowrap', // Prevent wrapping
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              gap: '8px', 
                              justifyContent: 'center',
                              flexWrap: 'wrap', // Allow wrapping if needed
                            }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              background: article.published ? '#D1FAE5' : '#FEE2E2',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              color: article.published ? '#16A34A' : '#DC2626',
                            }}
                          >
                            {article.published ? '✅ Published' : '⏳ Draft'}
                          </span>
                          </div>
                        </td>
                     <td style={{ 
                          padding: '16px', 
                          textAlign: 'center',
                          minWidth: '200px',
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            gap: '8px', 
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                          }}>
                            <button 
                              onClick={() => setEditingArticle(article)}
                              style={{
                                padding: '6px 12px',
                                background: '#4F46E5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.9'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1'
                              }}
                            >
                              ✏️ Edit
                            </button>
                            
                            <button 
                              onClick={() => handleTogglePublish(article.id, article.published)}
                              style={{
                                padding: '6px 12px',
                                background: article.published ? '#EF4444' : '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.9'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1'
                              }}
                            >
                              {article.published ? '🔒 Unpub' : '🔓 Pub'}
                            </button>
                            
                            <button 
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this article?')) {
                                  handleDeleteArticle(article.id)
                                }
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#DC2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.9'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                       
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {blogArticles.length === 0 && (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6B7280' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      No blog articles yet. Create one to get started!
                    </p>
                  </div>
                )}
              </div>

              {/* Edit Article Modal */}
              {editingArticle && (
                <div
                  style={{
                 

                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px',
                  }}
                >
                  <div
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '32px',
                      maxWidth: '1200px',
                      width: '100%',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', margin: 0 }}>
                        {editingArticle.id ? 'Edit Article' : 'Create New Article'}
                      </h2>
                      <button
                        onClick={() => setEditingArticle(null)}
                        style={{
                          background: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (editingArticle.id) {
                          handleSaveArticle(editingArticle)
                        } else {
                          handleCreateArticle(editingArticle)
                        }
                      }}
                      style={{
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                      }}
                    >
                      {/* LEFT COLUMN - Basic Content */}
                      <div>
                        {/* Title */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '8px' }}>
                            Title *
                          </label>
                          <input
                            type="text"
                            value={editingArticle.title}
                            onChange={(e) => {
                              setEditingArticle({ ...editingArticle, title: e.target.value })
                              setCharCounts({ ...charCounts, title: e.target.value.length })
                            }}
                            required
                            placeholder="Article title"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #E5E7EB',
                              borderRadius: '10px',
                              fontSize: '14px',
                              boxSizing: 'border-box',
                              fontFamily: 'inherit',
                            }}
                          />
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                            {editingArticle.title.length}/80 characters
                          </p>
                        </div>

                        {/* Slug */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '8px' }}>
                            Slug *
                          </label>
                          <input
                            type="text"
                            value={editingArticle.slug}
                            onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value })}
                            required
                            placeholder="article-slug"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #E5E7EB',
                              borderRadius: '10px',
                              fontSize: '14px',
                              boxSizing: 'border-box',
                              fontFamily: 'inherit',
                            }}
                          />
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                            URL-friendly name (no spaces, use hyphens)
                          </p>
                        </div>

                        {/* Category */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '8px' }}>
                            Category *
                          </label>
                          <select
                            value={editingArticle.category}
                            onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                            required
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #E5E7EB',
                              borderRadius: '10px',
                              fontSize: '14px',
                              boxSizing: 'border-box',
                              fontFamily: 'inherit',
                            }}
                          >
                            <option value="events">Events</option>
                            <option value="education">Learning</option>
                            <option value="tips">Tips & Tricks</option>
                            <option value="community">Community</option>
                            <option value="news">News</option>
                          </select>
                        </div>

                        {/* Read Time */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '8px' }}>
                            Read Time *
                          </label>
                          <input
                            type="text"
                            value={editingArticle.read_time}
                            onChange={(e) => setEditingArticle({ ...editingArticle, read_time: e.target.value })}
                            required
                            placeholder="e.g., 5 min read"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #E5E7EB',
                              borderRadius: '10px',
                              fontSize: '14px',
                              boxSizing: 'border-box',
                              fontFamily: 'inherit',
                            }}
                          />
                        </div>

                        {/* Icon Emoji */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '8px' }}>
                            Icon Emoji
                          </label>
                          <input
                            type="text"
                            value={editingArticle.image_emoji}
                            onChange={(e) => setEditingArticle({ ...editingArticle, image_emoji: e.target.value })}
                            placeholder="🎸"
                            maxLength={2}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #E5E7EB',
                              borderRadius: '10px',
                              fontSize: '24px',
                              textAlign: 'center',
                              boxSizing: 'border-box',
                              fontFamily: 'inherit',
                            }}
                          />
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>Single emoji</p>
                        </div>

                        {/* Featured */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '8px' }}>
                            Article Settings
                          </label>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              padding: '12px 16px',
                              background: editingArticle.featured ? '#FEF3E2' : '#F9FAFB',
                              border: '1px solid #E5E7EB',
                              borderRadius: '10px',
                              fontWeight: 600,
                              color: editingArticle.featured ? '#FF751F' : '#6B7280',
                              transition: 'all 0.2s',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={editingArticle.featured}
                              onChange={(e) => setEditingArticle({ ...editingArticle, featured: e.target.checked })}
                              style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                            />
                            Show on homepage
                          </label>
                        </div>
                      </div>

                      {/* RIGHT COLUMN - Images & SEO Basics */}
                      <div>
                        {/* Featured Image */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '8px' }}>
                            Featured Image *
                          </label>
                          {editingArticle.featured_image && (
                            <div style={{ marginBottom: '12px', position: 'relative' }}>
                              <img
                                src={editingArticle.featured_image}
                                alt="Article preview"
                                style={{
                                  width: '100%',
                                  height: '200px',
                                  objectFit: 'cover',
                                  borderRadius: '10px',
                                  border: '1px solid #E5E7EB',
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setEditingArticle({ ...editingArticle, featured_image: '' })}
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  background: '#DC2626',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '4px 12px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                          <label
                            style={{
                              display: 'block',
                              padding: '20px',
                              border: '2px dashed #E5E7EB',
                              borderRadius: '10px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              background: '#F9FAFB',
                            }}
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.currentTarget.style.borderColor = '#FF751F'
                              e.currentTarget.style.background = '#FFF5ED'
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.style.borderColor = '#E5E7EB'
                              e.currentTarget.style.background = '#F9FAFB'
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              const file = e.dataTransfer.files[0]
                              if (file && file.type.startsWith('image/')) {
                                handleImageUpload(file)
                              } else {
                                alert('Please drop an image file')
                              }
                            }}
                          >
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📸</div>
                            <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#1F2937' }}>
                              Drag image here or click
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>
                              JPG, PNG, WebP (Max 5MB)
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file)
                              }}
                              style={{ display: 'none' }}
                            />
                          </label>
                          {uploadingImage && <p style={{ fontSize: '12px', color: '#FF751F', margin: '8px 0 0 0', fontWeight: 600 }}>⏳ Uploading...</p>}
                        </div>

                        {/* Excerpt */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '8px' }}>
                            Excerpt (Meta Preview) *
                          </label>
                          <textarea
                            value={editingArticle.excerpt}
                            onChange={(e) => {
                              setEditingArticle({ ...editingArticle, excerpt: e.target.value })
                              setCharCounts({ ...charCounts, excerpt: e.target.value.length })
                            }}
                            required
                            placeholder="Brief summary for search results..."
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '1px solid #E5E7EB',
                              borderRadius: '10px',
                              fontSize: '14px',
                              minHeight: '100px',
                              boxSizing: 'border-box',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                            }}
                          />
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                            {editingArticle.excerpt.length}/155 characters (aim for 155)
                          </p>
                        </div>
                      </div>

                      {/* FULL WIDTH - Content */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '8px' }}>
                          Content *
                        </label>
                        <textarea
                          value={editingArticle.content}
                          onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                          required
                          placeholder="Write your article content here. Separate paragraphs with blank lines."
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '1px solid #E5E7EB',
                            borderRadius: '10px',
                            fontSize: '14px',
                            minHeight: '300px',
                            boxSizing: 'border-box',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                          }}
                        />
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                          Separate paragraphs with blank lines. Use **text** for bold, *text* for italic.
                        </p>
                      </div>

                      {/* SEO SECTION - TABS */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '24px', marginTop: '24px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', margin: '0 0 16px 0' }}>
                            🔍 SEO Optimization
                          </h3>

                          {/* SEO Tab Navigation */}
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap' }}>
                            {['basic', 'meta', 'social', 'advanced'].map((tab) => (
                              <button
                                key={tab}
                                type="button"
                                onClick={() => {
                                  // Simple tab switching with state would go here
                                  // For now, showing all SEO fields
                                }}
                                style={{
                                  padding: '10px 16px',
                                  background: 'transparent',
                                  border: 'none',
                                  borderBottom: '2px solid transparent',
                                  color: '#6B7280',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {tab === 'basic' && '📝 Basic'}
                                {tab === 'meta' && '🏷️ Meta Tags'}
                                {tab === 'social' && '📱 Social'}
                                {tab === 'advanced' && '⚙️ Advanced'}
                              </button>
                            ))}
                          </div>

                          {/* META TITLE & DESCRIPTION */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                              <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '6px' }}>
                                Meta Title (for search results)
                              </label>
                              <input
                                type="text"
                                value={editingArticle.meta_title}
                                onChange={(e) => {
                                  setEditingArticle({ ...editingArticle, meta_title: e.target.value })
                                  setCharCounts({ ...charCounts, metaTitle: e.target.value.length })
                                }}
                                placeholder={generateMetaTitle()}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  boxSizing: 'border-box',
                                  fontFamily: 'inherit',
                                }}
                              />
                              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                                {editingArticle.meta_title.length}/60 chars (optimal: 50-60)
                              </p>
                            </div>

                            <div>
                              <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '6px' }}>
                                Meta Description (for search results)
                              </label>
                              <input
                                type="text"
                                value={editingArticle.meta_description}
                                onChange={(e) => {
                                  setEditingArticle({ ...editingArticle, meta_description: e.target.value })
                                  setCharCounts({ ...charCounts, metaDescription: e.target.value.length })
                                }}
                                placeholder={generateMetaDescription()}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  boxSizing: 'border-box',
                                  fontFamily: 'inherit',
                                }}
                              />
                              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                                {editingArticle.meta_description.length}/155 chars (optimal: 155-160)
                              </p>
                            </div>
                          </div>

                          {/* FOCUS KEYWORDS */}
                          <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '6px' }}>
                              Focus Keywords (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={editingArticle.focus_keywords}
                              onChange={(e) => setEditingArticle({ ...editingArticle, focus_keywords: e.target.value })}
                              placeholder="e.g., concert saving, stokvel, groovefund"
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '13px',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                              }}
                            />
                            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                              List the keywords you want to rank for (separated by commas)
                            </p>
                          </div>

                          {/* SOCIAL SHARING */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', background: '#F9FAFB', padding: '16px', borderRadius: '10px' }}>
                            <div>
                              <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '6px' }}>
                                OG Title (for social sharing)
                              </label>
                              <input
                                type="text"
                                value={editingArticle.og_title}
                                onChange={(e) => {
                                  setEditingArticle({ ...editingArticle, og_title: e.target.value })
                                  setCharCounts({ ...charCounts, ogTitle: e.target.value.length })
                                }}
                                placeholder={editingArticle.title}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  boxSizing: 'border-box',
                                  fontFamily: 'inherit',
                                }}
                              />
                              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                                {editingArticle.og_title.length}/65 chars
                              </p>
                            </div>

                            <div>
                              <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '6px' }}>
                                OG Image URL (for social sharing)
                              </label>
                              <input
                                type="url"
                                value={editingArticle.og_image}
                                onChange={(e) => setEditingArticle({ ...editingArticle, og_image: e.target.value })}
                                placeholder={editingArticle.featured_image}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  boxSizing: 'border-box',
                                  fontFamily: 'inherit',
                                }}
                              />
                              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                                Full image URL (1200x630px optimal)
                              </p>
                            </div>

                            <div style={{ gridColumn: '1 / -1' }}>
                              <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '6px' }}>
                                OG Description (for social sharing)
                              </label>
                              <textarea
                                value={editingArticle.og_description}
                                onChange={(e) => {
                                  setEditingArticle({ ...editingArticle, og_description: e.target.value })
                                  setCharCounts({ ...charCounts, ogDescription: e.target.value.length })
                                }}
                                placeholder={editingArticle.excerpt}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  minHeight: '80px',
                                  boxSizing: 'border-box',
                                  fontFamily: 'inherit',
                                  resize: 'vertical',
                                }}
                              />
                              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                                {editingArticle.og_description.length}/125 chars
                              </p>
                            </div>
                          </div>

                          {/* CANONICAL URL */}
                          <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '6px' }}>
                              Canonical URL
                            </label>
                            <input
                              type="url"
                              value={editingArticle.canonical_url}
                              onChange={(e) => setEditingArticle({ ...editingArticle, canonical_url: e.target.value })}
                              placeholder={generateCanonicalUrl()}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '13px',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                              }}
                            />
                            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                              Prevents duplicate content issues. Auto-generated from slug if left blank.
                            </p>
                          </div>

                          {/* SCHEMA MARKUP */}
                          <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', display: 'block', marginBottom: '6px' }}>
                              Schema Markup (JSON-LD)
                            </label>
                            <textarea
                              value={editingArticle.schema_markup}
                              onChange={(e) => setEditingArticle({ ...editingArticle, schema_markup: e.target.value })}
                              placeholder="Auto-generated below..."
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '12px',
                                minHeight: '150px',
                                boxSizing: 'border-box',
                                fontFamily: 'monospace',
                                resize: 'vertical',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setEditingArticle({ ...editingArticle, schema_markup: generateSchemaMarkup() })}
                              style={{
                                marginTop: '8px',
                                padding: '8px 16px',
                                background: '#4F46E5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                            >
                              🔄 Auto-Generate Schema
                            </button>
                            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '8px 0 0 0' }}>
                              Helps Google understand your article structure
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* FORM ACTIONS */}
                      <div
                        style={{
                          gridColumn: '1 / -1',
                          display: 'flex',
                          gap: '12px',
                          marginTop: '24px',
                          justifyContent: 'flex-end',
                          borderTop: '1px solid #E5E7EB',
                          paddingTop: '24px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setEditingArticle(null)}
                          style={{
                            padding: '12px 24px',
                            background: '#F3F4F6',
                            color: '#1F2937',
                            border: '1px solid #E5E7EB',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#E5E7EB'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#F3F4F6'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                        >
                          {editingArticle.id ? '💾 Save Changes' : '✨ Create Article'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* KILL SWITCH */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          padding: '14px 20px',
          background: automationPaused ? '#FEE2E2' : '#D1FAE5',
          borderRadius: '10px',
          border: `2px solid ${automationPaused ? '#DC2626' : '#16A34A'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 100,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: automationPaused ? '#DC2626' : '#16A34A',
          }}
        >
          {automationPaused ? '🛑 AUTOMATION PAUSED' : '✅ AUTOMATION ACTIVE'}
        </span>
        <button
          onClick={() => setAutomationPaused(!automationPaused)}
          style={{
            padding: '6px 16px',
            background: automationPaused ? '#16A34A' : '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {automationPaused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </>
  )
}

