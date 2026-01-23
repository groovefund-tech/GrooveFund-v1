import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      style={{
        background: isOpen ? 'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)' : 'white',
        border: isOpen ? '2px solid #FF751F' : '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isOpen ? '0 8px 24px rgba(255, 117, 31, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
        marginBottom: '12px',
      }}
      onMouseEnter={(e) => {
        if (!isOpen) {
          e.currentTarget.style.borderColor = '#FF751F';
          e.currentTarget.style.background = '#FFF5ED';
        }
      }}
      onMouseLeave={(e) => {
        if (!isOpen) {
          e.currentTarget.style.borderColor = '#E5E7EB';
          e.currentTarget.style.background = 'white';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', margin: 0 }}>
          {question}
        </h3>
        <span
          style={{
            fontSize: '20px',
            transition: 'transform 0.3s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </div>
      {isOpen && (
        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
            margin: '16px 0 0 0',
            lineHeight: '1.6',
          }}
        >
          {answer}
        </p>
      )}
    </div>
  );
}

export default function HowItWorks() {
  const router = useRouter();

  return (
    <>
      <Head>
        {/* Primary Meta Tags - SEO */}
        <title>How GrooveFund Works | Concert Stokvel Explained - Step by Step Guide</title>
        <meta
          name="description"
          content="Learn how GrooveFund works in 4 simple steps. Save R500/month, earn points, get priority access to concert tickets. Transparent stokvel model explained for South Africa."
        />
        <meta
          name="keywords"
          content="how stokvel works, concert saving, group savings South Africa, how to save for concerts, GrooveFund process"
        />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content="How GrooveFund Works | Complete Guide to Concert Stokvel" />
        <meta
          property="og:description"
          content="Discover how South Africa's first concert stokvel works. 4 simple steps to start saving R500/month and get priority access to festival tickets."
        />
        <meta property="og:url" content="https://groovefund.co.za/how-it-works" />
        <meta property="og:image" content="https://groovefund.co.za/og-image.png" />

        {/* Canonical */}
        <link rel="canonical" href="https://groovefund.co.za/how-it-works" />

        {/* JSON-LD Schema - Article + FAQPage */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'How GrooveFund Works: Complete Guide to South Africa\'s Concert Stokvel',
            description:
              'Learn the 4-step process of how GrooveFund works. Save R500/month, build points, and get priority access to concert tickets.',
            image: 'https://groovefund.co.za/og-image.png',
            author: {
              '@type': 'Organization',
              name: 'GrooveFund',
            },
            publisher: {
              '@type': 'Organization',
              name: 'GrooveFund',
              logo: {
                '@type': 'ImageObject',
                url: 'https://groovefund.co.za/images/logo.png',
              },
            },
            datePublished: '2024-01-15',
            dateModified: new Date().toISOString().split('T')[0],
          })}
        </script>

        {/* FAQPage Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How much do I contribute monthly?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'You contribute R500/month minimum. No hidden fees. You can choose R500, R1000, or R1500 per month based on your budget.',
                },
              },
              {
                '@type': 'Question',
                name: 'How do I earn points and win tickets?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Every R500 you contribute = 500 points instantly. Top 40% of members (with 500+ points) get first access to concert tickets. More points = better priority and better ticket allocations.',
                },
              },
              {
                '@type': 'Question',
                name: 'What happens if I don\'t receive tickets to a concert?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Your points roll over to the next month—you don\'t lose them. You can win in future months. The more you save consistently, the higher your chances.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is the 12% admin fee mandatory?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. The 12% fee covers operations: payment processing, customer support, event partnerships, and platform maintenance. It\'s fully transparent and disclosed upfront.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is GrooveFund legal in South Africa?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. GrooveFund operates as a stokvel—a traditional South African savings club. We\'re fully transparent about fees and rules. Everything is auditable and compliant with local regulations.',
                },
              },
            ],
          })}
        </script>
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FAFAFA', fontFamily: 'Poppins, sans-serif' }}>
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .step-card {
            animation: fadeInUp 0.6s ease-out forwards;
            opacity: 0;
          }

          .step-card:nth-child(1) { animation-delay: 0.2s; }
          .step-card:nth-child(2) { animation-delay: 0.3s; }
          .step-card:nth-child(3) { animation-delay: 0.4s; }
          .step-card:nth-child(4) { animation-delay: 0.5s; }
        `}</style>

        {/* HEADER */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 20px',
            borderBottom: '1px solid #E5E7EB',
            background: 'white',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 20 }}>
            <img
              src="/images/logo.png"
              alt="GrooveFund - Concert Stokvel"
              width={120}
              height={40}
              style={{ cursor: 'pointer', width: 'auto', height: '32px' }}
              onClick={() => router.push('/')}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => router.push('/login')}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #FF751F',
                  borderRadius: 12,
                  background: 'white',
                  color: '#FF751F',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Poppins',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FFF5ED';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                Log in
              </button>
              <button
                onClick={() => router.push('/signup')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Poppins',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 117, 31, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1 }}>
          {/* HERO SECTION */}
          <section style={{ background: 'linear-gradient(to bottom right, #FFF5ED, #FFE8D6)', padding: '60px 20px' }}>
            <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎵</div>
              <h1
                style={{
                  fontSize: 44,
                  fontWeight: 700,
                  color: '#1F2937',
                  margin: '0 0 16px 0',
                  lineHeight: 1.1,
                }}
              >
                How GrooveFund Works
              </h1>
              <p
                style={{
                  fontSize: 18,
                  color: '#6B7280',
                  margin: '0',
                  lineHeight: 1.6,
                }}
              >
                Save R500/month. Build points. Get first dibs to the hottest concerts and festivals in South Africa. No hidden fees. 100% transparent.
              </p>
            </div>
          </section>

          {/* THE 4 STEPS - DETAILED */}
          <section style={{ padding: '80px 20px', background: 'white' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <div style={{ marginBottom: 60, textAlign: 'center' }}>
                <h2 style={{ fontSize: 32, fontWeight: 700, color: '#1F2937', marginBottom: 12 }}>
                  4 Simple Steps to Start Grooving
                </h2>
                <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>
                  The GrooveFund process is straightforward. Here's exactly how it works.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
                {[
                  {
                    step: '01',
                    icon: '📝',
                    title: 'Sign Up & Set Your Goal',
                    shortDesc: 'Create your profile in 2 minutes',
                    fullDesc:
                      'Start by signing up with your name, email, and phone number. Complete your profile (takes 2 minutes) and choose your monthly savings amount. You can contribute R500, R1000, or R1500 per month—pick what works for your budget. No signup fees. No hidden charges. Just your chosen amount and a transparent 12% operational fee (to power our servers).',
                    details: [
                      'Choose your contribution: R500, R1000, or R1500/month',
                      'Zero signup fees or hidden charges',
                      'Your profile is secure and encrypted',
                      'Start immediately after signup',
                    ],
                  },
                  {
                    step: '02',
                    icon: '💰',
                    title: 'Start Saving Together',
                    shortDesc: 'Your contributions join the community pool',
                    fullDesc:
                      'Your monthly contribution goes into a secure, community pool managed transparently. Every Rand you contribute is instantly converted into points (R500 = 500 points). Your points are visible on your dashboard in real-time. The pool is auditable—you can see exactly how much has been collected, where it\'s going, and what concerts have been booked. Payments are processed via EFT or YOCO, making it easy and convenient.',
                    details: [
                      'R500 contribution = 500 points instantly',
                      'Multiple payment methods: EFT & YOCO',
                      'Real-time dashboard showing your points',
                      'Transparent pool tracking and audits',
                      '12% operational fee covers: payments, support, partnerships, servers, platform',
                    ],
                  },
                  {
                    step: '03',
                    icon: '🎟️',
                    title: 'Get Priority Access',
                    shortDesc: 'Top savers access the best tickets first',
                    fullDesc:
                      'Members with 500+ points qualify for the top 40% tier and get first priority access to premium concert and festival tickets. Your points rank you on the leaderboard. The higher your rank, the better your access to exclusive events. When tickets become available, top members are notified first and get to claim their preferred slots. If you don\'t win a concert in a month, your points roll over—you never lose them. Consistency is rewarded.',
                    details: [
                      'Need 500+ points to qualify for top tier',
                      'More points = better ticket priority',
                      'Points visible on leaderboard',
                      'Notifications sent when tickets available',
                      'Points roll over—never expire',
                      '1 slot = R700-R1000 events | 2 slots = R1200+ events',
                    ],
                  },
                  {
                    step: '04',
                    icon: '🎵',
                    title: 'Groove Together',
                    shortDesc: 'Attend unforgettable concerts with fellow Groovers',
                    fullDesc:
                      'When you get tickets, you get real tickets to a real event. Connect with hundreds other Groovers attending the same concert. Build friendships. Share the experience. Celebrate together. That\'s what GrooveFund is about—not just saving money, but creating a community of people passionate about live music and memorable experiences. Every concert is an opportunity to Groove Together.',
                    details: [
                      'Receive actual tickets to real events',
                      'Connect with other Groovers at your event',
                      'VIP GrooveFund member area at events',
                      'Exclusive discounts on merchandise',
                      'Community chat for event planning',
                      'Earn bonus points for event attendance',
                    ],
                  },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className="step-card"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '100px 1fr',
                      gap: 24,
                      alignItems: 'flex-start',
                      background: 'linear-gradient(135deg, #F9FAFB 0%, #FFF5ED 100%)',
                      padding: 32,
                      borderRadius: 16,
                      border: '1px solid #E5E7EB',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 117, 31, 0.12)';
                      e.currentTarget.style.borderColor = '#FF751F';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    {/* Left: Icon */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: 20,
                          background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 48,
                          boxShadow: '0 8px 20px rgba(255, 117, 31, 0.25)',
                        }}
                      >
                        {step.icon}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#FF751F', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {step.step}
                      </div>
                    </div>

                    {/* Right: Content */}
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1F2937', margin: '0 0 8px 0' }}>
                        {step.title}
                      </h3>
                      <p style={{ fontSize: 13, color: '#FF751F', fontWeight: 600, margin: '0 0 12px 0', textTransform: 'uppercase' }}>
                        {step.shortDesc}
                      </p>
                      <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                        {step.fullDesc}
                      </p>

                      {/* Details Bullets */}
                      <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #E5E7EB' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#1F2937', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
                          ✨ Key Details
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {step.details.map((detail, i) => (
                            <li
                              key={i}
                              style={{
                                fontSize: 13,
                                color: '#4B5563',
                                margin: i < step.details.length - 1 ? '0 0 10px 0' : '0',
                                paddingLeft: 20,
                                position: 'relative',
                                lineHeight: 1.4,
                              }}
                            >
                              <span style={{ position: 'absolute', left: 0, color: '#FF751F', fontWeight: 700 }}>•</span>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* POINTS & LEADERBOARD SYSTEM */}
          <section style={{ padding: '80px 20px', background: 'linear-gradient(135deg, #F9FAFB 0%, #FFF5ED 100%)' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <div style={{ marginBottom: 48, textAlign: 'center' }}>
                <h2 style={{ fontSize: 32, fontWeight: 700, color: '#1F2937', marginBottom: 12 }}>
                  Understanding the Points & Leaderboard System
                </h2>
                <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>
                  Your points determine your priority. Here's how it works.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
                {/* Points Breakdown */}
                <div style={{ background: 'white', padding: 32, borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1F2937', marginBottom: 20 }}>
                    How Points Work
                  </h3>
                  <div style={{ display: 'grid', gap: 16 }}>
                    {[
                      { amount: 'R500', points: '500 pts', detail: 'Base monthly contribution' },
                      { amount: 'R1000', points: '1,000 pts', detail: 'Double contribution' },
                      { amount: 'R1500', points: '1,500 pts', detail: 'Premium contribution' },
                      { amount: 'Bonus', points: '+50 pts', detail: 'Per friend referral (max 10/month)' },
                      { amount: 'Attendance', points: '+25 pts', detail: 'Per event you attend' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 16,
                          padding: 16,
                          background: '#F9FAFB',
                          borderRadius: 12,
                          border: '1px solid #E5E7EB',
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 4px 0', fontWeight: 600 }}>
                            {item.amount}
                          </p>
                          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                            {item.detail}
                          </p>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#FF751F',
                          }}
                        >
                          {item.points}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leaderboard Tiers */}
                <div style={{ background: 'white', padding: 32, borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1F2937', marginBottom: 20 }}>
                    Leaderboard Tiers
                  </h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {[
                      { tier: '👑 Top 40%', points: '500+ points', access: 'Ticket Access', color: '#FFD700' },
                      { tier: '⭐ Mid Tier', points: '250-499 points', access: 'Points Roll Over To Next Month', color: '#C0C0C0' },
                      { tier: '🌱 Starter', points: '0-249 points', access: 'Waitlist Priority', color: '#CD7F32' },
                    ].map((tier, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 16,
                          background: '#F9FAFB',
                          borderRadius: 12,
                          border: `2px solid ${tier.color}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', margin: '0 0 4px 0' }}>
                            {tier.tier}
                          </p>
                          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
                            {tier.points}
                          </p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#FF751F', background: '#FEF3E2', padding: '6px 12px', borderRadius: 999 }}>
                          {tier.access}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pro Tips */}
              <div style={{ background: 'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)', border: '2px solid #FF751F', borderRadius: 16, padding: 32 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', marginBottom: 16, margin: '0 0 16px 0' }}>
                  💡 Pro Tips to Maximize Your Points
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    'Set up auto-debit to never miss a contribution',
                    'Refer friends to earn bonus points (up to 50/month)',
                    'Attend events to earn extra points',
                    'Save on a higher tier (R1000/R1500) for faster rank growth',
                    'Check the leaderboard weekly to track your position',
                    'Engage with the community to unlock exclusive rewards',
                  ].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>✓</span>
                      <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                        {tip}
                      </p>
                    </div>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* FAQ SECTION */}
          <section style={{ padding: '80px 20px', background: 'white' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <div style={{ marginBottom: 48, textAlign: 'center' }}>
                <h2 style={{ fontSize: 32, fontWeight: 700, color: '#1F2937', marginBottom: 12 }}>
                  Frequently Asked Questions
                </h2>
                <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>
                  Can't find the answer? Check out our Terms & Rules or contact support.
                </p>
              </div>

              <div>
                {[
                  {
                    question: 'How much does it cost to join GrooveFund?',
                    answer:
                      'There are no signup fees. You only pay your monthly contribution (R500, R1000, or R1500) which includes the 12% operational fee (to power our servers). That\'s it. No hidden charges.',
                  },
                  {
                    question: 'Can I change my contribution amount?',
                    answer:
                      'Yes! You can upgrade or downgrade your contribution amount anytime. Just update your preference in your dashboard. Changes take effect the following month.',
                  },
                  {
                    question: 'What happens if I miss a payment?',
                    answer:
                      'If you miss a payment, your streak resets, but your points stay with you. We\'ll send reminders. If you miss 40+ days, you lose 15 points/day to encourage active participation.',
                  },
                  {
                    question: 'How are concert tickets allocated?',
                    answer:
                      'When tickets are available, top 40% members (500+ points) are notified first. Selection is based on leaderboard ranking. If you don\'t recieve tickets, your points roll over for next month.',
                  },
                  {
                    question: 'Can I withdraw my money?',
                    answer:
                      'GrooveFund is a savings-for-concerts platform, not a savings account. Your money is invested in concert tickets for the community. If you need to stop, you can pause your contribution anytime.',
                  },
                  {
                    question: 'Is my data secure?',
                    answer:
                      'Yes. All data is encrypted and POPIA-compliant. We use industry-standard security protocols. Payment processing is handled by certified, secure payment partners.',
                  },
                  {
                    question: 'How are event tickets delivered?',
                    answer:
                      'When you win, you\'ll receive your tickets via email within 48 hours. Tickets are either digital (PDF) or physical, depending on the event. Instructions are included.',
                  },
                  {
                    question: 'Can I use GrooveFund for other types of events?',
                    answer:
                      'Currently, GrooveFund focuses on concerts and festivals. We\'re exploring partnerships with other events. Stay tuned for updates!',
                  },
                  {
                    question: 'What if GrooveFund shuts down?',
                    answer:
                      'All funds in the pool belong to members collectively. In the unlikely event of closure, remaining funds are distributed proportionally to active members based on their contributions.',
                  },
                  {
                    question: 'How do referrals work?',
                    answer:
                      'Share your unique referral code with friends. When they sign up and make their first payment, you both earn 50 bonus points. You can earn up to 500 referral points per month.',
                  },
                ].map((faq, idx) => (
                  <FAQItem key={idx} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </section>

          {/* COMPARISON TABLE */}
          <section style={{ padding: '80px 20px', background: 'linear-gradient(135deg, #F9FAFB 0%, #FFF5ED 100%)' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <div style={{ marginBottom: 48, textAlign: 'center' }}>
                <h2 style={{ fontSize: 32, fontWeight: 700, color: '#1F2937', marginBottom: 12 }}>
                  Why GrooveFund Beats Other Options
                </h2>
                <p style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>
                  Compare GrooveFund to traditional saving methods.
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    background: 'white',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)' }}>
                      <th style={{ padding: 16, textAlign: 'left', fontSize: 14, fontWeight: 700, color: 'white' }}>
                        Feature
                      </th>
                      <th style={{ padding: 16, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
                        GrooveFund
                      </th>
                      <th style={{ padding: 16, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
                        Bank Savings
                      </th>
                      <th style={{ padding: 16, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
                        Saving Alone
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: 'Minimum Contribution', gf: '✅ R500/month', bank: '✅ R0-R1000', alone: '❌ Unlimited' },
                      { feature: 'Community Support', gf: '✅ Hundreds of members', bank: '❌ None', alone: '❌ Solo' },
                      { feature: 'Interest on Savings', gf: '❌ 0% (converted to tickets)', bank: '✅ 5-8%', alone: '❌ 0%' },
                      { feature: 'Priority Event Access', gf: '✅ Yes (500+ points)', bank: '❌ No', alone: '❌ No' },
                      { feature: 'Transparent Fees', gf: '✅ 12% disclosed', bank: '⚠️ Hidden fees', alone: '✅ None' },
                      { feature: 'Accountability', gf: '✅ Auditable', bank: '✅ Regulated', alone: '❌ Self-managed' },
                      { feature: 'It\'s Fun', gf: '✅ Points & leaderboard', bank: '❌ No', alone: '❌ No' },
                      { feature: 'Goal Achievement', gf: '✅ Concert experiences', bank: '⚠️ Just numbers', alone: '❌ Discipline needed' },
                    ].map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: i < 7 ? '1px solid #E5E7EB' : 'none',
                          background: i % 2 === 0 ? 'white' : '#F9FAFB',
                        }}
                      >
                        <td style={{ padding: 16, fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
                          {row.feature}
                        </td>
                        <td style={{ padding: 16, fontSize: 14, textAlign: 'center', color: '#FF751F', fontWeight: 600 }}>
                          {row.gf}
                        </td>
                        <td style={{ padding: 16, fontSize: 14, textAlign: 'center', color: '#6B7280' }}>
                          {row.bank}
                        </td>
                        <td style={{ padding: 16, fontSize: 14, textAlign: 'center', color: '#6B7280' }}>
                          {row.alone}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* CTA SECTION */}
          <section style={{ background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)', padding: '60px 20px' }}>
            <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: 36, fontWeight: 700, color: 'white', marginBottom: 16 }}>
                Ready to Start Your Groove Journey? 🚀
              </h2>
              <p style={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.9)', marginBottom: 32 }}>
                Join Hundreds of Groovers saving for unforgettable concert experiences
              </p>
              <button
                onClick={() => router.push('/signup')}
                style={{
                  padding: '16px 40px',
                  background: 'white',
                  color: '#FF751F',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Poppins',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
              >
                Get Started Now
              </button>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer style={{ background: '#1F2937', color: 'white', padding: '48px 20px 32px 20px', marginTop: '64px' }}>
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 40,
              marginBottom: 40,
            }}
          >
            {/* About */}
            <div>
              <p
                style={{
                  fontSize: '12px',
                  color: '#9CA3AF',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 16px 0',
                }}
              >
                About
              </p>
              <p style={{ fontSize: '14px', color: '#E5E7EB', margin: '0 0 12px 0' }}>
                South Africa's first concert stokvel.
              </p>
              <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.6', margin: 0 }}>
                Save R500/month. Attend the best concerts in South Africa. Together!
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p
                style={{
                  fontSize: '12px',
                  color: '#9CA3AF',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 16px 0',
                }}
              >
                Quick Links
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '12px' }}>
                  <button
                    onClick={() => router.push('/')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E5E7EB',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: 'Poppins',
                      transition: 'color 0.2s ease',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF751F')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#E5E7EB')}
                  >
                    → Home
                  </button>
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <button
                    onClick={() => router.push('/how-it-works')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E5E7EB',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: 'Poppins',
                      transition: 'color 0.2s ease',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF751F')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#E5E7EB')}
                  >
                    → How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/signup')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E5E7EB',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: 'Poppins',
                      transition: 'color 0.2s ease',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF751F')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#E5E7EB')}
                  >
                    → Get Started
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <p
                style={{
                  fontSize: '12px',
                  color: '#9CA3AF',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 16px 0',
                }}
              >
                Resources
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '12px' }}>
                  <button
                    onClick={() => router.push('/blog')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E5E7EB',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: 'Poppins',
                      transition: 'color 0.2s ease',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF751F')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#E5E7EB')}
                  >
                    📝 Blog & Insights
                  </button>
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <button
                    onClick={() => router.push('/contact')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E5E7EB',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: 'Poppins',
                      transition: 'color 0.2s ease',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF751F')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#E5E7EB')}
                  >
                    → Contact Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Transparency */}
            <div>
              <p
                style={{
                  fontSize: '12px',
                  color: '#9CA3AF',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 16px 0',
                }}
              >
                🛡️ Transparency
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '12px' }}>
                  <button
                    onClick={() => router.push('/terms')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E5E7EB',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: 'Poppins',
                      transition: 'color 0.2s ease',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF751F')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#E5E7EB')}
                  >
                    📋 Terms & Rules
                  </button>
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <button
                    onClick={() => router.push('/transparency')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E5E7EB',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: 'Poppins',
                      transition: 'color 0.2s ease',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF751F')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#E5E7EB')}
                  >
                    📊 Transparency Report
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/privacy')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E5E7EB',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: 'Poppins',
                      transition: 'color 0.2s ease',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF751F')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#E5E7EB')}
                  >
                    🔒 Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div
            style={{
              borderTop: '1px solid #374151',
              paddingTop: 24,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
              © 2026 GrooveFund. All rights reserved. | Save together. Celebrate together.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}