'use client';

import { defaultLocale, formatDate, formatNumber, getLocale, isRTL, locales, t } from '@/lib/i18n';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [locale, setLocale] = useState(defaultLocale);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize locale from URL or browser
  useEffect(() => {
    const detectedLocale = getLocale(pathname);
    setLocale(detectedLocale);
    setIsLoading(false);

    // Update document direction for RTL languages
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL(detectedLocale) ? 'rtl' : 'ltr';
      document.documentElement.lang = detectedLocale;
    }
  }, [pathname]);

  // Change locale function
  const changeLocale = (newLocale) => {
    if (!locales.includes(newLocale)) return;

    setLocale(newLocale);

    // Update document direction and language
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL(newLocale) ? 'rtl' : 'ltr';
      document.documentElement.lang = newLocale;
    }

    // Store preference
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('preferred-locale', newLocale);
    }

    // Navigate to new locale path
    const currentPath = pathname.replace(/^\/[a-z]{2}/, '') || '/';
    const newPath = newLocale === defaultLocale ? currentPath : `/${newLocale}${currentPath}`;
    router.push(newPath);
  };

  // Translation function with current locale
  const translate = (key, params = {}) => {
    return t(key, locale, params);
  };

  // Format number with current locale
  const formatNum = (number) => {
    return formatNumber(number, locale);
  };

  // Format date with current locale
  const formatLocalDate = (date, options = {}) => {
    return formatDate(date, locale, options);
  };

  // Get available locales with names
  const getAvailableLocales = () => {
    const localeNames = {
      en: 'English',
      fr: 'Français',
      es: 'Español',
      de: 'Deutsch',
      ar: 'العربية',
    };

    return locales.map((loc) => ({
      code: loc,
      name: localeNames[loc] || loc,
      isRTL: isRTL(loc),
      isCurrent: loc === locale,
    }));
  };

  const value = {
    locale,
    isRTL: isRTL(locale),
    isLoading,
    locales: getAvailableLocales(),
    changeLocale,
    t: translate,
    formatNumber: formatNum,
    formatDate: formatLocalDate,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Hook for translations only
export function useTranslation() {
  const { t } = useI18n();
  return { t };
}
