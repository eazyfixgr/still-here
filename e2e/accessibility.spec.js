import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

async function seriousViolations(page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return result.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
}

test('landing and demo have no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  expect(await seriousViolations(page)).toEqual([]);

  await page.getByRole('button', { name: 'Try the demo' }).click();
  await expect(page.locator('.demo-banner')).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);

  await page.locator('.app-header .icon-button').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await seriousViolations(page)).toEqual([]);

  await page.locator('.countdown-share').click();
  await expect(page.getByRole('button', { name: 'Share image' })).toBeEnabled();
  expect(await seriousViolations(page)).toEqual([]);
});
