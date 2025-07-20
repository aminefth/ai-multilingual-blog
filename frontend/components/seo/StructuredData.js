'use client';

export function StructuredData() {
  // Organization structured data
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AI Tools Blog',
    description: 'Expert reviews and insights on AI tools and technology',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    logo: {
      '@type': 'ImageObject',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/images/logo.png`,
      width: 300,
      height: 300,
    },
    sameAs: [
      'https://twitter.com/aitoolsblog',
      'https://linkedin.com/company/aitoolsblog',
      'https://github.com/aitoolsblog',
      'https://facebook.com/aitoolsblog',
      'https://instagram.com/aitoolsblog',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-0123',
      contactType: 'Customer Service',
      availableLanguage: ['English', 'French', 'Spanish', 'German', 'Arabic'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
      addressRegion: 'CA',
      addressLocality: 'San Francisco',
    },
  };

  // Website structured data
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AI Tools Blog',
    description: 'Expert reviews and insights on AI tools and technology',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    inLanguage: ['en', 'fr', 'es', 'de', 'ar'],
    isAccessibleForFree: true,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}#organization`,
    },
    copyrightHolder: {
      '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}#organization`,
    },
    copyrightYear: new Date().getFullYear(),
    audience: {
      '@type': 'Audience',
      audienceType: 'Technology Professionals, AI Enthusiasts, Business Owners, Developers',
    },
  };

  // Breadcrumb structured data
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      },
    ],
  };

  // Software Application for AI Tools
  const softwareApplicationData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Tools Directory',
    description: 'Comprehensive directory of AI tools and applications',
    numberOfItems: '500+',
    itemListElement: [
      {
        '@type': 'SoftwareApplication',
        name: 'ChatGPT',
        applicationCategory: 'AI Writing Assistant',
        operatingSystem: 'Web, iOS, Android',
        offers: {
          '@type': 'Offer',
          price: '20',
          priceCurrency: 'USD',
          priceValidUntil: '2025-12-31',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '10000',
          bestRating: '5',
          worstRating: '1',
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Claude',
        applicationCategory: 'AI Assistant',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '20',
          priceCurrency: 'USD',
          priceValidUntil: '2025-12-31',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.7',
          ratingCount: '8500',
          bestRating: '5',
          worstRating: '1',
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Gemini',
        applicationCategory: 'AI Assistant',
        operatingSystem: 'Web, Mobile',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.5',
          ratingCount: '7200',
          bestRating: '5',
          worstRating: '1',
        },
      },
    ],
  };

  return (
    <>
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationData),
        }}
      />

      {/* Website Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteData),
        }}
      />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />

      {/* Software Applications Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationData),
        }}
      />
    </>
  );
}
