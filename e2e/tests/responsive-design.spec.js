const { test, expect, devices } = require('@playwright/test');
const { login } = require('./utils/auth');

// Définir les appareils mobiles pour les tests
const mobileDevices = [
  { name: 'Pixel 5', ...devices['Pixel 5'] },
  { name: 'iPhone 12', ...devices['iPhone 12'] },
  { name: 'iPad Mini', ...devices['iPad Mini'] },
  { name: 'Galaxy S8', ...devices['Galaxy S8'] },
];

// Tailles d'écran pour les tests responsive
const screenSizes = [
  { width: 375, height: 667, name: 'Mobile' },
  { width: 768, height: 1024, name: 'Tablet' },
  { width: 1280, height: 800, name: 'Desktop' },
  { width: 1920, height: 1080, name: 'Large Desktop' },
];

test.describe('Tests de responsivité', () => {
  // Utilisateur standard
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!'
  };

  // Tests sur différents appareils mobiles
  for (const device of mobileDevices) {
    test(`Page d'accueil sur ${device.name}`, async ({ page }) => {
      // Configurer l'émulation de l'appareil
      await page.emulate(device);
      
      // Visiter la page d'accueil
      await page.goto('/');
      
      // Vérifier que le menu hamburger est présent sur mobile
      await expect(page.getByRole('button', { name: /menu|hamburger/i })).toBeVisible();
      
      // Ouvrir le menu et vérifier que les éléments sont accessibles
      await page.getByRole('button', { name: /menu|hamburger/i }).click();
      await expect(page.getByRole('link', { name: /articles/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /connexion|login/i })).toBeVisible();
      
      // Vérifier que les cartes d'articles sont bien affichées en format mobile
      const articleCards = page.getByRole('article');
      await expect(articleCards.first()).toBeVisible();
      
      // Vérifier l'adaptabilité des images
      const heroImage = page.locator('img').first();
      const imageBox = await heroImage.boundingBox();
      // Sur mobile, l'image ne doit pas dépasser la largeur de l'écran
      expect(imageBox.width).toBeLessThanOrEqual(device.viewport.width);
    });
  }

  // Tests de l'interface responsive à différentes tailles d'écran
  for (const size of screenSizes) {
    test(`Adaptabilité du dashboard à la taille ${size.name}`, async ({ page }) => {
      // Définir la taille de la viewport
      await page.setViewportSize({ width: size.width, height: size.height });
      
      // Connexion à l'application
      await login(page, testUser);
      
      // Accéder au dashboard
      await page.goto('/dashboard');
      
      // Prendre une capture d'écran pour la régression visuelle
      await page.screenshot({ path: `screenshots/dashboard-${size.name}.png` });
      
      // Vérifier l'organisation des widgets en fonction de la taille d'écran
      const dashboardGrid = page.locator('.dashboard-grid, .dashboard-container');
      
      if (size.width < 768) {
        // Sur mobile, les widgets devraient être empilés
        const gridStyle = await dashboardGrid.evaluate((el) => {
          return window.getComputedStyle(el).getPropertyValue('grid-template-columns') || 
                 window.getComputedStyle(el).getPropertyValue('flex-direction');
        });
        
        // Sur mobile, soit nous avons 1 colonne, soit les éléments sont empilés verticalement
        expect(gridStyle).toMatch(/1fr|column/);
      } else if (size.width >= 1280) {
        // Sur desktop, on s'attend à un affichage sur plusieurs colonnes
        const gridStyle = await dashboardGrid.evaluate((el) => {
          return window.getComputedStyle(el).getPropertyValue('grid-template-columns') || 
                 window.getComputedStyle(el).getPropertyValue('display');
        });
        
        // Sur desktop, nous devrions avoir un grid avec plusieurs colonnes ou un affichage flex
        expect(gridStyle).toMatch(/repeat|1fr 1fr|flex/);
      }
      
      // Vérifier que les graphiques s'adaptent à la taille de l'écran
      const chart = page.locator('canvas, .recharts-surface').first();
      if (await chart.isVisible()) {
        const chartBox = await chart.boundingBox();
        // Le graphique ne doit pas dépasser la largeur du viewport
        expect(chartBox.width).toBeLessThanOrEqual(size.width - 40); // Marge de 40px
      }
    });
  }

  test('Navigation mobile dans l\'éditeur de contenu', async ({ page }) => {
    // Configurer pour mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Connexion
    await login(page, testUser);
    
    // Accéder à l'éditeur
    await page.goto('/editor');
    
    // Vérifier que l'interface d'édition est adaptée au mobile
    const editor = page.frameLocator('.trix-editor, .ProseMirror, .ck-editor__editable, [contenteditable="true"]').first();
    
    // L'éditeur doit être visible
    await expect(editor).toBeVisible();
    
    // Vérifier que la barre d'outils s'adapte en mode compact sur mobile
    const toolbarButtons = page.locator('.editor-toolbar button, .trix-button-group button');
    
    // Sur mobile, la barre d'outils peut être soit compacte soit dans un menu déroulant
    if (await toolbarButtons.count() > 0) {
      // Si les boutons sont visibles directement
      const firstButtonBox = await toolbarButtons.first().boundingBox();
      expect(firstButtonBox.width).toBeLessThanOrEqual(50); // Taille compacte des boutons
    } else {
      // Ou vérifier si un bouton de menu pour accéder aux options est présent
      await expect(page.getByRole('button', { name: /plus|options|menu/i })).toBeVisible();
    }
    
    // Vérifier la possibilité de zoomer sur l'éditeur pour une meilleure précision
    await editor.tap();
    await page.mouse.wheel(0, 100); // Scroll vers le bas pour vérifier le comportement
    
    // Vérifier que le clavier mobile apparaît correctement
    await editor.tap();
    await page.keyboard.type('Test sur mobile');
    
    // Vérifier que le texte est bien inséré
    const editorContent = await editor.textContent();
    expect(editorContent).toContain('Test sur mobile');
  });
});

// Tests spécifiques de régression visuelle
test.describe('Tests de régression visuelle', () => {
  test('Comparaison visuelle de la page d\'accueil', async ({ page }) => {
    await page.goto('/');
    
    // Capturer l'écran pour une comparaison visuelle
    // Utilise l'option compareScreenshot du plugin Playwright de comparaison visuelle
    await expect(page).toHaveScreenshot('home-page.png', {
      maxDiffPixels: 100,
    });
  });
  
  test('Comparaison visuelle du formulaire de connexion', async ({ page }) => {
    await page.goto('/login');
    
    // Capturer l'écran pour une comparaison visuelle
    await expect(page).toHaveScreenshot('login-form.png', {
      maxDiffPixels: 100,
    });
  });
  
  test('Comparaison visuelle du thème sombre', async ({ page }) => {
    await page.goto('/');
    
    // Activer le thème sombre
    await page.getByRole('button', { name: /thème|theme|mode/i }).click();
    await page.getByText(/sombre|dark/i).click();
    
    // Vérifier que le thème sombre est appliqué
    const isDarkMode = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') || 
             document.body.classList.contains('dark') ||
             getComputedStyle(document.body).backgroundColor.match(/rgba?\((\d+), (\d+), (\d+)/)[1] < 50;
    });
    
    expect(isDarkMode).toBeTruthy();
    
    // Capturer l'écran pour une comparaison visuelle
    await expect(page).toHaveScreenshot('home-page-dark.png', {
      maxDiffPixels: 100,
    });
  });
});
