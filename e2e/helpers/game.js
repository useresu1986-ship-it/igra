const { test: base, expect } = require('@playwright/test');

// Каждый тест получает отдельный чистый browser context от Playwright.
const test = base.extend({
  javascriptErrors: [async ({ page }, use, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.stack || error.message));
    page.on('console', message => {
      if (message.type() === 'error') {
        errors.push({ message: message.text(), location: message.location() });
      }
    });
    await use(errors);
    if (errors.length) {
      await testInfo.attach('javascript-errors', {
        body: JSON.stringify(errors, null, 2), contentType: 'application/json',
      });
    }
    expect(errors, 'Ошибки JavaScript во время действий игрока').toEqual([]);
  }, { auto: true }],
});

async function openGame(page) {
  const response = await page.goto('/index.html');
  expect(response.ok()).toBeTruthy();
  await expect(page.locator('#main')).toBeVisible();
  await expect(page.locator('#cash')).toContainText(/\d/);
}

async function tab(page, id) {
  const button = page.locator(`#nav button[data-tab="${id}"]`);
  await button.click();
  await expect(button).toHaveClass(/active/);
}

async function cash(page) {
  return Number((await page.locator('#cash').innerText()).replace(/[^\d-]/g, ''));
}

async function sleep(page) {
  const day = Number(await page.locator('#day').innerText());
  await tab(page, 'home');
  await page.getByRole('button', { name: /Спать/ }).click();
  await expect(page.locator('#day')).toHaveText(String(day + 1));
}

async function courier(page) {
  await tab(page, 'work');
  const first = page.locator('button[data-work]').first();
  await expect(first).toHaveAttribute('data-work', 'w0');
  await expect(first).toBeEnabled();
  await first.click();
  const modal = page.locator('#modal');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Доставка: построение маршрута');
  for (const name of ['Аптека — до 12:00', 'Офис — до 13:00', 'Дом — до 15:00']) {
    await modal.getByRole('button', { name, exact: true }).click();
  }
  await expect(modal).toBeHidden();
}

module.exports = { test, expect, openGame, tab, cash, sleep, courier };
