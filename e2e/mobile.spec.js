import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers.js';

test.use({ viewport: { width: 390, height: 844 } });

test('keeps the public experience readable on a phone', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try the demo' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);

  await completeOnboarding(page, { goTo: false });
  await expect(page.locator('.mobile-nav')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);

  await page.locator('.mobile-nav a[href="#/milestones"]').click();
  await expect(page).toHaveURL(/#\/milestones$/);
  await expect(page.locator('.mobile-nav a[href="#/milestones"]')).toHaveAttribute('aria-current', 'page');

  await page.locator('.mobile-nav a[href="#/settings"]').click();
  await expect(page.locator('.settings-grid')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test('opens a shared question without horizontal overflow', async ({ page }) => {
  await page.goto('/?lang=el&moment=2026-11-10');
  await expect(page.locator('.shared-moment')).toBeVisible();
  await expect(page.locator('.shared-moment-actions .btn')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test('lays out the share sheet for a phone screen', async ({ page }) => {
  await completeOnboarding(page);
  await page.locator('.countdown-share').click();
  await expect(page.locator('.modal[data-size="share"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share image' })).toBeEnabled();
  const box = await page.locator('.share-canvas').boundingBox();
  expect(box.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});
