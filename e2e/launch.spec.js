import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers.js';

test('starts a journey, shares a card and switches to Greek', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Life moves.');
  await expect(page.getByRole('button', { name: 'Try the demo' })).toHaveCount(0);

  await completeOnboarding(page, { goTo: false });
  await expect(page.locator('.save-pill')).toContainText('Saved on this device');
  await expect(page.locator('.daily-question')).not.toBeEmpty();
  const mosaicCount = await page.locator('.mosaic-dot').count();
  expect(mosaicCount === 365 || mosaicCount === 366).toBe(true);

  await page.locator('.countdown-share').click();
  await expect(page.locator('.modal[data-size="share"]')).toBeVisible();
  const downloadButton = page.getByRole('button', { name: 'Download PNG' });
  await expect(downloadButton).toBeEnabled();
  const canvasSize = await page.locator('.share-canvas').evaluate((canvas) => [canvas.width, canvas.height]);
  expect(canvasSize).toEqual([1080, 1080]);
  const caption = await page.locator('#share-caption').inputValue();
  expect(caption).not.toContain('1990');
  expect(await page.locator('.share-link').inputValue()).not.toContain('1990');

  const downloadPromise = page.waitForEvent('download');
  await downloadButton.click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.locator('.modal-close').click();

  await page.locator('.app-header .language-select').selectOption('el');
  await expect(page.locator('.page-title')).toContainText('Άλλη μια στιγμή');
  await expect(page.locator('.daily-question')).not.toBeEmpty();
  expect(pageErrors).toEqual([]);
});

test('shows a shared question and the matching language immediately', async ({ page }) => {
  await page.goto('/?lang=el&moment=2026-11-10');
  await expect(page.locator('html')).toHaveAttribute('lang', 'el');
  await expect(page.locator('.shared-moment')).toBeVisible();
  await expect(page.locator('.shared-moment blockquote')).not.toBeEmpty();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Η ζωή κινείται.');
});

test('keeps a private answer across reloads', async ({ page }) => {
  await completeOnboarding(page);

  const details = page.locator('.reflection-box');
  await details.locator('summary').click();
  await page.locator('#daily-reflection').fill('The small things are still there.');
  await page.getByRole('button', { name: 'Keep this answer' }).click();
  await expect(page.getByText('Answer kept on this device.')).toBeVisible();
  await page.getByRole('button', { name: /Past answers/ }).click();
  await expect(page.locator('.reflection-entry')).toContainText('The small things are still there.');
  await page.locator('.modal-close').click();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Another moment, Alex.');
  await expect(page.locator('.reflection-box')).toHaveAttribute('open', '');
  await expect(page.locator('#daily-reflection')).toHaveValue('The small things are still there.');

  await page.goto('/?lang=el');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Άλλη μια στιγμή, Alex.');
});
