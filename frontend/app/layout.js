import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider';
import { I18nProvider } from '@/components/providers/I18nProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StructuredData } from '@/components/seo/StructuredData';
import '@/styles/globals.css';

// Optimized font loading
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

// Advanced SEO Metadata for 2025
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),

  // Basic metadata
  title: {
    template: '%s | AI Tools Blog - Expert Reviews & Insights',
    default: 'AI Tools Blog - Discover the Best AI Tools & Expert Reviews',
  },
  description:
    'Discover comprehensive reviews, tutorials, and insights on the latest AI tools. Expert analysis to help you choose the right AI solutions for productivity, creativity, and business growth.',

  // Keywords optimized for 2025 AI trends
  keywords: [
    'AI tools',
    'artificial intelligence',
    'AI reviews',
    'ChatGPT alternatives',
    'Claude AI',
    'Gemini AI',
    'AI productivity tools',
    'machine learning tools',
    'AI writing assistants',
    'AI image generators',
    'AI code assistants',
    'AI automation',
    'AI for business',
    'AI tutorials',
    'AI comparison',
    'best AI tools 2025',
    'AI tool reviews',
    'AI software',
    'AI platforms',
    'generative AI',
  ],

  // Author and publisher info
  authors: [{ name: 'AI Tools Blog Team', url: process.env.NEXT_PUBLIC_SITE_URL }],
  creator: 'AI Tools Blog',
  publisher: 'AI Tools Blog',

  // Technical metadata
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Open Graph for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'AI Tools Blog',
    title: 'AI Tools Blog - Discover the Best AI Tools & Expert Reviews',
    description:
      'Comprehensive reviews and insights on the latest AI tools. Expert analysis to help you choose the right AI solutions.',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'AI Tools Blog - Expert AI Tool Reviews',
        type: 'image/jpeg',
      },
      {
        url: '/images/og-square.jpg',
        width: 1200,
        height: 1200,
        alt: 'AI Tools Blog Logo',
        type: 'image/jpeg',
      },
    ],
  },

  // Twitter/X Cards optimized for sharing
  twitter: {
    card: 'summary_large_image',
    site: '@aitoolsblog',
    creator: '@aitoolsblog',
    title: 'AI Tools Blog - Expert AI Tool Reviews & Insights',
    description:
      'Discover the best AI tools with comprehensive reviews, tutorials, and expert insights.',
    images: ['/images/twitter-card.jpg'],
  },

  // Search engine optimization
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    bingBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification codes for search engines
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
    bing: process.env.BING_VERIFICATION,
  },

  // Alternate languages for international SEO
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL,
    languages: {
      'en-US': '/en',
      'fr-FR': '/fr',
      'es-ES': '/es',
      'de-DE': '/de',
      'ar-SA': '/ar',
    },
  },

  // Additional metadata for rich snippets
  category: 'Technology',
  classification: 'AI Tools and Technology Reviews',

  // App-specific metadata
  applicationName: 'AI Tools Blog',
  referrer: 'origin-when-cross-origin',

  // Apple-specific metadata
  appleWebApp: {
    capable: true,
    title: 'AI Tools Blog',
    statusBarStyle: 'default',
  },

  // Microsoft-specific metadata
  msApplication: {
    TileColor: '#3b82f6',
    config: '/browserconfig.xml',
  },

  // Manifest for PWA
  manifest: '/manifest.json',
};

// Viewport configuration for optimal mobile experience
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children, params }) {
  const locale = params?.locale || 'en';
  const isRTL = locale === 'ar';

  return (
    <html
      lang={locale}
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.unsplash.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />

        {/* Web app manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme colors */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />

        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//api.unsplash.com" />

        {/* Structured data for search engines and AI chatbots */}
        <StructuredData />

        {/* Additional meta tags for AI chatbots (ChatGPT, Claude, Gemini) */}
        <meta name="ai-content-type" content="technology-reviews" />
        <meta name="ai-expertise-level" content="expert" />
        <meta name="ai-content-freshness" content="regularly-updated" />
        <meta
          name="ai-primary-topics"
          content="artificial-intelligence,ai-tools,technology-reviews"
        />

        {/* Rich snippets meta tags */}
        <meta property="article:publisher" content={process.env.NEXT_PUBLIC_SITE_URL} />
        <meta property="article:author" content="AI Tools Blog Team" />
        <meta property="og:site_name" content="AI Tools Blog" />

        {/* Additional Twitter meta tags */}
        <meta name="twitter:domain" content={process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000'} />
        <meta name="twitter:url" content={process.env.NEXT_PUBLIC_SITE_URL} />

        {/* Bing and other search engines */}
        <meta name="msvalidate.01" content={process.env.BING_VERIFICATION} />
        <meta name="yandex-verification" content={process.env.YANDEX_VERIFICATION} />

        {/* Content language */}
        <meta httpEquiv="content-language" content={locale} />

        {/* Cache control */}
        <meta httpEquiv="cache-control" content="public, max-age=31536000" />
      </head>

      <body className="min-h-screen bg-white font-body text-gray-900 antialiased transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100">
        {/* Progress bar for navigation */}
        <ProgressBar />

        {/* Theme and providers setup */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            <AuthProvider>
              <I18nProvider locale={locale}>
                <AnalyticsProvider>
                  <div className="flex min-h-screen flex-col">
                    {/* Header */}
                    <Header locale={locale} />

                    {/* Main content */}
                    <main className="flex-1" role="main">
                      {children}
                    </main>

                    {/* Footer */}
                    <Footer locale={locale} />
                  </div>

                  {/* Toast notifications */}
                  <ToastProvider />

                  {/* Cookie consent */}
                  <CookieConsent />
                </AnalyticsProvider>
              </I18nProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>

        {/* Service Worker registration for PWA */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              `,
            }}
          />
        )}

        {/* Schema.org structured data script */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'AI Tools Blog',
              description: 'Expert reviews and insights on AI tools and technology',
              url: process.env.NEXT_PUBLIC_SITE_URL,
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL}/search?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
              publisher: {
                '@type': 'Organization',
                name: 'AI Tools Blog',
                logo: {
                  '@type': 'ImageObject',
                  url: `${process.env.NEXT_PUBLIC_SITE_URL}/images/logo.png`,
                  width: 300,
                  height: 300,
                },
                sameAs: [
                  'https://twitter.com/aitoolsblog',
                  'https://linkedin.com/company/aitoolsblog',
                  'https://github.com/aitoolsblog',
                ],
              },
              inLanguage: ['en', 'fr', 'es', 'de', 'ar'],
              audience: {
                '@type': 'Audience',
                audienceType: 'Technology Professionals, AI Enthusiasts, Business Owners',
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
