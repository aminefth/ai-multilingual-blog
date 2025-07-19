const { test, expect } = require('@playwright/test');
const { login } = require('./utils/auth');
const path = require('path');

test.describe('Tests de l\'éditeur de contenu', () => {
  // Utilisateur avec droits d'auteur
  const authorUser = {
    email: 'author@example.com',
    password: 'Password123!'
  };

  test.beforeEach(async ({ page }) => {
    // Se connecter avant chaque test
    await login(page, authorUser);
    // Naviguer vers l'éditeur de contenu
    await page.goto('/editor');
  });

  test('Création d\'un nouvel article avec formatage riche', async ({ page }) => {
    // Donner un titre à l'article
    await page.getByLabel('Titre').fill('Test de l\'éditeur de contenu riche');
    
    // Remplir la description
    await page.getByLabel('Description').fill('Ceci est un test automatisé de l\'éditeur WYSIWYG');
    
    // Accéder à l'éditeur de contenu principal (TinyMCE, CKEditor, ou autre)
    const editor = page.frameLocator('.trix-editor, .ProseMirror, .ck-editor__editable, [contenteditable="true"]').first();
    
    // Écrire du contenu simple
    await editor.click();
    await page.keyboard.type('Ceci est un paragraphe de test.');
    
    // Ajouter un formatage gras
    await page.keyboard.press('Control+a'); // Sélectionner tout
    await page.keyboard.press('Control+b'); // Mettre en gras
    
    // Ajouter un sous-titre
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Sous-titre de démonstration');
    
    // Sélectionner le texte pour le transformer en titre
    await page.keyboard.press('Control+a');
    
    // Utiliser le menu de formatage pour le transformer en titre H2
    await page.getByRole('button', { name: /format/i }).click();
    await page.getByRole('menuitem', { name: /titre 2|heading 2/i }).click();
    
    // Ajouter une liste à puces
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- Premier élément');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- Second élément');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- Troisième élément');
    
    // Ajouter une image
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    
    // Cliquer sur le bouton d'insertion d'image
    await page.getByRole('button', { name: /image/i }).click();
    
    // Upload d'une image (peut nécessiter d'adapter selon l'implémentation réelle)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText(/upload|télécharger/i).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../fixtures/test-image.jpg'));
    
    // Attendre que l'image soit chargée
    await page.waitForSelector('img[src*="blob:"]');
    
    // Sélectionner des tags
    await page.getByLabel(/tags/i).click();
    await page.getByRole('option', { name: /technologie/i }).click();
    await page.getByRole('option', { name: /ia/i }).click();
    await page.press('body', 'Escape'); // Fermer le sélecteur
    
    // Prévisualiser l'article
    await page.getByRole('button', { name: /prévisualiser/i }).click();
    
    // Vérifier que la prévisualisation contient le contenu
    const previewFrame = page.frameLocator('.preview-frame').first();
    await expect(previewFrame.getByRole('heading', { name: /test de l'éditeur/i })).toBeVisible();
    await expect(previewFrame.getByRole('img')).toBeVisible();
    
    // Fermer la prévisualisation
    await page.getByRole('button', { name: /fermer|close/i }).click();
    
    // Publier l'article
    await page.getByRole('button', { name: /publier/i }).click();
    
    // Confirmer la publication
    await page.getByRole('button', { name: /confirmer/i }).click();
    
    // Vérifier que l'article est publié avec succès
    await expect(page.getByText(/article publié avec succès/i)).toBeVisible();
  });

  test('Traduction automatique d\'un article', async ({ page }) => {
    // Créer d'abord un article simple
    await page.getByLabel('Titre').fill('Article à traduire automatiquement');
    await page.getByLabel('Description').fill('Ceci est un article test pour la traduction');
    
    const editor = page.frameLocator('.trix-editor, .ProseMirror, .ck-editor__editable, [contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('Contenu de test en français qui devra être traduit automatiquement vers plusieurs langues.');
    
    // Sélectionner la langue source
    await page.getByLabel(/langue source/i).selectOption('fr');
    
    // Publier l'article
    await page.getByRole('button', { name: /publier/i }).click();
    await page.getByRole('button', { name: /confirmer/i }).click();
    
    // Attendre la confirmation de publication
    await expect(page.getByText(/article publié avec succès/i)).toBeVisible();
    
    // Ouvrir les options de traduction
    await page.goto('/my-articles');
    await page.getByRole('row', { name: /article à traduire/i }).getByRole('button', { name: /options/i }).click();
    await page.getByRole('menuitem', { name: /traduire/i }).click();
    
    // Sélectionner les langues cibles
    await page.getByLabel(/langues cibles/i).selectOption(['en', 'es', 'de']);
    
    // Lancer la traduction
    await page.getByRole('button', { name: /traduire/i }).click();
    
    // Attendre que la traduction se termine
    await expect(page.getByText(/traduction terminée/i)).toBeVisible({ timeout: 20000 });
    
    // Vérifier que les indicateurs de traduction sont présents
    await page.goto('/my-articles');
    const articleRow = page.getByRole('row', { name: /article à traduire/i });
    await expect(articleRow.getByText(/fr, en, es, de/i)).toBeVisible();
  });

  test('Importation de contenu depuis un fichier Markdown', async ({ page }) => {
    // Cliquer sur le bouton importer
    await page.getByRole('button', { name: /importer/i }).click();
    
    // Sélectionner l'import Markdown
    await page.getByRole('menuitem', { name: /markdown/i }).click();
    
    // Upload du fichier Markdown
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText(/choisir un fichier/i).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, '../fixtures/test-article.md'));
    
    // Attendre l'import
    await expect(page.getByText(/import réussi/i)).toBeVisible();
    
    // Vérifier que le contenu a été importé
    await expect(page.getByLabel('Titre')).not.toBeEmpty();
    
    const editor = page.frameLocator('.trix-editor, .ProseMirror, .ck-editor__editable, [contenteditable="true"]').first();
    const editorContent = await editor.textContent();
    expect(editorContent.length).toBeGreaterThan(0);
    
    // Vérifier que le formatage Markdown a été converti
    await expect(editor.locator('h1, h2, h3')).toBeVisible();
    await expect(editor.locator('ul li')).toBeVisible();
  });

  test('Génération de contenu avec l\'IA', async ({ page }) => {
    // Accéder à l'assistant IA
    await page.getByRole('button', { name: /assistant ia/i }).click();
    
    // Entrer un prompt
    await page.getByLabel(/votre requête/i).fill('Générer un article sur les avantages de l\'IA pour les écrivains');
    
    // Générer le contenu
    await page.getByRole('button', { name: /générer/i }).click();
    
    // Attendre la génération
    await expect(page.getByText(/génération terminée/i)).toBeVisible({ timeout: 30000 });
    
    // Vérifier que du contenu a été généré
    const editor = page.frameLocator('.trix-editor, .ProseMirror, .ck-editor__editable, [contenteditable="true"]').first();
    const generatedContent = await editor.textContent();
    expect(generatedContent.length).toBeGreaterThan(100);
    
    // Vérifier que le titre a été rempli
    const titleInput = page.getByLabel('Titre');
    expect(await titleInput.inputValue()).not.toBe('');
  });

  test('Système d\'autocomplétion par l\'IA', async ({ page }) => {
    // Entrer un titre
    await page.getByLabel('Titre').fill('L\'intelligence artificielle dans l\'écriture');
    
    // Commencer à rédiger du contenu
    const editor = page.frameLocator('.trix-editor, .ProseMirror, .ck-editor__editable, [contenteditable="true"]').first();
    await editor.click();
    await page.keyboard.type('L\'intelligence artificielle révolutionne la façon dont nous écrivons en');
    
    // Déclencher l'autocomplétion
    await page.keyboard.press('Tab');
    
    // Attendre que l'autocomplétion propose du texte
    await expect(page.getByText(/suggestion:/i)).toBeVisible({ timeout: 5000 });
    
    // Accepter la suggestion
    await page.keyboard.press('Tab');
    
    // Vérifier que le texte a été complété
    const completeText = await editor.textContent();
    expect(completeText.length).toBeGreaterThan(70);
  });
});
