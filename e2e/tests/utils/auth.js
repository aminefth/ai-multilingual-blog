/**
 * Utility functions for authentication
 */

/**
 * Login to the application
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} user - User credentials
 * @param {string} user.email - User email
 * @param {string} user.password - User password
 */
async function login(page, user) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  // Wait for navigation to complete after login
  await page.waitForURL('**/dashboard');
}

/**
 * Register a new user account
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} user - User information
 * @param {string} user.name - User full name
 * @param {string} user.email - User email
 * @param {string} user.password - User password
 */
async function register(page, user) {
  await page.goto('/register');
  await page.getByLabel('Nom complet').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(user.password);
  await page.getByLabel('Confirmer le mot de passe').fill(user.password);
  await page.getByRole('checkbox', { name: /j'accepte les conditions/i }).check();
  await page.getByRole('button', { name: /créer un compte/i }).click();
  
  // Wait for registration to complete and redirect to verification page
  await page.waitForURL('**/verify-email');
}

/**
 * Logout from the application
 * @param {import('@playwright/test').Page} page - Playwright page
 */
async function logout(page) {
  await page.getByRole('button', { name: /profil/i }).click();
  await page.getByRole('menuitem', { name: /déconnexion/i }).click();
  // Wait for logout to complete and redirect to home page
  await page.waitForURL('**/');
}

/**
 * Generate unique test user data
 * @returns {Object} User credentials
 */
function generateTestUser() {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `testuser${timestamp}@example.com`,
    password: `Password123!${timestamp}`,
  };
}

module.exports = {
  login,
  register,
  logout,
  generateTestUser,
};
