const fs = require('fs');
const path = require('path');
const { test, expect, openGame, tab, cash, courier, sleep } = require('./helpers/game');
const amount = text => Number(text.replace(/[^\d-]/g, ''));
async function finishDelivery(page, mobile = false) {
  for (const name of ['Аптека — до 12:00', 'Офис — до 13:00', 'Дом — до 15:00']) await page.locator('#modal').getByRole('button', { name, exact: true })[mobile ? 'tap' : 'click']();
  await expect(page.locator('#modal')).toBeHidden();
}
async function exportSave(page) {
  await tab(page, 'guide');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Экспортировать сохранение', exact: true }).click()]);
  const chunks = []; for await (const c of await download.createReadStream()) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function screenshot(page, name) {
  fs.mkdirSync(path.join(__dirname, 'artifacts'), { recursive: true });
  await page.screenshot({ path: path.join(__dirname, 'artifacts', name), fullPage: true, animations: 'disabled' });
}
for (const mobile of [false, true]) {
  test.describe(mobile ? 'стартовый цикл на телефоне' : 'стартовый цикл на компьютере', () => {
    test.use(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } });
    test('доставка → покупка курса → реальный навык → цель на проект → reload', async ({ page }) => {
      await openGame(page);
      const goal = page.locator('[data-progress-goal="course"]');
      await expect(goal).toContainText('Курс курьера');
      await expect(goal.locator('progress')).toHaveAttribute('value', '1500');
      await expect(goal.locator('progress')).toHaveAttribute('max', '1800');
      const start = goal.locator('[data-progress-action="work"]');
      const bounds = await start.boundingBox();
      expect(bounds.y).toBeLessThan(mobile ? 844 : 900);
      if (mobile) {
        expect(bounds.width).toBeGreaterThan(200); expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect((await page.locator('body').boundingBox()).width).toBe(390);
      }
      await screenshot(page, `progress-after-${mobile ? 'mobile' : 'desktop'}.png`);
      await start[mobile ? 'tap' : 'click'](); await finishDelivery(page, mobile);
      const work = page.locator('[data-progress-result="work"]');
      await expect(work).toContainText('Первая смена завершена');
      const gross = amount(await work.locator('[data-result-gross]').innerText());
      const costs = amount(await work.locator('[data-result-cost]').innerText());
      const net = amount(await work.locator('[data-result-net]').innerText());
      expect(net).toBe(gross - costs); expect(await cash(page)).toBe(1500 + net);
      await expect(goal.locator('[data-progress-remaining]')).toHaveText('Сумма накоплена');
      const beforeCourse = await cash(page);
      await goal.locator('[data-progress-action="course"]')[mobile ? 'tap' : 'click']();
      expect(await cash(page)).toBe(beforeCourse - 1800);
      const result = page.locator('[data-progress-result="course"]');
      await expect(result.locator('[data-result-skill]')).toContainText('Навык: 1 → 6');
      await expect(result.locator('[data-result-skill]')).toContainText('1,2% → 7,2%');
      const next = page.locator('[data-progress-goal="project"]');
      await expect(next).toContainText('Первый проект: Блог Дзен');
      await expect(next).toContainText(/290\s*₽ за игровой день/);
      await expect(next.locator('progress')).toHaveAttribute('max', '2600');
      await screenshot(page, `progress-course-${mobile ? 'mobile' : 'desktop'}.png`);
      await next.locator('[data-progress-action="work"]')[mobile ? 'tap' : 'click'](); await finishDelivery(page, mobile);
      const completed = await exportSave(page);
      expect(completed.skills.w0).toBe(7); expect(completed.economy.systems.training.w0).toBe(1);
      expect(completed.ledger.filter(r => r.category === 'Обучение')).toHaveLength(1);
      expect(completed.ledger.filter(r => r.category === 'Награда за достижение')).toHaveLength(0);
      expect(completed.cash).toBe(1500 + completed.ledger.reduce((n, r) => n + r.amount, 0));
      await tab(page, 'home'); await page.reload();
      await expect(page.locator('[data-progress-goal="project"]')).toBeVisible();
      await expect(page.locator('[data-progress-result]')).toHaveCount(0);
      for (let i = 0; i < 2; i++) { await page.locator('#progress-goal-choice').selectOption('free'); await page.locator('#progress-goal-choice').selectOption('auto'); }
      const restored = await exportSave(page);
      for (const key of ['cash', 'debt', 'skills', 'owned', 'ledger', 'workCount']) expect(restored[key]).toEqual(completed[key]);
    });
  });
}

test('существующий предмет покупается на заработок и сохраняется без повторного списания', async ({ page }) => {
  await openGame(page);
  for (let shift = 0; shift < 8 && await cash(page) < 3500; shift++) {
    await tab(page, 'work');
    if (await page.locator('[data-work="w0"]').isDisabled()) await sleep(page);
    await courier(page);
  }
  const before = await cash(page); expect(before).toBeGreaterThanOrEqual(3500);
  await tab(page, 'life'); await page.locator('[data-asset="3"]').click();
  expect(await cash(page)).toBe(before - 3500);
  await expect(page.locator('[data-progress-result="asset"]')).toContainText('Куплено: Наушники');
  await expect(page.locator('[data-asset="3"]')).toHaveText('Уже куплено');
  const purchased = await exportSave(page); expect(purchased.owned).toContain(3);
  await page.reload(); const restored = await exportSave(page);
  expect(restored.cash).toBe(purchased.cash); expect(restored.ledger).toEqual(purchased.ledger); expect(restored.owned).toEqual(purchased.owned);
});

test('свободный выбор цели сохраняется, все прежние разделы остаются доступны', async ({ page }) => {
  await openGame(page); const before = await exportSave(page); await tab(page, 'home');
  await page.locator('#progress-goal-choice').selectOption('free'); await page.reload();
  await expect(page.locator('[data-progress-goal="free"]')).toBeVisible();
  await expect(page.locator('#nav button')).toHaveCount(34);
  await page.locator('[data-progress-action="workList"]').click(); await expect(page.locator('#main h1')).toHaveText('Биржа подработок');
  const after = await exportSave(page); expect(after.cash).toBe(before.cash); expect(after.ledger).toEqual(before.ledger);
});
