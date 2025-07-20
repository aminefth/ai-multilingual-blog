import { Suspense } from 'react';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturedPosts } from '@/components/sections/FeaturedPosts';
import { CategoriesGrid } from '@/components/sections/CategoriesGrid';
import { NewsletterSection } from '@/components/sections/NewsletterSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { ToolsShowcase } from '@/components/sections/ToolsShowcase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Metadata } from 'next';
import { FAQSection } from '@/components/sections/FAQSection';
import { StructuredData } from '@/components/seo/StructuredData';

// Advanced SEO metadata for homepage
export const metadata = {
  title: 'AI Tools Hub - Discover the Best AI Tools for 2025 | Expert Reviews & Comparisons',
  description:
    'Find and compare 500+ AI tools with expert reviews, tutorials, and real-world use cases. Discover the best AI solutions for writing, coding, design, productivity, and more.',
  keywords: [
    'AI tools',
    'artificial intelligence',
    'AI software',
    'machine learning tools',
    'AI reviews',
    'ChatGPT alternatives',
    'AI writing tools',
    'AI image generators',
    'AI coding assistants',
    'productivity AI',
    'business AI solutions',
    'AI tool comparison',
    'best AI tools 2025',
    'AI tool reviews',
    'AI software directory',
  ].join(', '),
  authors: [{ name: 'AI Tools Hub Team' }],
  creator: 'AI Tools Hub',
  publisher: 'AI Tools Hub',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://aitoolshub.com'),
  alternates: {
    canonical: '/',
    languages: {
      en: '/en',
      fr: '/fr',
      es: '/es',
      de: '/de',
      ar: '/ar',
    },
  },
  openGraph: {
    title: 'AI Tools Hub - Discover the Best AI Tools for 2025',
    description:
      'Find and compare 500+ AI tools with expert reviews, tutorials, and real-world use cases. Your trusted source for AI tool recommendations.',
    url: '/',
    siteName: 'AI Tools Hub',
    images: [
      {
        url: '/images/og/homepage.jpg',
        width: 1200,
        height: 630,
        alt: 'AI Tools Hub - Best AI Tools Directory',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Tools Hub - Discover the Best AI Tools for 2025',
    description:
      'Find and compare 500+ AI tools with expert reviews and tutorials. Your trusted AI tools directory.',
    images: ['/images/twitter/homepage.jpg'],
    creator: '@aitoolshub',
  },
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
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
    other: {
      'bing-site-verification': process.env.BING_VERIFICATION,
    },
  },
  category: 'Technology',
  classification: 'AI Tools Directory',
  referrer: 'origin-when-cross-origin',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3B82F6' },
    { media: '(prefers-color-scheme: dark)', color: '#1E40AF' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI Tools Hub',
  },
  applicationName: 'AI Tools Hub',
  generator: 'Next.js',
  abstract:
    'Comprehensive AI tools directory with expert reviews, comparisons, and tutorials for professionals and businesses.',
  archives: ['/blog/archive'],
  assets: ['/images', '/icons'],
  bookmarks: ['/tools/favorites'],
  category: 'AI & Technology',
  classification: 'Professional AI Tools Directory',
};

export default function HomePage() {
  return (
    <>
      {/* SEO Structured Data */}
      <StructuredData />

      {/* Homepage Sections */}
      <main className="min-h-screen">
        {/* Hero Section */}
        <HeroSection />

        {/* Stats Section */}
        <StatsSection />

        {/* Featured AI Tools Showcase */}
        <ToolsShowcase />

        {/* Featured Blog Posts */}
        <FeaturedPosts />

        {/* Categories Grid */}
        <CategoriesGrid />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Newsletter Signup */}
        <NewsletterSection />

        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* Additional Structured Data for Homepage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'AI Tools Hub',
            description:
              'Comprehensive directory of AI tools with expert reviews, comparisons, and tutorials',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://aitoolshub.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://aitoolshub.com'}/search?q={search_term_string}`,
              },
              'query-input': 'required name=search_term_string',
            },
            publisher: {
              '@type': 'Organization',
              name: 'AI Tools Hub',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'https://aitoolshub.com',
              logo: {
                '@type': 'ImageObject',
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://aitoolshub.com'}/images/logo.png`,
              },
            },
            mainEntity: {
              '@type': 'ItemList',
              name: 'Featured AI Tools',
              description: 'Top-rated AI tools across different categories',
              numberOfItems: 500,
              itemListElement: [
                {
                  '@type': 'SoftwareApplication',
                  position: 1,
                  name: 'ChatGPT',
                  description:
                    'Advanced conversational AI for writing, coding, and problem-solving',
                  applicationCategory: 'AI Assistant',
                  operatingSystem: 'Web, iOS, Android',
                  offers: {
                    '@type': 'Offer',
                    price: '20',
                    priceCurrency: 'USD',
                    priceValidUntil: '2025-12-31',
                  },
                },
                {
                  '@type': 'SoftwareApplication',
                  position: 2,
                  name: 'Midjourney',
                  description: 'AI-powered image generation from text prompts',
                  applicationCategory: 'Image Generation',
                  operatingSystem: 'Web',
                  offers: {
                    '@type': 'Offer',
                    price: '10',
                    priceCurrency: 'USD',
                    priceValidUntil: '2025-12-31',
                  },
                },
              ],
            },
          }),
        }}
      />

      {/* Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: process.env.NEXT_PUBLIC_SITE_URL || 'https://aitoolshub.com',
              },
            ],
          }),
        }}
      />
    </>
  );
}
