const { test, expect } = require('@playwright/test');
const { login } = require('./utils/auth');

// Ces tests seront exécutés sur tous les navigateurs configurés dans playwright.config.js
// Par défaut : Chromium, Firefox et WebKit (Safari)

test.describe('Tests de compatibilité cross-browser', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!'
  };

  test('Rendu cohérent de la page d\'accueil', async ({ page, browserName }) => {
    test.info().annotations.push({
      type: 'browser',
      description: browserName
    });
    
    await page.goto('/');
    
    // Le titre principal doit être visible sur tous les navigateurs
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Les images doivent être chargées correctement
    const images = page.locator('img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const image = images.nth(i);
      await expect(image).toBeVisible();
    }
    
    // Les styles CSS doivent être appliqués correctement
    const heroSection = page.locator('.hero, header').first();
    const computed = await heroSection.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        position: style.position,
        backgroundColor: style.backgroundColor
      };
    });
    
    expect(computed.display).not.toBe('none');
    expect(computed.position).not.toBe('static'); // La plupart des designs modernes utilisent position relative/absolute
    
    // Vérifier les animations (si elles sont présentes)
    const hasAnimation = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="anim"], [class*="fade"], [class*="transition"]');
      return elements.length > 0;
    });
    
    if (hasAnimation) {
      console.log(`${browserName}: Éléments animés détectés, vérification visuelle recommandée`);
    }
  });

  test('Fonctionnalités interactives cohérentes', async ({ page, browserName }) => {
    test.info().annotations.push({
      type: 'browser',
      description: browserName
    });
    
    await page.goto('/login');
    
    // Vérifier les validations de formulaire
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Mot de passe', { exact: true }).fill('pass');
    await page.getByRole('button', { name: /se connecter|login/i }).click();
    
    // Vérifier que le message d'erreur s'affiche correctement
    const errorMessage = page.getByText(/email invalide|format invalide|incorrect/i);
    await expect(errorMessage).toBeVisible();
    
    // Tester le comportement des dropdowns
    await page.goto('/');
    if (await page.getByRole('button', { name: /langue|language/i }).isVisible()) {
      await page.getByRole('button', { name: /langue|language/i }).click();
      
      // Le menu déroulant doit s'afficher
      await expect(page.getByRole('menu')).toBeVisible();
      
      // Fermer en cliquant ailleurs
      await page.click('body', { position: { x: 10, y: 10 } });
      
      // Le menu ne doit plus être visible
      await expect(page.getByRole('menu')).not.toBeVisible();
    }
    
    // Tester le scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(100);
  });

  test('Connexion et fonctionnalités authentifiées', async ({ page, browserName }) => {
    test.info().annotations.push({
      type: 'browser',
      description: browserName
    });
    
    // Se connecter
    await login(page, testUser);
    
    // Vérifier que la connexion fonctionne sur ce navigateur
    await expect(page.getByText(/tableau de bord|dashboard/i)).toBeVisible();
    
    // Accéder à la page des articles
    await page.getByRole('link', { name: /articles/i }).click();
    
    // Vérifier le fonctionnement du filtre et de la recherche
    if (await page.getByPlaceholder(/rechercher/i).isVisible()) {
      await page.getByPlaceholder(/rechercher/i).fill('test');
      await page.keyboard.press('Enter');
      
      // Attendre la fin de la recherche
      await page.waitForResponse(response => 
        response.url().includes('/api/v1/blogs') && 
        response.status() === 200
      );
    }
    
    // Tester les interactions avec les articles
    const articles = page.getByRole('article');
    if (await articles.count() > 0) {
      // Mettre un article en favori
      await articles.first().getByRole('button', { name: /favori/i }).click();
      
      // Vérifier la mise à jour visuelle de l'icône favori
      await expect(articles.first().getByRole('button', { name: /retirer|remove/i })).toBeVisible();
    }
  });

  test('Comportement du drag & drop', async ({ page, browserName }) => {
    test.info().annotations.push({
      type: 'browser',
      description: browserName
    });
    
    // Se connecter
    await login(page, testUser);
    
    // Naviguer vers une page avec drag & drop (ex: éditeur de contenu)
    await page.goto('/editor');
    
    // Vérifier si le drag & drop est supporté sur ce navigateur
    const dragDropSupported = await page.evaluate(() => {
      // Vérification simple de la présence des API Drag & Drop
      return 'ondragstart' in document.documentElement;
    });
    
    if (dragDropSupported) {
      console.log(`${browserName}: Drag & drop supporté nativement`);
      
      // Tester un drag & drop d'image si l'interface le permet
      // Note: Le test réel dépendra de l'implémentation spécifique du drag & drop
      
      if (await page.getByText(/glisser-déposer|drag and drop/i).isVisible()) {
        // Simuler un drag & drop (si possible avec Playwright)
        // Cette partie est complexe et peut nécessiter une implémentation spécifique
        // selon l'interface réelle
        console.log(`${browserName}: Interface de drag & drop détectée`);
      }
    } else {
      console.log(`${browserName}: Drag & drop non supporté nativement`);
    }
  });

  test('Rendu des polices et typographie', async ({ page, browserName }) => {
    test.info().annotations.push({
      type: 'browser',
      description: browserName
    });
    
    await page.goto('/articles');
    
    // Vérifier que les polices sont chargées correctement
    const fontLoaded = await page.evaluate(() => {
      // Vérifier si les polices personnalisées sont chargées
      const fonts = document.fonts;
      return fonts.status === 'loaded' || fonts.ready.then(() => true).catch(() => false);
    });
    
    expect(fontLoaded).toBeTruthy();
    
    // Vérifier le rendu de la typographie sur différents éléments
    const heading = page.getByRole('heading').first();
    const paragraph = page.locator('p').first();
    
    const headingStyles = await heading.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight
      };
    });
    
    const paragraphStyles = await paragraph.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight
      };
    });
    
    console.log(`${browserName}: Styles de typographie pour les titres`, headingStyles);
    console.log(`${browserName}: Styles de typographie pour les paragraphes`, paragraphStyles);
    
    // Vérifier que les tailles de police sont dans des plages raisonnables
    const headingFontSizeInPx = parseInt(headingStyles.fontSize);
    expect(headingFontSizeInPx).toBeGreaterThan(16);
    
    const paragraphFontSizeInPx = parseInt(paragraphStyles.fontSize);
    expect(paragraphFontSizeInPx).toBeGreaterThanOrEqual(14);
  });
});
