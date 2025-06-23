const path = require('path');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const i18nextFsBackend = require('i18next-fs-backend');
const config = require('./config');

/**
 * Initialize i18n configuration
 */
const initializeI18n = () => {
  i18next
    .use(i18nextFsBackend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
      // Backend configuration for loading translations
      backend: {
        loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
        addPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.missing.json'),
      },

      // Default language and fallback
      fallbackLng: 'en',
      preload: ['en', 'fr', 'de', 'es'],
      supportedLngs: ['en', 'fr', 'de', 'es'],

      // Namespace configuration
      defaultNS: 'common',
      ns: ['common', 'errors', 'validation', 'emails', 'blog'],

      // Detection options
      detection: {
        order: ['querystring', 'cookie', 'header'],
        lookupQuerystring: 'lang',
        lookupCookie: 'i18n',
        lookupHeader: 'accept-language',
        caches: ['cookie'],
      },

      // Performance and caching
      load: 'languageOnly',
      saveMissing: config.env === 'development',

      interpolation: {
        escapeValue: false, // React already safely escapes
      },
    });

  return i18next;
};

module.exports = {
  initializeI18n,
  i18nextMiddleware: i18nextMiddleware.handle.bind(i18nextMiddleware, i18next),
  i18next,
};
