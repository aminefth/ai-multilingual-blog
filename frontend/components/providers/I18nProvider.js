'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const I18nContext = createContext({});

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Supported languages
const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    dir: 'ltr',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    dir: 'ltr',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    dir: 'ltr',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl',
  },
};

// Translation keys and default values
const DEFAULT_TRANSLATIONS = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.blog': 'Blog',
    'nav.categories': 'Categories',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.search': 'Search',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.share': 'Share',
    'common.readMore': 'Read More',
    'common.showLess': 'Show Less',
    'common.subscribe': 'Subscribe',
    'common.unsubscribe': 'Unsubscribe',

    // Homepage
    'home.hero.title': 'Discover the Best AI Tools',
    'home.hero.subtitle': 'Expert reviews, tutorials, and insights on 500+ AI tools',
    'home.hero.cta': 'Explore AI Tools',
    'home.featured.title': 'Featured Reviews',
    'home.categories.title': 'Browse Categories',
    'home.newsletter.title': 'Stay Updated',
    'home.newsletter.subtitle': 'Get weekly AI tool recommendations',

    // Blog
    'blog.readingTime': 'min read',
    'blog.publishedOn': 'Published on',
    'blog.updatedOn': 'Updated on',
    'blog.author': 'By',
    'blog.tags': 'Tags',
    'blog.category': 'Category',
    'blog.relatedPosts': 'Related Posts',
    'blog.sharePost': 'Share this post',

    // Search
    'search.placeholder': 'Search AI tools, reviews...',
    'search.results': 'Search Results',
    'search.noResults': 'No results found',
    'search.suggestions': 'Suggestions',

    // Authentication
    'auth.login.title': 'Welcome Back',
    'auth.register.title': 'Create Account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.name': 'Full Name',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.rememberMe': 'Remember me',
    'auth.loginButton': 'Sign In',
    'auth.registerButton': 'Create Account',

    // Footer
    'footer.description': 'Your trusted source for AI tool reviews and insights',
    'footer.quickLinks': 'Quick Links',
    'footer.categories': 'Categories',
    'footer.legal': 'Legal',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.cookies': 'Cookie Policy',
    'footer.contact': 'Contact Us',
    'footer.newsletter': 'Newsletter',
    'footer.social': 'Follow Us',
    'footer.copyright': '© 2025 AI Tools Blog. All rights reserved.',
  },
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.blog': 'Blog',
    'nav.categories': 'Catégories',
    'nav.about': 'À propos',
    'nav.contact': 'Contact',
    'nav.search': 'Rechercher',
    'nav.login': 'Connexion',
    'nav.register': "S'inscrire",
    'nav.dashboard': 'Tableau de bord',
    'nav.profile': 'Profil',
    'nav.logout': 'Déconnexion',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.view': 'Voir',
    'common.share': 'Partager',
    'common.readMore': 'Lire plus',
    'common.showLess': 'Voir moins',
    'common.subscribe': "S'abonner",
    'common.unsubscribe': 'Se désabonner',

    // Homepage
    'home.hero.title': 'Découvrez les Meilleurs Outils IA',
    'home.hero.subtitle': "Avis d'experts, tutoriels et insights sur 500+ outils IA",
    'home.hero.cta': 'Explorer les Outils IA',
    'home.featured.title': 'Avis en Vedette',
    'home.categories.title': 'Parcourir les Catégories',
    'home.newsletter.title': 'Restez Informé',
    'home.newsletter.subtitle': "Recevez des recommandations d'outils IA chaque semaine",

    // Blog
    'blog.readingTime': 'min de lecture',
    'blog.publishedOn': 'Publié le',
    'blog.updatedOn': 'Mis à jour le',
    'blog.author': 'Par',
    'blog.tags': 'Tags',
    'blog.category': 'Catégorie',
    'blog.relatedPosts': 'Articles Similaires',
    'blog.sharePost': 'Partager cet article',

    // Search
    'search.placeholder': 'Rechercher des outils IA, avis...',
    'search.results': 'Résultats de Recherche',
    'search.noResults': 'Aucun résultat trouvé',
    'search.suggestions': 'Suggestions',

    // Authentication
    'auth.login.title': 'Bon Retour',
    'auth.register.title': 'Créer un Compte',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.confirmPassword': 'Confirmer le mot de passe',
    'auth.name': 'Nom complet',
    'auth.forgotPassword': 'Mot de passe oublié ?',
    'auth.rememberMe': 'Se souvenir de moi',
    'auth.loginButton': 'Se connecter',
    'auth.registerButton': 'Créer un compte',

    // Footer
    'footer.description': "Votre source de confiance pour les avis d'outils IA",
    'footer.quickLinks': 'Liens Rapides',
    'footer.categories': 'Catégories',
    'footer.legal': 'Légal',
    'footer.privacy': 'Politique de Confidentialité',
    'footer.terms': "Conditions d'Utilisation",
    'footer.cookies': 'Politique des Cookies',
    'footer.contact': 'Nous Contacter',
    'footer.newsletter': 'Newsletter',
    'footer.social': 'Nous Suivre',
    'footer.copyright': '© 2025 AI Tools Blog. Tous droits réservés.',
  },
  // Add more languages as needed...
};

export function I18nProvider({ children, locale = 'en' }) {
  const [currentLocale, setCurrentLocale] = useState(locale);
  const [translations, setTranslations] = useState(
    DEFAULT_TRANSLATIONS[locale] || DEFAULT_TRANSLATIONS.en,
  );
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load translations for current locale
  useEffect(() => {
    const loadTranslations = async () => {
      if (DEFAULT_TRANSLATIONS[currentLocale]) {
        setTranslations(DEFAULT_TRANSLATIONS[currentLocale]);
        return;
      }

      setIsLoading(true);
      try {
        // Try to load translations from API or static files
        const response = await fetch(`/api/translations/${currentLocale}`);
        if (response.ok) {
          const data = await response.json();
          setTranslations(data);
        } else {
          // Fallback to English
          setTranslations(DEFAULT_TRANSLATIONS.en);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
        setTranslations(DEFAULT_TRANSLATIONS.en);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [currentLocale]);

  // Update document direction for RTL languages
  useEffect(() => {
    const language = LANGUAGES[currentLocale];
    if (language && typeof document !== 'undefined') {
      document.documentElement.dir = language.dir;
      document.documentElement.lang = language.code;
    }
  }, [currentLocale]);

  const t = (key, params = {}) => {
    let translation = translations[key] || key;

    // Replace parameters in translation
    Object.keys(params).forEach((param) => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });

    return translation;
  };

  const changeLanguage = (newLocale) => {
    if (LANGUAGES[newLocale]) {
      setCurrentLocale(newLocale);

      // Update URL if needed
      const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
      router.push(newPath);

      // Store preference
      localStorage.setItem('preferred-language', newLocale);
    }
  };

  const formatDate = (date, options = {}) => {
    const dateObj = new Date(date);
    const language = LANGUAGES[currentLocale];

    return dateObj.toLocaleDateString(language.code, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    });
  };

  const formatNumber = (number, options = {}) => {
    const language = LANGUAGES[currentLocale];
    return new Intl.NumberFormat(language.code, options).format(number);
  };

  const formatCurrency = (amount, currency = 'USD') => {
    const language = LANGUAGES[currentLocale];
    return new Intl.NumberFormat(language.code, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getLanguageInfo = (langCode = currentLocale) => {
    return LANGUAGES[langCode] || LANGUAGES.en;
  };

  const getAllLanguages = () => {
    return Object.values(LANGUAGES);
  };

  const isRTL = () => {
    const language = LANGUAGES[currentLocale];
    return language?.dir === 'rtl';
  };

  const value = {
    locale: currentLocale,
    translations,
    isLoading,
    t,
    changeLanguage,
    formatDate,
    formatNumber,
    formatCurrency,
    getLanguageInfo,
    getAllLanguages,
    isRTL,
    languages: LANGUAGES,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
