module.exports = {
  extends: ['next/core-web-vitals'],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  globals: {
    localStorage: 'readonly',
    sessionStorage: 'readonly',
    window: 'readonly',
    document: 'readonly',
    navigator: 'readonly',
  },
  rules: {
    // Allow console in development
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    // Allow unused vars with underscore prefix
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Prefer const/let over var
    'prefer-const': 'error',
    'no-var': 'error',
    // React specific
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    // Next.js specific
    '@next/next/no-img-element': 'off',
  },
};
