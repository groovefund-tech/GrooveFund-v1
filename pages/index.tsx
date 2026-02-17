'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';

function RuleAccordion({ title, content }: { title: string; content: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      style={{
        background: isOpen
          ? 'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)'
          : 'white',
        border: isOpen ? '2px solid #FF751F' : '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isOpen
          ? '0 8px 24px rgba(255, 117, 31, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.05)',
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: '#FAFAFA',
          fontFamily: 'Poppins, sans-serif',
          width: '100%',
          overflow: 'hidden',
        }}

      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#1F2937',
            margin: 0,
          }}
        >
          {title}
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
            animation: 'fadeInUp 0.3s ease',
          }}
        >
          {content}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Handle responsive state on mount and resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGetStarted = () => {
    router.push('/signup');
  };

  // Responsive style values
  const styles = {
    headerGap: isMobile ? 8 : 12,
    headerPadding: isMobile ? '16px 16px' : '24px 20px',
    buttonPadding: isMobile ? '10px 16px' : '10px 20px',
    buttonFontSize: isMobile ? 12 : 14,
    sectionPadding: isMobile ? '40px 16px' : isTablet ? '60px 20px' : '80px 20px',
    heroFontSize: isMobile ? 28 : isTablet ? 36 : 48,
    heroSubtitleFontSize: isMobile ? 14 : isTablet ? 16 : 18,
    heroPadding: isMobile ? '60px 16px' : isTablet ? '80px 20px' : '100px 20px',
    heading2FontSize: isMobile ? 24 : isTablet ? 28 : 32,
    featureCardPadding: isMobile ? 14 : 20,
    featureGridColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    stepsGridColumns: isMobile ? '1fr' : '1fr',
    stepsInnerGridColumns: isMobile ? '1fr' : '80px 1fr',
    stepsGap: isMobile ? 16 : 24,
    whyGridColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    testimonialGridColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : '1fr',
    carouselPadding: isMobile ? '40px 16px' : '60px 20px',
    ctaFontSize: isMobile ? 24 : isTablet ? 28 : 36,
    ctaSubtitleFontSize: isMobile ? 14 : isTablet ? 16 : 18,
    ctaPadding: isMobile ? '40px 16px' : '60px 20px',
    footerGridColumns: isMobile
      ? '1fr'
      : isTablet
      ? 'repeat(2, 1fr)'
      : 'repeat(auto-fit, minmax(200px, 1fr))',
    containerPaddingX: isMobile ? 16 : 20,
  };

  // Reusable Container Component
  const Container = ({ children, maxWidth = 1200, style = {} }: any) => (
    <div
      style={{
        maxWidth,
        margin: '0 auto',
        width: '100%',
        paddingLeft: styles.containerPaddingX,
        paddingRight: styles.containerPaddingX,
        ...style,
      }}
    >
      {children}
    </div>
  );

  return (
    <>
      <Head>
        {/* Primary Meta Tags - SEO */}
        <title>
          GrooveFund | South Africa's First Concert Stokvel - Save & Celebrate
          Together
        </title>
        <meta
          name="description"
          content="Join Hundreds of Groovers saving R500/month for unforgettable concert experiences. Get priority access to festival tickets across South Africa. 100% transparent, zero hidden fees."
        />
        <meta
          name="keywords"
          content="concert stokvel, save for concerts, festival tickets, South Africa, group savings, concert club, event access"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0"
        />

        {/* Open Graph - Social Sharing */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="GrooveFund | Save Together, Celebrate Together - South Africa's Concert Stokvel"
        />
        <meta
          property="og:description"
          content="South Africa's first concert stokvel. Save R500/month and get priority access to the hottest festival tickets. Join thousands of Groovers today."
        />
        <meta property="og:url" content="https://groovefund.co.za" />
        <meta property="og:image" content="https://groovefund.co.za/og-image.png" />
        <meta property="og:site_name" content="GrooveFund" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="GrooveFund | Save for Concerts, Get Priority Tickets"
        />
        <meta
          name="twitter:description"
          content="Join South Africa's first concert stokvel. Save R500/month and attend unforgettable experiences with your community."
        />
        <meta name="twitter:image" content="https://groovefund.co.za/og-image.png" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://groovefund.co.za" />

        {/* JSON-LD Schema Markup - Organization & Website */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': ['Organization', 'LocalBusiness'],
            name: 'GrooveFund',
            description:
              "South Africa's first concert stokvel. Save R500/month and get priority access to the hottest festival tickets.",
            url: 'https://groovefund.co.za',
            logo: 'https://groovefund.co.za/images/logo.png',
            foundingDate: '2026-01-15',
            areaServed: {
              '@type': 'Country',
              name: 'ZA',
            },
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'ZA',
              addressLocality: 'Johannesburg',
              addressRegion: 'Gauteng',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Support',
              telephone: '+27-xxx-xxx-xxxx',
              email: 'support@groovefund.co.za',
              availableLanguage: 'en-ZA',
              contactOption: 'TollFree',
            },
            sameAs: [
              'https://www.instagram.com/groovefund',
              'https://www.twitter.com/groovefund',
              'https://www.facebook.com/groovefund',
              'https://www.linkedin.com/company/groovefund',
            ],
            priceRange: 'R500-R1500',
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              reviewCount: '247',
              bestRating: '5',
              worstRating: '1',
            },
          })}
        </script>

        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How Much Do I Contribute?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'You contribute R500/month minimum. No signup fees. Every R500 gives you 500 points instantly.',
                },
              },
              {
                '@type': 'Question',
                name: 'How Do I Recieve Tickets?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Top 40% of members (those with 500+ points) get first access to event tickets.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is This Legal?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'GrooveFund operates as a stokvel — a traditional South African savings club. Fully transparent and compliant.',
                },
              },
            ],
          })}
        </script>

        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://groovefund.co.za/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Get Started',
                item: 'https://groovefund.co.za/signup',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Terms',
                item: 'https://groovefund.co.za/terms',
              },
            ],
          })}
        </script>

        {/* Additional SEO Meta */}
        <meta name="language" content="English" />
        <meta name="author" content="GrooveFund" />
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
        <meta name="theme-color" content="#FF751F" />

        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </Head>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: '#FAFAFA',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
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

          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.02);
            }
          }

          @keyframes scrollLeft {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-140px * 8 - 40px * 8));
            }
          }

          @keyframes scrollRight {
            0% {
              transform: translateX(calc(-140px * 8 - 40px * 8));
            }
            100% {
              transform: translateX(0);
            }
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .feature-card {
            animation: fadeInUp 0.6s ease-out forwards;
            opacity: 0;
          }

          .feature-card:nth-child(1) {
            animation-delay: 0.2s;
          }

          .feature-card:nth-child(2) {
            animation-delay: 0.3s;
          }

          .feature-card:nth-child(3) {
            animation-delay: 0.4s;
          }

          .carousel-logo {
            flex: 0 0 140px;
            height: 140px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #F3F4F6;
            border-radius: 16px;
            border: 2px solid #E5E7EB;
            transition: all 0.3s ease;
            padding: 12px;
            box-sizing: border-box;
          }

          .carousel-logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }

          .carousel-logo:hover {
            transform: scale(1.05);
            border-color: #FF751F;
            box-shadow: 0 4px 12px rgba(255, 117, 31, 0.1);
          }

          .carousel-row-track {
            will-change: transform;
            backface-visibility: hidden;
            perspective: 1000px;
            display: flex;
            gap: 40px;
            width: fit-content;
          }

          .carousel-row-track.scroll-left {
            animation: scrollLeft 20s linear infinite;
          }

          .carousel-row-track.scroll-right {
            animation: scrollRight 20s linear infinite;
          }

          /* Mobile Styles */
          @media (max-width: 767px) {
            .carousel-logo {
              flex: 0 0 100px;
              height: 100px;
              border-radius: 12px;
            }

            .carousel-row-track {
              gap: 16px;
            }
          }

          /* Tablet Styles */
          @media (min-width: 768px) and (max-width: 1023px) {
            .carousel-logo {
              flex: 0 0 120px;
              height: 120px;
            }
          }

          /* Touch targets for better mobile UX */
          @media (max-width: 767px) {
            button {
              min-height: 44px;
              min-width: 44px;
            }
          }
        `}</style>

        {/* HEADER */}
        <header
          style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: styles.headerPadding,
              borderBottom: '1px solid #E5E7EB',
              background: 'white',
              position: 'sticky',
              top: 0,
              zIndex: 40,
              width: '100%',
            }}
          >

          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              gap: styles.headerGap,
              paddingLeft: styles.containerPaddingX,
              paddingRight: styles.containerPaddingX,
            }}
          >
            <img
              src="/images/logo.png"
              alt="GrooveFund - Concert Stokvel"
              width={120}
              height={40}
              style={{
                cursor: 'pointer',
                width: 'auto',
                height: isMobile ? '24px' : '32px',
                flexShrink: 0,
              }}
              onClick={() => router.push('/')}
            />

            <div
              style={{
                display: 'flex',
                gap: styles.headerGap,
                flexWrap: isMobile ? 'wrap' : 'nowrap',
              }}
            >
              <button
                onClick={() => router.push('/login')}
                style={{
                  padding: styles.buttonPadding,
                  border: '1px solid #FF751F',
                  borderRadius: 12,
                  background: 'white',
                  color: '#FF751F',
                  fontSize: styles.buttonFontSize,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Poppins',
                  transition: 'all 0.2s',
                  minHeight: isMobile ? '40px' : 'auto',
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
                onClick={handleGetStarted}
                style={{
                  padding: styles.buttonPadding,
                  border: 'none',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                  color: 'white',
                  fontSize: styles.buttonFontSize,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Poppins',
                  transition: 'all 0.2s',
                  minHeight: isMobile ? '40px' : 'auto',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(255, 117, 31, 0.2)';
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
        <main style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
       {/* HERO SECTION WITH BACKGROUND IMAGE */}
        <section
          style={{
            background: 'linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url(/images/backgrounds/landing.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: isMobile ? 'scroll' : 'fixed',
            minHeight: isMobile ? '400px' : '500px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 0',
          }}
        >
          <div
            style={{
              maxWidth: '90%',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: isMobile ? 40 : 64,
                marginBottom: 16,
                animation: 'pulse 2s infinite',
              }}
            >
              🎵
            </div>

            <h1
              style={{
                fontSize: styles.heroFontSize,
                fontWeight: 700,
                color: 'white',
                margin: '0 0 16px 0',
                lineHeight: 1.1,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              }}
            >
              South Africa's first concert stokvel.
            </h1>

            <p
              style={{
                fontSize: styles.heroSubtitleFontSize,
                color: '#E5E7EB',
                margin: '0 0 32px 0',
                lineHeight: 1.6,
                textShadow: '0 1px 5px rgba(0, 0, 0, 0.5)',
              }}
            >
              Save R500/month. Attend the best concerts in South Africa.
              Together!
            </p>

            <button
              onClick={handleGetStarted}
              style={{
                padding: isMobile ? '14px 32px' : '16px 40px',
                background:
                  'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: isMobile ? 14 : 16,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Poppins',
                transition: 'all 0.3s',
                boxShadow: '0 8px 16px rgba(255, 117, 31, 0.4)',
                minHeight: '44px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow =
                  '0 12px 24px rgba(255, 117, 31, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 8px 16px rgba(255, 117, 31, 0.4)';
              }}
            >
              Join 100's of Groovers Today
            </button>
          </div>
        </section>

          {/* FEATURES SECTION */}
          <section
            style={{
              padding: styles.sectionPadding,
              background: 'white',
            }}
          >
            <Container maxWidth={1000}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: styles.featureGridColumns,
                  gap: isMobile ? 12 : 16,
                  marginBottom: 48,
                }}
              >
                {[
                  { icon: '💰', title: 'Save Monthly', subtitle: 'EFT or YOCO' },
                  {
                    icon: '🔥',
                    title: 'Build Streaks',
                    subtitle: 'Stay Consistent',
                  },
                  {
                    icon: '🎉',
                    title: 'Celebrate',
                    subtitle: 'Real Concerts & Festivals',
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="feature-card"
                    style={{
                      textAlign: 'center',
                      background: 'white',
                      padding: styles.featureCardPadding,
                      borderRadius: 16,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                      border: '1px solid rgba(255, 117, 31, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow =
                        '0 12px 24px rgba(255, 117, 31, 0.15)';
                      e.currentTarget.style.borderColor = '#FF751F';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow =
                        '0 2px 8px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.borderColor =
                        'rgba(255, 117, 31, 0.1)';
                    }}
                  >
                    <div
                      style={{
                        fontSize: isMobile ? 32 : 40,
                        marginBottom: 12,
                      }}
                    >
                      {feature.icon}
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 13 : 14,
                        fontWeight: 600,
                        color: '#1F2937',
                      }}
                    >
                      {feature.title}
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 11 : 12,
                        color: '#6B7280',
                        marginTop: 4,
                      }}
                    >
                      {feature.subtitle}
                    </div>
                  </div>
                ))}
              </div>
            </Container>
          </section>

          {/* LOGO CAROUSEL */}
          <section
            style={{
              background: 'white',
              padding: styles.carouselPadding,
            }}
          >
            <Container maxWidth={1200}>
              <p
                style={{
                  textAlign: 'center',
                  fontSize: isMobile ? 12 : 14,
                  color: '#6B7280',
                  fontWeight: 600,
                  marginBottom: 40,
                  marginTop: 0,
                }}
              >
                Get access to tickets for South Africa's biggest events
              </p>

              <div
                style={{
                  overflow: 'hidden',
                }}
              >
                <div className="carousel-row">
                  <div className="carousel-row-track scroll-left">
                    {[
                      '/images/back-to-the-city.jpg',
                      '/images/download (6).png',
                      '/images/cape town int jazz festival.png',
                      '/images/black coffee weekender.jpg',
                      '/images/castle lite unlocks.jpg',
                      '/images/homecoming events.jpg',
                      '/images/luxury marble circus.jpg',
                      '/images/download (11).jpeg',
                      '/images/hey-neighbour.jpg',
                      '/images/Amstel-FOA-Logo.png',
                      '/images/Ultra_South_Africa_Logo.png',
                      '/images/back-to-the-city.jpg',
                      '/images/Corona_Chasing_Sunsets.png',
                      '/images/afrikaburn logo.png',
                      '/images/castle lite unlocks.jpg',
                      '/images/Delicious_DStv_Logo_RGB-850x595.png',
                      '/images/sounset sundays.png',
                      '/images/SBJoy-Of-Jazz-Logo.png',
                    ].map((logo, i) => (
                      <div key={`row1-${i}`} className="carousel-logo">
                        <img
                          src={logo}
                          alt={`South Africa concert and festival venue ${i + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Container>
          </section>

          {/* HOW IT WORKS SECTION */}
          <section
            style={{
              padding: styles.sectionPadding,
              background: 'linear-gradient(135deg, #F9FAFB 0%, #FFF5ED 100%)',
            }}
          >
            <Container maxWidth={900}>
              <div
                style={{
                  marginBottom: 60,
                  textAlign: 'center',
                }}
              >
                <h2
                  style={{
                    fontSize: styles.heading2FontSize,
                    fontWeight: 700,
                    color: '#1F2937',
                    marginBottom: 12,
                    marginTop: 0,
                  }}
                >
                  How It Works
                </h2>
                <p
                  style={{
                    fontSize: isMobile ? 14 : 16,
                    color: '#6B7280',
                    margin: 0,
                  }}
                >
                  Save R500/month. Attend the best concerts in South Africa.
                  Together!
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: styles.stepsGridColumns,
                  gap: 32,
                }}
              >
                {[
                  {
                    step: '01',
                    icon: '📝',
                    title: 'Sign Up & Set Your Goal',
                    desc: 'Complete your profile in 2 minutes. Choose your monthly savings amount (R500, R1000, or R1500).',
                  },
                  {
                    step: '02',
                    icon: '💰',
                    title: 'Start Saving Together',
                    desc: 'Your monthly contributions go into a secure pool. Build your concert fund automatically.',
                  },
                  {
                    step: '03',
                    icon: '🎟️',
                    title: 'Get Priority Access',
                    desc: 'Top savers get first access to premium concert and festival tickets across South Africa.',
                  },
                  {
                    step: '04',
                    icon: '🎵',
                    title: 'Groove Together',
                    desc: 'Connect with hundreds of Groovers at unforgettable events. Build a community that celebrates together.',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: styles.stepsInnerGridColumns,
                      gap: styles.stepsGap,
                      alignItems: isMobile ? 'center' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: isMobile ? 60 : 80,
                          height: isMobile ? 60 : 80,
                          borderRadius: 20,
                          background:
                            'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: isMobile ? 28 : 40,
                          boxShadow:
                            '0 8px 20px rgba(255, 117, 31, 0.25)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {item.icon}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#FF751F',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.step}
                      </div>
                    </div>

                    <div
                      style={{
                        paddingTop: isMobile ? 0 : 4,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: isMobile ? 16 : 18,
                          fontWeight: 600,
                          color: '#1F2937',
                          margin: isMobile ? '0 0 8px 0' : '0 0 8px 0',
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontSize: isMobile ? 13 : 14,
                          color: '#6B7280',
                          lineHeight: 1.6,
                          margin: 0,
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Container>
          </section>

          {/* WHY GROOVEFUND SECTION */}
          <section
            style={{
              padding: styles.sectionPadding,
              background: 'white',
            }}
          >
            <Container maxWidth={900}>
              <div
                style={{
                  marginBottom: 60,
                  textAlign: 'center',
                }}
              >
                <h2
                  style={{
                    fontSize: styles.heading2FontSize,
                    fontWeight: 700,
                    color: '#1F2937',
                    marginBottom: 12,
                    marginTop: 0,
                  }}
                >
                  Why GrooveFund?
                </h2>
                <p
                  style={{
                    fontSize: isMobile ? 14 : 16,
                    color: '#6B7280',
                    margin: 0,
                  }}
                >
                  Save smarter. Groove harder. Together.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: styles.whyGridColumns,
                  gap: isMobile ? 12 : 16,
                }}
              >
                {[
                  {
                    emoji: '👥',
                    title: 'Community Driven',
                    desc: 'Join thousands saving together for unforgettable experiences',
                  },
                  {
                    emoji: '🎫',
                    title: 'Priority Access',
                    desc: 'Get first dibs on the hottest concert tickets',
                  },
                  {
                    emoji: '💚',
                    title: 'Financial Freedom',
                    desc: 'Build streaks and earn rewards for consistency',
                  },
                  {
                    emoji: '🌟',
                    title: 'Exclusive Events',
                    desc: 'VIP access to GrooveFund member-only events',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background:
                        'linear-gradient(135deg, #F0F9FF 0%, #E0F2FF 100%)',
                      padding: isMobile ? 16 : 24,
                      borderRadius: 16,
                      border: '2px solid #BFDBFE',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = '#FF751F';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = '#BFDBFE';
                    }}
                  >
                    <div
                      style={{
                        fontSize: isMobile ? 32 : 40,
                        marginBottom: 12,
                      }}
                    >
                      {item.emoji}
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 14 : 16,
                        fontWeight: 600,
                        color: '#1F2937',
                        marginBottom: 8,
                      }}
                    >
                      {item.title}
                    </div>
                    <p
                      style={{
                        fontSize: isMobile ? 12 : 14,
                        color: '#6B7280',
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {item.desc}
                      </p>
                  </div>
                ))}
              </div>
            </Container>
          </section>

          {/* RULES & TRANSPARENCY SECTION */}
          <section
            style={{
              padding: styles.sectionPadding,
              background:
                'linear-gradient(135deg, #F9FAFB 0%, #FFF5ED 100%)',
            }}
          >
            <Container maxWidth={900} style={{ padding: 0 }}>
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: 48,
                  paddingLeft: styles.containerPaddingX,
                  paddingRight: styles.containerPaddingX,
                }}
              >
                <h2
                  style={{
                    fontSize: styles.heading2FontSize,
                    fontWeight: 700,
                    color: '#1F2937',
                    marginBottom: 12,
                    marginTop: 0,
                  }}
                >
                  🛡️ Rules & Transparency
                </h2>
                <p
                  style={{
                    fontSize: isMobile ? 14 : 16,
                    color: '#6B7280',
                    margin: 0,
                  }}
                >
                  Everything you need to know. No hidden fees. No surprises.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  marginBottom: 32,
                  paddingLeft: styles.containerPaddingX,
                  paddingRight: styles.containerPaddingX,
                }}
              >
                {[
                  {
                    title: 'How Much Do I Contribute?',
                    content:
                      'You contribute R500/month minimum. No signup fees. Every R500 gives you 500 points instantly.',
                  },
                  {
                    title: 'How Do I Receive Tickets?',
                    content:
                      'Top 40% of members (those with 500+ points) get first access to event tickets.',
                  },
                  {
                    title: 'Is This Legal?',
                    content:
                      'GrooveFund operates as a stokvel — a traditional South African savings club. Fully transparent and compliant.',
                  },
                ].map((rule, idx) => (
                  <RuleAccordion
                    key={idx}
                    title={rule.title}
                    content={rule.content}
                  />
                ))}
              </div>

              <div
                style={{
                  background:
                    'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)',
                  border: '2px solid #FF751F',
                  borderRadius: 16,
                  padding: isMobile ? 16 : 24,
                  textAlign: 'center',
                  marginLeft: styles.containerPaddingX,
                  marginRight: styles.containerPaddingX,
                }}
              >
                <p
                  style={{
                    fontSize: isMobile ? 12 : 14,
                    color: '#1F2937',
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  ✅ <strong>100% Transparent</strong> • All fees disclosed •
                  Points earned instantly • Real tickets to real events
                </p>
              </div>
            </Container>
          </section>

          {/* TESTIMONIALS SECTION */}
          <section
            style={{
              padding: styles.sectionPadding,
              background: 'white',
            }}
          >
            <Container maxWidth={900}>
              <div
                style={{
                  marginBottom: 48,
                  textAlign: 'center',
                }}
              >
                <h2
                  style={{
                    fontSize: styles.heading2FontSize,
                    fontWeight: 700,
                    color: '#1F2937',
                    marginBottom: 12,
                    marginTop: 0,
                  }}
                >
                  What Groovers Say 💬
                </h2>
                <p
                  style={{
                    fontSize: isMobile ? 14 : 16,
                    color: '#6B7280',
                    margin: 0,
                  }}
                >
                  Real stories from our growing South African community
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: styles.testimonialGridColumns,
                  gap: isMobile ? 16 : 24,
                }}
              >
                {[
                  {
                    name: 'Thabo',
                    location: 'Cape Town',
                    content:
                      'GrooveFund made my concert dreams possible. Finally saving with friends towards something meaningful!',
                    icon: '🎤',
                  },
                  {
                    name: 'Naledi',
                    location: 'Johannesburg',
                    content:
                      'The community aspect is amazing. We motivate each other to keep our streaks going. Never felt so supported.',
                    icon: '💪',
                  },
                  {
                    name: 'Lerato',
                    location: 'Durban',
                    content:
                      'Best financial decision I made. I can now prioritise fun without feeling guilty. Worth every rand.',
                    icon: '📈',
                  },
                ].map((testimonial, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'white',
                      padding: isMobile ? 20 : 28,
                      borderRadius: 16,
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow =
                        '0 16px 32px rgba(255, 117, 31, 0.12)';
                      e.currentTarget.style.borderColor = '#FF751F';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow =
                        '0 2px 8px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  >
                    <div
                      style={{
                        background:
                          'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                        color: 'white',
                        padding: isMobile ? 12 : 16,
                        borderRadius: 16,
                        marginBottom: 16,
                        fontSize: isMobile ? 12 : 14,
                        lineHeight: 1.6,
                      }}
                    >
                      "{testimonial.content}"
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: isMobile ? 13 : 14,
                            fontWeight: 600,
                            color: '#1F2937',
                            marginBottom: 2,
                          }}
                        >
                          {testimonial.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#6B7280',
                          }}
                        >
                          {testimonial.location}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: isMobile ? 24 : 28,
                        }}
                      >
                        {testimonial.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Container>
          </section>

          {/* CTA SECTION */}
          <section
            style={{
              background:
                'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
              padding: styles.ctaPadding,
            }}
          >
            <Container maxWidth={900}>
              <h2
                style={{
                  fontSize: styles.ctaFontSize,
                  fontWeight: 700,
                  color: 'white',
                  marginBottom: 16,
                  marginTop: 0,
                  textAlign: 'center',
                }}
              >
                Ready to Start Grooving? 🚀
              </h2>

              <p
                style={{
                  fontSize: styles.ctaSubtitleFontSize,
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: isMobile ? 24 : 32,
                  textAlign: 'center',
                  margin: `0 0 ${isMobile ? 24 : 32}px 0`,
                }}
              >
                Join Hundreds of South Africans saving for unforgettable
                concert experiences
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <button
                  onClick={handleGetStarted}
                  style={{
                    padding: isMobile ? '14px 32px' : '16px 40px',
                    background: 'white',
                    color: '#FF751F',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: isMobile ? 14 : 16,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Poppins',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    minHeight: '44px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow =
                      '0 8px 20px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow =
                      '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  Get Started Now
                </button>
              </div>
            </Container>
          </section>
        </main>

        {/* FOOTER */}
        <footer
          style={{
            background: '#1F2937',
            color: 'white',
            padding: isMobile ? '32px 16px' : '48px 20px 32px 20px',
            marginTop: '64px',
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              width: '100%',
              display: 'grid',
              gridTemplateColumns: styles.footerGridColumns,
              gap: isMobile ? 24 : 40,
              marginBottom: 40,
              paddingLeft: styles.containerPaddingX,
              paddingRight: styles.containerPaddingX,
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
              <p
                style={{
                  fontSize: '14px',
                  color: '#E5E7EB',
                  margin: '0 0 12px 0',
                }}
              >
                South Africa's first concert stokvel.
              </p>
              <p
                style={{
                  fontSize: '13px',
                  color: '#9CA3AF',
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                Save R500/month. Attend the best concerts in South Africa.
                Together!
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
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                <li
                  style={{
                    marginBottom: '12px',
                  }}
                >
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = '#FF751F')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = '#E5E7EB')
                    }
                  >
                    → Home
                  </button>
                </li>
                <li
                  style={{
                    marginBottom: '12px',
                  }}
                >
                  <button
                    onClick={handleGetStarted}
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = '#FF751F')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = '#E5E7EB')
                    }
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
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                <li
                  style={{
                    marginBottom: '12px',
                  }}
                >
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = '#FF751F')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = '#E5E7EB')
                    }
                  >
                    📝 Blog & Insights
                  </button>
                </li>
                <li
                  style={{
                    marginBottom: '12px',
                  }}
                >
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = '#FF751F')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = '#E5E7EB')
                    }
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
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                <li
                  style={{
                    marginBottom: '12px',
                  }}
                >
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = '#FF751F')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = '#E5E7EB')
                    }
                  >
                    📋 Terms & Rules
                  </button>
                </li>
                <li
                  style={{
                    marginBottom: '12px',
                  }}
                >
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = '#FF751F')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = '#E5E7EB')
                    }
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
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = '#FF751F')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = '#E5E7EB')
                    }
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
              maxWidth: 1200,
              margin: '0 auto',
              width: '100%',
              paddingLeft: styles.containerPaddingX,
              paddingRight: styles.containerPaddingX,
              borderTop: '1px solid #374151',
              paddingTop: 24,
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: '#9CA3AF',
                margin: 0,
              }}
            >
              © 2026 GrooveFund. All rights reserved. | Save together.
              Celebrate together.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
