import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle('The Adventures of Anna and Max');
  });

  test('header title is visible', async ({ page }) => {
    const heading = page.locator('h1#main-title');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('The Adventures of Anna and Max');
  });

  test('all 3 images load successfully', async ({ page }) => {
    const images = page.locator('.photo img');
    await expect(images).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      const img = images.nth(i);
      await expect(img).toBeVisible({ timeout: 10000 });
      const naturalWidth = await img.evaluate(
        (el) => (el as HTMLImageElement).naturalWidth
      );
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('photo descriptions are present', async ({ page }) => {
    const descriptions = page.locator('.photo-description');
    await expect(descriptions).toHaveCount(3);

    await expect(descriptions.nth(0)).toContainText('mountains');
    await expect(descriptions.nth(1)).toContainText('forest');
    await expect(descriptions.nth(2)).toContainText('coastal');
  });

  test('lightbox opens on image click and closes on Escape', async ({
    page,
  }) => {
    // Scroll to make images visible (they fade in via IntersectionObserver)
    const firstImage = page.locator('.photo img').first();
    await firstImage.scrollIntoViewIfNeeded();
    await expect(firstImage).toBeVisible({ timeout: 10000 });

    await firstImage.click();

    const overlay = page.locator('.lightbox-overlay');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');
    await expect(overlay).not.toBeVisible({ timeout: 5000 });
  });

  test('lightbox closes on overlay click', async ({ page }) => {
    const firstImage = page.locator('.photo img').first();
    await firstImage.scrollIntoViewIfNeeded();
    await expect(firstImage).toBeVisible({ timeout: 10000 });

    await firstImage.click();

    const overlay = page.locator('.lightbox-overlay.active');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Wait for the active transition to settle, then click the overlay
    await page.waitForTimeout(500);
    await overlay.evaluate((el) => el.click());
    await expect(page.locator('.lightbox-overlay')).not.toBeVisible({ timeout: 5000 });
  });

  test('footer links are present', async ({ page }) => {
    const emailLink = page.locator('a[aria-label="Email"]');
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute(
      'href',
      'mailto:hello@theadventuresofannaandmax.com'
    );

    const twitterLink = page.locator(
      'a[aria-label="Twitter (opens in new tab)"]'
    );
    await expect(twitterLink).toBeVisible();
    await expect(twitterLink).toHaveAttribute('target', '_blank');
  });

  test('copyright text is visible', async ({ page }) => {
    const copyright = page.locator('footer p');
    await expect(copyright).toContainText('2025');
    await expect(copyright).toContainText('Anna and Max');
  });

  test('skip link is present', async ({ page }) => {
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveAttribute('href', '#content');
  });
});

test.describe('404 Page', () => {
  test('shows custom 404 page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');
    expect(response?.status()).toBe(404);

    await expect(page.locator('h1')).toContainText('404');
    const returnLink = page.locator('a[href="/"]');
    await expect(returnLink).toBeVisible();
  });
});
