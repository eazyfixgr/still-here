import { expect } from '@playwright/test';

export async function completeOnboarding(page, { name = 'Alex', goTo = true } = {}) {
  if (goTo) await page.goto('/');
  await page.getByRole('button', { name: 'Female' }).click();
  await page.locator('#birth').fill('1990-05-12');
  await page.getByRole('textbox', { name: /What should we call you/ }).fill(name);
  await page.locator('.setup-form').getByRole('button', { name: /^Continue/ }).click();
  await page.locator('.setup-form').getByRole('button', { name: /^Continue/ }).click();
  await page.locator('.setup-form').getByRole('button', { name: /Start my clock/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(`Another moment, ${name.split(/\s+/)[0]}.`);
}
