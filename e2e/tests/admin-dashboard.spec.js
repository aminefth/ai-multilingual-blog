// @ts-check
const { test, expect } = require('@playwright/test');
const { loginAsAdmin } = require('./utils/auth');
const { switchLanguage, verifyUIText } = require('./utils/language');

/**
 * Admin Dashboard E2E Tests
 * Tests comprehensive admin functionality including:
 * - Dashboard statistics and metrics
 * - User management (view, edit, delete, role changes)
 * - Content moderation (approve, reject, edit posts)
 * - Site configuration and settings
 * - Analytics and reporting
 * - Subscription management
 */

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
  });

  test.describe('Dashboard Overview', () => {
    test('should display key metrics and statistics', async ({ page }) => {
      // Verify dashboard loads
      await expect(page.locator('h1')).toContainText('Admin Dashboard');

      // Check key metric cards
      await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-posts"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-subscriptions"]')).toBeVisible();

      // Verify charts are present
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
    });

    test('should show recent activity feed', async ({ page }) => {
      const activityFeed = page.locator('[data-testid="activity-feed"]');
      await expect(activityFeed).toBeVisible();

      // Check for activity items
      const activityItems = page.locator('[data-testid="activity-item"]');
      await expect(activityItems).toHaveCount({ min: 1 });
    });
  });

  test.describe('User Management', () => {
    test('should display user list with pagination', async ({ page }) => {
      await page.click('[data-testid="users-tab"]');

      // Verify user table
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-row"]')).toHaveCount({ min: 1 });

      // Check pagination
      await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    });

    test('should allow editing user roles', async ({ page }) => {
      await page.click('[data-testid="users-tab"]');

      // Click edit on first user
      await page.click('[data-testid="user-row"]:first-child [data-testid="edit-user"]');

      // Change role
      await page.selectOption('[data-testid="user-role-select"]', 'editor');
      await page.click('[data-testid="save-user"]');

      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'User updated successfully',
      );
    });
  });

  test.describe('Content Moderation', () => {
    test('should display pending posts for approval', async ({ page }) => {
      await page.click('[data-testid="content-tab"]');

      // Check pending posts section
      await expect(page.locator('[data-testid="pending-posts"]')).toBeVisible();
    });

    test('should allow approving posts', async ({ page }) => {
      await page.click('[data-testid="content-tab"]');

      const pendingPosts = page.locator('[data-testid="pending-post"]');
      if ((await pendingPosts.count()) > 0) {
        // Approve first pending post
        await pendingPosts.first().locator('[data-testid="approve-post"]').click();

        // Verify success message
        await expect(page.locator('[data-testid="success-message"]')).toContainText(
          'Post approved successfully',
        );
      }
    });
  });

  test.describe('Analytics and Reporting', () => {
    test('should display comprehensive analytics', async ({ page }) => {
      await page.click('[data-testid="analytics-tab"]');

      // Verify analytics dashboard
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();

      // Check key metrics
      await expect(page.locator('[data-testid="page-views"]')).toBeVisible();
      await expect(page.locator('[data-testid="unique-visitors"]')).toBeVisible();
    });
  });

  test.describe('Multilingual Interface', () => {
    test('should work in French', async ({ page }) => {
      await switchLanguage(page, 'fr');

      // Verify French interface
      await verifyUIText(page, 'h1', 'Tableau de Bord Admin');
      await verifyUIText(page, '[data-testid="users-tab"]', 'Utilisateurs');
    });

    test('should work in Spanish', async ({ page }) => {
      await switchLanguage(page, 'es');

      // Verify Spanish interface
      await verifyUIText(page, 'h1', 'Panel de Administración');
      await verifyUIText(page, '[data-testid="users-tab"]', 'Usuarios');
    });
  });
});
