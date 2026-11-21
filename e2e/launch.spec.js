import { expect, test } from '@playwright/test';

test('opens the demo, shares a card and switches to Greek', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Life moves.');
  await expect(page.getByRole('button', { name: 'Try the demo' })).toBeVisible();

  await page.getByRole('button', { name: 'Try the demo' }).click();
  await expect(page.locator('.demo-banner')).toBeVisible();
  await expect(page.locator('.daily-question')).not.toBeEmpty();
  const mosaicCount = await page.locator('.mosaic-dot').count();
  expect(mosaicCount === 365 || mosaicCount === 366).toBe(true);
  await expect(page.getByText('Demo · not saved')).toBeVisible();

  await page.locator('.countdown-share').click();
  await expect(page.locator('.modal[data-size="share"]')).toBeVisible();
  const downloadButton = page.getByRole('button', { name: 'Download PNG' });
  await expect(downloadButton).toBeEnabled();
  const canvasSize = await page.locator('.share-canvas').evaluate((canvas) => [canvas.width, canvas.height]);
  expect(canvasSize).toEqual([1080, 1080]);
  const caption = await page.locator('#share-caption').inputValue();
  expect(caption).toContain('Demo card.');
  expect(caption).not.toContain('1996');
  expect(await page.locator('.share-link').inputValue()).not.toContain('1996');

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

test('starts a real journey and keeps a private answer across reloads', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Female' }).click();
  await page.locator('#birth').fill('1990-05-12');
  await page.getByRole('textbox', { name: /What should we call you/ }).fill('Alex');
  await page.locator('.setup-form').getByRole('button', { name: /^Continue/ }).click();
  await page.locator('.setup-form').getByRole('button', { name: /^Continue/ }).click();
  await page.locator('.setup-form').getByRole('button', { name: /Start my clock/ }).click();
  await expect(page.locator('.demo-banner')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Another moment, Alex.');

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
