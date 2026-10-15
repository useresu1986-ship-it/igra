const { test, expect, openGame, tab, cash, sleep } = require('./helpers/game');

async function exportSave(page) {
  await tab(page, 'guide');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Экспортировать сохранение', exact: true }).click(),
  ]);
  const chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function importSave(page, save) {
  await tab(page, 'guide');
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Импортировать сохранение', exact: true }).click(),
  ]);
  await chooser.setFiles({ name: 'legacy-warehouse.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(save)) });
  await expect(page.locator('#toast')).toHaveText('Сохранение восстановлено');
}

async function earnAndOpen(page, target) {
  for (let shift = 0; shift < 80 && await cash(page) < target; shift++) {
    await tab(page, 'work');
    const job = page.locator('[data-work="w11"]');
    if (await job.isDisabled()) { await sleep(page); await tab(page, 'work'); }
    await job.click();
    await page.locator('#modal').getByRole('button', { name: 'total = price * quantity', exact: true }).click();
    await expect(page.locator('#modal')).toBeHidden();
  }
  expect(await cash(page)).toBeGreaterThanOrEqual(target);
  await tab(page, 'market');
  await page.locator('[data-open="p19"]').click();
  await expect(page.locator('[data-open="p19"]')).toHaveText('Открыт');
  await sleep(page);
}

const warehouse = save => save.economy.business14.byProject.p19;
const buy = (page, count) => page.locator(`[data-b23-buy="p19"][data-count="${count}"]`);
const sell = (page, count) => page.locator(`[data-b23-sell="p19"][data-count="${count}"]`);
const refund = (page, condition) => page.locator(`[data-b25-refund="p19"][data-condition="${condition}"]`);
const capacity = page => page.locator('[data-warehouse-capacity="p19"]');

test('реальные закупки, продажи с разными ценами и возвраты сохраняются после reload', async ({ page }) => {
  test.setTimeout(180_000);
  await openGame(page); await earnAndOpen(page, 40000);
  await tab(page, 'inventory23');
  const before = await cash(page);
  await buy(page, 5).click();
  await page.locator('[data-b23-price="p19"]').selectOption('690');
  await sell(page, 1).click();
  await page.locator('[data-b23-price="p19"]').selectOption('1490');
  await sell(page, 1).click();
  const sales = await exportSave(page);
  expect(warehouse(sales).sales.map(row => row.price)).toEqual([690, 1490]);
  await page.reload();
  await tab(page, 'inventory23');
  await expect(capacity(page)).toContainText('Вместимость: 3/100');
  await page.locator('[data-b25-sale="p19"]').selectOption(String(warehouse(sales).sales[1].id));
  await refund(page, 'damaged').click();
  await expect(capacity(page)).toContainText('Повреждено: 1 шт.');
  await expect(page.locator(`[data-b25-sale="p19"] option[value="${warehouse(sales).sales[1].id}"]`)).toHaveCount(0);
  await page.reload();
  await page.locator('[data-b25-sale="p19"]').selectOption(String(warehouse(sales).sales[0].id));
  await refund(page, 'good').click();
  expect(await cash(page)).toBe(before - 2712);
  await expect(capacity(page)).toContainText('Вместимость: 4/100');
  await expect(refund(page, 'good')).toBeDisabled();
  await expect(refund(page, 'damaged')).toBeDisabled();
  const paid = await exportSave(page);
  expect(paid.ledger.filter(row => row.category === 'Возврат покупателю').map(row => row.amount)).toEqual([-1490, -690]);
  await page.reload();
  const restored = await exportSave(page);
  expect(restored.cash).toBe(paid.cash);
  expect(warehouse(restored)).toEqual(warehouse(paid));
  expect(restored.ledger).toEqual(paid.ledger);
  await tab(page, 'finance');
  const rows = page.locator('#main tbody tr').filter({ hasText: 'Возврат покупателю' });
  await expect(rows).toHaveCount(2);
});

test('поставки резервируют место для ручной закупки и бизнес-практикума', async ({ page }) => {
  test.setTimeout(180_000);
  await openGame(page); await earnAndOpen(page, 100000);
  await tab(page, 'suppliers26');
  for (let i = 0; i < 5; i++) {
    // После заказа экран перерисовывается; перед каждой партией выбираем поставщика.
    await page.locator('[data-supplier="p19"]').selectOption('fast');
    await page.locator('[data-order="p19"][data-count="20"]').click();
  }
  await tab(page, 'inventory23');
  await expect(capacity(page)).toContainText('В пути: 100 шт.');
  await expect(buy(page, 5)).toBeDisabled();
  const before = await exportSave(page);
  await page.reload();
  await tab(page, 'business14');
  await page.locator('[data-businessstart14="p19"]').click();
  for (const value of ['small', '282', 'reserve']) await page.locator(`[data-business14="${value}"]`).click();
  await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#toast')).toContainText('Недостаточно места');
  const rejected = await exportSave(page);
  expect(rejected.cash).toBe(before.cash);
  expect(rejected.ledger).toEqual(before.ledger);
  expect(rejected.hours).toBe(before.hours);
  expect(rejected.energy).toBe(before.energy);
  expect(rejected.projects.p19.posts).toBe(before.projects.p19.posts);
  expect(warehouse(rejected)).toEqual(warehouse(before));
  await sleep(page);
  await tab(page, 'inventory23');
  await expect(capacity(page)).toContainText('Вместимость: 100/100');
  await expect(capacity(page)).toContainText('В пути: 0 шт.');
  await expect(buy(page, 5)).toBeDisabled();
  const arrived = await exportSave(page);
  expect(warehouse(arrived).deliveries.every(row => row.status === 'delivered')).toBeTruthy();
  await page.reload();
  expect(warehouse(await exportSave(page))).toEqual(warehouse(arrived));
});

function legacyProject(save, record) {
  // Явная фикстура старого сохранения для проверки совместимости, импортируемая через UI.
  save.cash = 50000;
  save.projects.p19 = { open: true, posts: 0, audience: 0, staff: 0, automation: 0 };
  save.economy.business14 = { history: [], round: 0, byProject: { p19: record } };
  return save;
}

test('исправный возврат на полный склад ожидает места и размещается после новой продажи', async ({ page }) => {
  test.setTimeout(180_000);
  await openGame(page); await earnAndOpen(page, 100000);
  await tab(page, 'inventory23');
  for (let i = 0; i < 10; i++) await buy(page, 10).click();
  await sell(page, 5).click();
  await buy(page, 5).click();
  const before = await cash(page);
  await refund(page, 'good').click();
  expect(await cash(page)).toBe(before - 990);
  await expect(capacity(page)).toContainText('Вместимость: 100/100');
  await expect(capacity(page)).toContainText('Ожидают размещения: 1 шт.');
  await expect(buy(page, 5)).toBeDisabled();
  const queued = await exportSave(page);
  await page.reload();
  await tab(page, 'inventory23');
  await expect(capacity(page)).toContainText('Ожидают размещения: 1 шт.');
  await sell(page, 1).click();
  expect(await cash(page)).toBe(queued.cash + 702);
  await expect(capacity(page)).toContainText('Вместимость: 100/100');
  await expect(capacity(page)).toContainText('Ожидают размещения: 0 шт.');
  const placed = await exportSave(page);
  expect(warehouse(placed).sales[0].good).toBe(1);
  await page.reload();
  expect(warehouse(await exportSave(page))).toEqual(warehouse(placed));
});

test('ранее оплаченная избыточная поставка ожидает места и не дублируется после reload', async ({ page }) => {
  await openGame(page);
  const base = await exportSave(page);
  const legacy = legacyProject(base, { stock: 95, unitsSold: 0, deliveries: [
    { id: 1, supplier: 'fast', count: 20, unit: 440, freight: 250, ordered: base.day, due: base.day + 1, status: 'transit' },
  ] });
  await importSave(page, legacy);
  await sleep(page);
  await tab(page, 'inventory23');
  await expect(capacity(page)).toContainText('Вместимость: 100/100');
  await expect(capacity(page)).toContainText('Ожидают размещения: 15 шт.');
  const before = await cash(page);
  await sell(page, 1).click();
  expect(await cash(page)).toBe(before + 702);
  await expect(capacity(page)).toContainText('Вместимость: 100/100');
  await expect(capacity(page)).toContainText('Ожидают размещения: 14 шт.');
  const saved = await exportSave(page);
  await page.reload();
  const restored = await exportSave(page);
  expect(warehouse(restored)).toEqual(warehouse(saved));
  expect(restored.cash).toBe(saved.cash);
  expect(restored.ledger).toEqual(saved.ledger);
  await sleep(page);
  const nextDay = await exportSave(page);
  expect(warehouse(nextDay).stock).toBe(100);
  expect(warehouse(nextDay).waitingStock).toBe(14);
  expect(warehouse(nextDay).deliveries[0].status).toBe('delivered');
});

test('старые возвраты используют сохранённую цену, а неизвестная цена не вызывает списаний', async ({ page }) => {
  await openGame(page);
  const base = await exportSave(page);
  const legacy = legacyProject(base, { stock: 4, unitsSold: 1, refundable: 1, refundPrice: 1190 });
  await importSave(page, legacy);
  await tab(page, 'inventory23');
  await expect(page.locator('#main')).toContainText('точные цены отдельных продаж не сохранились');
  await refund(page, 'good').click();
  expect(await cash(page)).toBe(48810);
  await page.reload();
  await expect(refund(page, 'good')).toBeDisabled();
  const paid = await exportSave(page);
  expect(warehouse(paid).stock).toBe(5);
  expect(warehouse(paid).sales[0].good).toBe(1);

  const unknown = JSON.parse(JSON.stringify(legacy));
  delete warehouse(unknown).refundPrice;
  await importSave(page, unknown);
  await tab(page, 'inventory23');
  await refund(page, 'good').click();
  await expect(page.locator('#toast')).toContainText('нет цены');
  expect(await cash(page)).toBe(50000);
  const unchanged = await exportSave(page);
  expect(warehouse(unchanged).stock).toBe(4);
  expect(warehouse(unchanged).refundable).toBe(1);
  expect(unchanged.ledger).toEqual(unknown.ledger);
});
