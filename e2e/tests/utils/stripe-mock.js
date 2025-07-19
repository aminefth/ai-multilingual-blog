/**
 * Utility functions for mocking Stripe in E2E tests
 */

/**
 * Mock the Stripe checkout process
 * @param {import('@playwright/test').Page} page - Playwright page
 */
async function mockStripeCheckout(page) {
  // Intercept Stripe Checkout redirect and mock it
  await page.route('**/checkout/sessions/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Mock Stripe.js to avoid actual API calls
  await page.addInitScript(() => {
    window.Stripe = () => ({
      redirectToCheckout: async () => ({ error: null }),
      elements: () => ({
        create: () => ({
          mount: () => {},
          on: () => {},
        }),
      }),
    });
  });
}

/**
 * Mock successful payment in Stripe
 * @param {import('@playwright/test').Page} page - Playwright page
 */
async function mockSuccessfulPayment(page) {
  await page.route('**/api/v1/subscriptions/webhook', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        subscription: {
          id: 'sub_mock123',
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          plan: {
            nickname: 'Pro',
          },
        },
      }),
    });
  });
}

/**
 * Fill in payment details in the Stripe form
 * @param {import('@playwright/test').Page} page - Playwright page
 */
async function fillStripePaymentForm(page) {
  // Assuming we're on the Stripe payment page or iframe
  // Switch to the Stripe iframe if needed
  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
  
  // Fill card details
  await stripeFrame.locator('[placeholder="Card number"]').fill('4242 4242 4242 4242');
  await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/30');
  await stripeFrame.locator('[placeholder="CVC"]').fill('123');
  await stripeFrame.locator('[placeholder="ZIP"]').fill('12345');
  
  // Submit payment
  await page.getByRole('button', { name: /pay|subscribe|confirm/i }).click();
}

module.exports = {
  mockStripeCheckout,
  mockSuccessfulPayment,
  fillStripePaymentForm,
};
