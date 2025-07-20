'use client';

import { createContext, useContext, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const AnalyticsContext = createContext({});

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export function AnalyticsProvider({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize Google Analytics
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
      // Load Google Analytics script
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
      script.async = true;
      document.head.appendChild(script);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;

      gtag('js', new Date());
      gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  }, []);

  // Track page views
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: url,
        page_title: document.title,
      });

      // Custom page view tracking for our backend
      trackPageView(url);
    }
  }, [pathname, searchParams]);

  // Custom analytics functions
  const trackEvent = (eventName, parameters = {}) => {
    // Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }

    // Custom backend analytics
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: eventName,
          properties: parameters,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(console.error);
    }
  };

  const trackPageView = (url) => {
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/pageviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          referrer: document.referrer,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      }).catch(console.error);
    }
  };

  const trackClick = (element, category = 'UI') => {
    const eventData = {
      event_category: category,
      event_label: element,
      value: 1,
    };

    trackEvent('click', eventData);
  };

  const trackSearch = (searchTerm, results = 0) => {
    const eventData = {
      search_term: searchTerm,
      event_category: 'Search',
      event_label: searchTerm,
      value: results,
    };

    trackEvent('search', eventData);
  };

  const trackDownload = (fileName, fileType) => {
    const eventData = {
      event_category: 'Download',
      event_label: fileName,
      file_type: fileType,
    };

    trackEvent('file_download', eventData);
  };

  const trackShare = (platform, url, title) => {
    const eventData = {
      event_category: 'Social',
      event_label: platform,
      content_title: title,
      content_url: url,
    };

    trackEvent('share', eventData);
  };

  const trackSubscription = (plan, value) => {
    const eventData = {
      event_category: 'Subscription',
      event_label: plan,
      value: value,
      currency: 'USD',
    };

    trackEvent('purchase', eventData);
  };

  const trackAffiliateClick = (toolName, affiliateId) => {
    const eventData = {
      event_category: 'Affiliate',
      event_label: toolName,
      affiliate_id: affiliateId,
    };

    trackEvent('affiliate_click', eventData);
  };

  const trackNewsletterSignup = (source) => {
    const eventData = {
      event_category: 'Newsletter',
      event_label: source,
      value: 1,
    };

    trackEvent('sign_up', eventData);
  };

  const trackTimeOnPage = (duration) => {
    const eventData = {
      event_category: 'Engagement',
      event_label: 'time_on_page',
      value: Math.round(duration / 1000), // Convert to seconds
    };

    trackEvent('timing_complete', eventData);
  };

  // Track time on page
  useEffect(() => {
    const startTime = Date.now();

    const handleBeforeUnload = () => {
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        // Only track if user stayed more than 5 seconds
        trackTimeOnPage(duration);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pathname]);

  const value = {
    trackEvent,
    trackPageView,
    trackClick,
    trackSearch,
    trackDownload,
    trackShare,
    trackSubscription,
    trackAffiliateClick,
    trackNewsletterSignup,
    trackTimeOnPage,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}
