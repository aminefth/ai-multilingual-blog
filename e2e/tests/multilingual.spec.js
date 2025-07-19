const { test, expect } = require('@playwright/test');
const { login } = require('./utils/auth');
const { LANGUAGES, switchLanguage, verifyLanguageElements } = require('./utils/language');

test.describe('Tests multilingues de l\'interface', () => {
  // Utilisateur de test pré-existant
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!'
  };

  test('Changement de langue et vérification des éléments d\'interface', async ({ page }) => {
    // Commencer par la page d'accueil
    await page.goto('/');

    // Tester chaque langue supportée
    for (const lang of Object.values(LANGUAGES)) {
      test.step(`Vérification de la langue : ${lang.name}`, async () => {
        // Changer la langue
        await switchLanguage(page, lang.code);
        
        // Vérifier que l'interface est bien dans la langue sélectionnée
        await verifyLanguageElements(page, lang.code);
        
        // Vérifier que l'attribut lang du document est correctement défini
        const htmlLang = await page.evaluate(() => document.documentElement.lang);
        expect(htmlLang).toBe(lang.code);
      });
    }
  });

  test('Persistance de la langue sélectionnée après connexion', async ({ page }) => {
    // Commencer en espagnol
    await page.goto('/');
    await switchLanguage(page, LANGUAGES.SPANISH.code);
    
    // Se connecter
    await login(page, testUser);
    
    // Vérifier que la langue est toujours espagnol
    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    expect(htmlLang).toBe(LANGUAGES.SPANISH.code);
    await verifyLanguageElements(page, LANGUAGES.SPANISH.code);
  });

  test('Contenu multilingue des articles', async ({ page }) => {
    // Connexion
    await page.goto('/');
    await login(page, testUser);
    
    // Accéder à un article
    await page.goto('/articles');
    await page.getByRole('article').first().click();
    
    // Capturer le titre initial
    const initialTitle = await page.getByRole('heading', { level: 1 }).textContent();
    
    // Changer la langue et vérifier que le contenu est traduit
    await switchLanguage(page, LANGUAGES.FRENCH.code);
    
    // Attendre que la traduction soit chargée
    await page.waitForResponse(response => 
      response.url().includes('/api/v1/translations') && response.status() === 200
    );
    
    // Vérifier que le titre a changé (a été traduit)
    const translatedTitle = await page.getByRole('heading', { level: 1 }).textContent();
    expect(translatedTitle).not.toBe(initialTitle);
  });

  test('Formulaires avec validation multilingue', async ({ page }) => {
    await page.goto('/register');
    
    // Test en français
    await switchLanguage(page, LANGUAGES.FRENCH.code);
    
    // Soumettre un formulaire vide pour déclencher des validations
    await page.getByRole('button', { name: /créer un compte/i }).click();
    
    // Vérifier que les messages d'erreur sont en français
    await expect(page.getByText(/ce champ est obligatoire/i)).toBeVisible();
    
    // Changer en anglais
    await switchLanguage(page, LANGUAGES.ENGLISH.code);
    
    // Soumettre à nouveau pour voir les messages en anglais
    await page.getByRole('button', { name: /register/i }).click();
    
    // Vérifier que les messages d'erreur sont en anglais
    await expect(page.getByText(/this field is required/i)).toBeVisible();
  });

  test('RTL Support pour l\'arabe', async ({ page }) => {
    await page.goto('/');
    
    // Changer en arabe
    await switchLanguage(page, LANGUAGES.ARABIC.code);
    
    // Vérifier que la direction du document est RTL
    const direction = await page.evaluate(() => document.documentElement.dir);
    expect(direction).toBe('rtl');
    
    // Vérifier que le menu est aligné à droite
    const menu = page.getByRole('navigation').first();
    const menuBox = await menu.boundingBox();
    const pageWidth = await page.evaluate(() => window.innerWidth);
    
    // Dans un layout RTL, le menu devrait être plus proche du bord droit
    expect(pageWidth - (menuBox.x + menuBox.width)).toBeLessThan(menuBox.x);
  });
});
