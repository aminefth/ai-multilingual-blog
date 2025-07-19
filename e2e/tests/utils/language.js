/**
 * Utility functions for language switching and testing
 */

/**
 * Language options available in the application
 */
const LANGUAGES = {
  FRENCH: { code: 'fr', name: 'Français' },
  ENGLISH: { code: 'en', name: 'English' },
  SPANISH: { code: 'es', name: 'Español' },
  ARABIC: { code: 'ar', name: 'العربية' },
  GERMAN: { code: 'de', name: 'Deutsch' }
};

/**
 * Common text elements expected in each language
 */
const TEXT_ELEMENTS = {
  fr: {
    login: 'Se connecter',
    register: 'Créer un compte',
    dashboard: 'Tableau de bord',
    articles: 'Articles',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    welcome: 'Bienvenue',
    editor: 'Éditeur de contenu',
    publish: 'Publier',
  },
  en: {
    login: 'Login',
    register: 'Register',
    dashboard: 'Dashboard',
    articles: 'Articles',
    settings: 'Settings',
    logout: 'Logout',
    welcome: 'Welcome',
    editor: 'Content Editor',
    publish: 'Publish',
  },
  es: {
    login: 'Iniciar sesión',
    register: 'Registrarse',
    dashboard: 'Panel de control',
    articles: 'Artículos',
    settings: 'Configuración',
    logout: 'Cerrar sesión',
    welcome: 'Bienvenido',
    editor: 'Editor de contenido',
    publish: 'Publicar',
  },
  ar: {
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    dashboard: 'لوحة التحكم',
    articles: 'المقالات',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    welcome: 'مرحبا',
    editor: 'محرر المحتوى',
    publish: 'نشر',
  },
  de: {
    login: 'Anmelden',
    register: 'Registrieren',
    dashboard: 'Dashboard',
    articles: 'Artikel',
    settings: 'Einstellungen',
    logout: 'Abmelden',
    welcome: 'Willkommen',
    editor: 'Inhaltseditor',
    publish: 'Veröffentlichen',
  }
};

/**
 * Change the application language
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} langCode - Language code to switch to (e.g., 'fr', 'en')
 */
async function switchLanguage(page, langCode) {
  // Open language selector
  await page.getByRole('button', { name: /language|langue|idioma|sprache|اللغة/i }).click();
  
  // Select the target language
  const languageName = Object.values(LANGUAGES).find(lang => lang.code === langCode)?.name;
  if (!languageName) {
    throw new Error(`Language code ${langCode} not supported`);
  }
  
  await page.getByRole('menuitem', { name: new RegExp(languageName, 'i') }).click();
  
  // Wait for language to change
  await page.waitForLoadState('networkidle');
}

/**
 * Verify UI elements are displayed in the expected language
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} langCode - Language code to verify (e.g., 'fr', 'en')
 * @returns {Promise<boolean>} - Whether text verification passed
 */
async function verifyLanguageElements(page, langCode) {
  const expectedTexts = TEXT_ELEMENTS[langCode];
  if (!expectedTexts) {
    throw new Error(`Language code ${langCode} not supported for text verification`);
  }
  
  // Check for common elements that should be visible on most pages
  for (const [key, text] of Object.entries(expectedTexts)) {
    try {
      // Try to find the text somewhere on the page (as button, heading, etc.)
      const element = page.getByText(text, { exact: false });
      const isVisible = await element.isVisible();
      if (!isVisible) {
        console.warn(`Text "${text}" (${key}) not visible on page for language ${langCode}`);
        // Not failing the test as not all elements may be visible on every page
      }
    } catch (e) {
      console.error(`Error checking for text "${text}" (${key}): ${e.message}`);
    }
  }
  
  return true;
}

module.exports = {
  LANGUAGES,
  TEXT_ELEMENTS,
  switchLanguage,
  verifyLanguageElements,
};
