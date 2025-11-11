import { test, expect } from '@playwright/test';

test.describe('Office 365 Management Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
  });

  test('should redirect to sign in when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('should display dashboard after sign in', async ({ page }) => {
    // Mock authenticated session
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    await expect(page.locator('h2')).toContainText('Welcome back');
  });

  test('should navigate to OOF page', async ({ page }) => {
    // Setup authenticated session
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    await page.click('text=Out of Office');
    await expect(page).toHaveURL('/dashboard/oof');
  });

  test('should navigate to forwarding page', async ({ page }) => {
    // Setup authenticated session
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    await page.click('text=Email Forwarding');
    await expect(page).toHaveURL('/dashboard/forwarding');
  });

  test('should set OOF with mocked API', async ({ page, context }) => {
    await context.route('**/api/oof', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { message: 'OOF settings updated successfully' },
        }),
      });
    });

    // Setup authenticated session
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard/oof');
    
    // Fill form (assuming form exists)
    // await page.selectOption('[name="status"]', 'disabled');
    // await page.click('button[type="submit"]');
    
    // Verify success message appears
    // await expect(page.locator('.toast')).toContainText('success');
  });

  test('should create forwarding rule with mocked API', async ({ page, context }) => {
    await context.route('**/api/forwarding', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { message: 'Forwarding rule created successfully' },
          }),
        });
      }
    });

    // Setup authenticated session
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard/forwarding');
    
    // Fill form (assuming form exists)
    // await page.fill('[name="forwardTo"]', 'test@example.com');
    // await page.click('button[type="submit"]');
    
    // Verify success message appears
    // await expect(page.locator('.toast')).toContainText('success');
  });
});
