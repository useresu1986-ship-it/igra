const { test, expect } = require('@playwright/test');

test('игра загружается без критических ошибок JavaScript', async ({ page }) => {
  const errors = [];
  // Подписываемся до перехода, чтобы поймать ошибки инициализации модулей.
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  const response = await page.goto('/index.html', { waitUntil: 'load' });
  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/ИЗ НУЛЯ/);
  await expect(page.locator('#main')).toBeVisible();
  await expect(page.locator('#main')).not.toBeEmpty();
  await expect(page.locator('#cash')).toContainText(/\d/);
  await expect(page.locator('#energy')).toHaveText(/\d+%/);
  await expect(page.locator('#nav button[data-tab="home"]')).toHaveClass(/active/);

  expect(errors, 'Ошибки JavaScript и console.error при загрузке игры').toEqual([]);
});
