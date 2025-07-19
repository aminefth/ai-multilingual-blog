const { test, expect } = require('@playwright/test');
const { generateTestUser, register, login } = require('./utils/auth');
const { mockStripeCheckout, mockSuccessfulPayment } = require('./utils/stripe-mock');

test.describe('Parcours utilisateur complet', () => {
  const testUser = generateTestUser();
  
  test.beforeEach(async ({ page }) => {
    // Mock Stripe pour éviter les appels API réels pendant les tests
    await mockStripeCheckout(page);
  });

  test('Parcours complet : inscription → abonnement → lecture d\'articles', async ({ page }) => {
    // 1. Inscription
    test.step('Inscription au service', async () => {
      await register(page, testUser);
      
      // Vérifier la redirection vers la page de vérification email
      expect(page.url()).toContain('/verify-email');
      
      // Simuler la vérification de l'email (normalement impossible en E2E réel)
      // Dans un scénario réel, nous intercepterions l'email et utiliserions le lien
      await page.goto('/api/v1/auth/verify-email-mock?token=mocktoken&email=' + encodeURIComponent(testUser.email));
      await page.waitForURL('**/login');
    });
    
    // 2. Connexion
    test.step('Connexion au compte créé', async () => {
      await login(page, testUser);
      expect(page.url()).toContain('/dashboard');
    });
    
    // 3. Abonnement à un plan payant
    test.step('Souscription à un plan payant', async () => {
      // Activer le mock pour le webhook de paiement Stripe réussi
      await mockSuccessfulPayment(page);
      
      // Navigation vers la page des plans
      await page.goto('/pricing');
      
      // Sélection du plan Pro
      await page.getByRole('button', { name: /choisir pro/i }).click();
      
      // Validation du checkout (détournée par notre mock)
      await page.waitForURL('**/success');
      
      // Vérifier que nous sommes sur la page de succès
      await expect(page.getByText(/merci pour votre abonnement/i)).toBeVisible();
      
      // Vérifier le badge d'abonnement sur le dashboard
      await page.goto('/dashboard');
      await expect(page.getByText(/pro/i)).toBeVisible();
    });
    
    // 4. Lecture d'articles
    test.step('Lecture d\'articles et interactions', async () => {
      // Accès à la liste des articles
      await page.goto('/articles');
      
      // Sélection d'un article (le premier disponible)
      const firstArticle = page.getByRole('article').first();
      await firstArticle.click();
      
      // Vérifier que nous sommes sur la page de détail d'un article
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      
      // Laisser un commentaire
      const commentText = 'Voici mon commentaire de test!';
      await page.getByLabel('Commentaire').fill(commentText);
      await page.getByRole('button', { name: /publier/i }).click();
      
      // Vérifier que le commentaire est visible
      await expect(page.getByText(commentText)).toBeVisible();
      
      // Mettre en favori l'article
      await page.getByRole('button', { name: /favori/i }).click();
      
      // Vérifier que l'article est en favori (changement d'icône ou texte)
      await expect(page.getByRole('button', { name: /retirer des favoris/i })).toBeVisible();
    });
  });
});
