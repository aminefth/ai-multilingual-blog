'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CookieIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAnalytics } from '@/components/providers/AnalyticsProvider';

export function CookieConsent() {
  const { t } = useI18n();
  const { trackEvent } = useAnalytics();
  const [isVisible, setIsVisible] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
    trackEvent('cookie_consent_accept_all');
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    const consentData = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
    trackEvent('cookie_consent_accept_selected', { preferences });
    setIsVisible(false);
  };

  const handleReject = () => {
    const consentData = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('cookie-consent', JSON.stringify(consentData));
    trackEvent('cookie_consent_reject');
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <div className="container-custom">
            <div className="flex items-start space-x-4">
              <CookieIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Cookie Preferences
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  We use cookies to enhance your experience, analyze site traffic, and personalize
                  content. You can customize your preferences below.
                </p>

                {/* Cookie Categories */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Necessary Cookies
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Required for basic site functionality
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.necessary}
                      disabled
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Analytics Cookies
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Help us understand how you use our site
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) =>
                        setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Marketing Cookies
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Used to show you relevant ads and content
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) =>
                        setPreferences((prev) => ({ ...prev, marketing: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <button onClick={handleAcceptAll} className="btn btn-primary w-full sm:w-auto">
                    Accept All
                  </button>

                  <button
                    onClick={handleAcceptSelected}
                    className="btn btn-outline w-full sm:w-auto"
                  >
                    Accept Selected
                  </button>

                  <button onClick={handleReject} className="btn btn-ghost w-full sm:w-auto">
                    Reject All
                  </button>
                </div>

                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Learn more in our{' '}
                  <a
                    href="/privacy"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a
                    href="/cookies"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Cookie Policy
                  </a>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
