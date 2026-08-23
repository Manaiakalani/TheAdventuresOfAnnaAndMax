import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  ATTR,
  EXTERNAL,
  LIST_VALUED,
  STAMPABLE,
  candidates,
  isStamped,
  parts,
} from '../scripts/asset-patterns.mjs';

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
      // loading="lazy" images below the 88vh hero never decode in headless CI
      // unless they enter the viewport first.
      await img.scrollIntoViewIfNeeded();
      await expect(img).toBeVisible({ timeout: 10000 });
      await expect
        .poll(
          async () =>
            img.evaluate((el) => (el as HTMLImageElement).naturalWidth),
          { timeout: 15000 }
        )
        .toBeGreaterThan(0);
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

  test('lightbox previous/next buttons change the image', async ({ page }) => {
    const images = page.locator('.photo img');
    const firstImage = images.first();
    await firstImage.scrollIntoViewIfNeeded();
    await expect(firstImage).toBeVisible({ timeout: 10000 });

    const secondImgSrc = await images.nth(1).evaluate((el) => (el as HTMLImageElement).src);
    await firstImage.click();

    const overlay = page.locator('.lightbox-overlay.active');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    await page.locator('.lightbox-next').click();
    await expect(page.locator('.lightbox-image')).toHaveAttribute('src', secondImgSrc);

    await page.locator('.lightbox-prev').click();
    const firstImgSrc = await images.first().evaluate((el) => (el as HTMLImageElement).src);
    await expect(page.locator('.lightbox-image')).toHaveAttribute('src', firstImgSrc);

    await page.keyboard.press('Escape');
  });

  test('lightbox closes on close button click', async ({ page }) => {
    const firstImage = page.locator('.photo img').first();
    await firstImage.scrollIntoViewIfNeeded();
    await expect(firstImage).toBeVisible({ timeout: 10000 });

    await firstImage.click();

    const overlay = page.locator('.lightbox-overlay.active');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    const closeBtn = page.locator('.lightbox-close');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(page.locator('.lightbox-overlay')).not.toBeVisible({ timeout: 5000 });
  });

  test('lightbox navigates with arrow keys', async ({ page }) => {
    const images = page.locator('.photo img');
    const firstImage = images.first();
    await firstImage.scrollIntoViewIfNeeded();
    await expect(firstImage).toBeVisible({ timeout: 10000 });

    const secondImgSrc = await images.nth(1).evaluate((el) => (el as HTMLImageElement).src);

    await firstImage.click();

    const overlay = page.locator('.lightbox-overlay.active');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('ArrowRight');
    const lightboxImg = page.locator('.lightbox-image');
    await expect(lightboxImg).toHaveAttribute('src', secondImgSrc);

    await page.keyboard.press('ArrowLeft');
    const firstImgSrc = await images.first().evaluate((el) => (el as HTMLImageElement).src);
    await expect(lightboxImg).toHaveAttribute('src', firstImgSrc);

    await page.keyboard.press('Escape');
  });

  test('footer links are present', async ({ page }) => {
    const emailLink = page.locator('a[aria-label="Email"]');
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute(
      'href',
      'mailto:hello@theadventuresofannaandmax.com'
    );

    const siteLink = page.locator(
      'a[aria-label="Website (opens in new tab)"]'
    );
    await expect(siteLink).toBeVisible();
    await expect(siteLink).toHaveAttribute('href', 'https://manaiakalani.com');
    await expect(siteLink).toHaveAttribute('target', '_blank');
  });

  test('copyright text is visible', async ({ page }) => {
    const copyright = page.locator('footer p').first();
    await expect(copyright).toContainText('2025');
    await expect(copyright).toContainText('Anna and Max');
  });

  test('skip link is present', async ({ page }) => {
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveAttribute('href', '#content');
  });
});

test.describe('Cache busting', () => {
  for (const [pagePath, assets] of [
    ['/', ['styles.css', 'script.js', 'manifest.json', 'favicon.svg', 'images/']],
    ['/404.html', ['styles.css', 'favicon.svg']],
  ] as const) {
    test(`${pagePath} references its assets with a content hash`, async ({
      request,
    }) => {
      const html = await (await request.get(pagePath)).text();
      const refs = [...html.matchAll(ATTR())]
        .flatMap((m) => candidates(m[3], LIST_VALUED.test(m[1])))
        .filter((u) => !EXTERNAL.test(u) && STAMPABLE.test(parts(u).path));
      expect(refs.length, `expected local asset refs in ${pagePath}`).toBeGreaterThanOrEqual(
        assets.length,
      );

      for (const ref of refs) {
        expect(
          isStamped(ref),
          `${ref} must carry a ?v= hash in the query the browser actually sends`,
        ).toBe(true);
        expect(ref, `${ref} should be hosted locally`).not.toContain('unsplash');
        const res = await request.get(ref.startsWith('/') ? ref : `/${ref}`);
        expect(res.status(), `${ref} should resolve`).toBe(200);
      }
      for (const asset of assets) {
        expect(
          refs.some((r) => r.includes(asset)),
          `${pagePath} should reference ${asset}`,
        ).toBe(true);
      }
    });
  }
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

test.describe('Accessibility', () => {
  test('homepage has no critical accessibility violations', async ({
    page,
  }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations.filter((v) => v.impact === 'critical')).toEqual(
      []
    );
  });
});
