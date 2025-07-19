const { test, expect } = require('@playwright/test');
const { login } = require('./utils/auth');
const { fillStripePaymentForm } = require('./utils/stripe-mock');

test.describe('Tests du tunnel de paiement Stripe', () => {
  // Utilisateur existant avec compte gratuit
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!'
  };

  test.beforeEach(async ({ page }) => {
    // Se connecter avant chaque test
    await login(page, testUser);
  });

  test('Souscription à un abonnement Pro avec succès', async ({ page }) => {
    // Remplacer les requêtes réelles Stripe par nos mocks
    await page.route('https://js.stripe.com/*', route => {
      // Laisser passer les ressources JS de Stripe mais intercepter les appels API
      if (route.request().resourceType() === 'script') {
        return route.continue();
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Simuler un retour réussi du webhook Stripe
    await page.route('/api/v1/webhooks/stripe', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          subscription: { 
            id: 'sub_123',
            status: 'active',
            plan: { nickname: 'Pro' }
          }
        }),
      });
    });

    // Accéder à la page des prix
    await page.goto('/pricing');
    
    // Sélectionner le plan Pro
    await page.getByRole('button', { name: /choisir pro/i }).click();
    
    // Remplir le formulaire de paiement dans l'iframe Stripe
    await fillStripePaymentForm(page);
    
    // Attendre la confirmation de paiement
    await page.waitForURL('**/subscription/success');
    
    // Vérifier que la page de succès est affichée
    await expect(page.getByText(/merci pour votre abonnement/i)).toBeVisible();
    
    // Vérifier que le profil utilisateur a été mis à jour avec le plan Pro
    await page.goto('/profile');
    await expect(page.getByText(/plan pro/i)).toBeVisible();
  });

  test('Gestion des erreurs de carte bancaire', async ({ page }) => {
    // Accéder à la page des prix
    await page.goto('/pricing');
    
    // Sélectionner le plan Pro
    await page.getByRole('button', { name: /choisir pro/i }).click();
    
    // Intercepter l'iframe Stripe et simuler une carte refusée
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
    
    // Remplir avec un numéro de carte qui échoue toujours (Stripe test card)
    await stripeFrame.locator('[placeholder="Card number"]').fill('4000 0000 0000 0002');
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/30');
    await stripeFrame.locator('[placeholder="CVC"]').fill('123');
    await stripeFrame.locator('[placeholder="ZIP"]').fill('12345');
    
    // Soumettre le paiement
    await page.getByRole('button', { name: /pay|subscribe|confirm/i }).click();
    
    // Vérifier que l'erreur est affichée
    await expect(page.getByText(/votre carte a été refusée/i)).toBeVisible();
  });

  test('Changement de plan d\'abonnement', async ({ page }) => {
    // D'abord s'assurer que l'utilisateur a un plan actif
    await page.goto('/profile');
    
    // Si l'utilisateur n'a pas d'abonnement, on en souscrit un
    if (await page.getByText(/plan gratuit/i).isVisible()) {
      await page.goto('/pricing');
      await page.getByRole('button', { name: /choisir basic/i }).click();
      await fillStripePaymentForm(page);
      await page.waitForURL('**/subscription/success');
    }
    
    // Accéder à la gestion des abonnements
    await page.goto('/settings/subscription');
    
    // Upgrader vers le plan Pro
    await page.getByRole('button', { name: /upgrader/i }).click();
    await page.getByText(/plan pro/i).click();
    
    // Confirmer le changement
    await page.getByRole('button', { name: /confirmer/i }).click();
    
    // En cas de différence de prix, compléter le paiement
    if (await page.getByText(/compléter le paiement/i).isVisible()) {
      await fillStripePaymentForm(page);
    }
    
    // Vérifier que le changement de plan a été effectué
    await expect(page.getByText(/votre plan a été mis à jour/i)).toBeVisible();
    
    // Vérifier dans le profil
    await page.goto('/profile');
    await expect(page.getByText(/plan pro/i)).toBeVisible();
  });

  test('Annulation d\'abonnement', async ({ page }) => {
    // Accéder à la gestion des abonnements
    await page.goto('/settings/subscription');
    
    // Cliquer sur annuler l'abonnement
    await page.getByRole('button', { name: /annuler/i }).click();
    
    // Confirmer l'annulation
    await page.getByRole('button', { name: /confirmer l'annulation/i }).click();
    
    // Vérifier que l'annulation est confirmée
    await expect(page.getByText(/abonnement annulé/i)).toBeVisible();
    
    // Vérifier que la date de fin est affichée
    await expect(page.getByText(/votre abonnement prendra fin le/i)).toBeVisible();
  });

  test('Application d\'un code promotionnel', async ({ page }) => {
    // Accéder à la page des prix
    await page.goto('/pricing');
    
    // Sélectionner le plan Pro
    await page.getByRole('button', { name: /choisir pro/i }).click();
    
    // Appliquer un code promotionnel
    await page.getByText(/code promo/i).click();
    await page.getByPlaceholder(/code promo/i).fill('TESTPROMO');
    await page.getByRole('button', { name: /appliquer/i }).click();
    
    // Vérifier que la réduction est appliquée
    await expect(page.getByText(/réduction appliquée/i)).toBeVisible();
    
    // Vérifier que le prix affiché est réduit
    const originalPrice = 19.99; // Prix supposé du plan Pro
    const discountedPrice = 15.99; // Prix avec la réduction
    
    await expect(page.getByText(new RegExp(`${discountedPrice}`, 'i'))).toBeVisible();
  });
});
