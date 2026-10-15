const { test, expect, openGame, tab, cash, courier } = require('./helpers/game');

// Проверяем формат сохранения через реальные кнопки импорта/экспорта.
// Нет обращений к S, GameTest, записи в localStorage или подмены выплат.
async function exportSave(page) {
  await tab(page, 'guide');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Экспортировать сохранение', exact: true }).click(),
  ]);
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function importSave(page, save) {
  await tab(page, 'guide');
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Импортировать сохранение', exact: true }).click(),
  ]);
  await chooser.setFiles({ name: 'legacy-save.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(save)) });
  await expect(page.locator('#toast')).toHaveText('Сохранение восстановлено');
}

function expectUnique(save) {
  expect(new Set(save.ledger.map(row => row.id)).size).toBe(save.ledger.length);
  expect(save.nextLedgerId).toBeGreaterThan(Math.max(...save.ledger.map(row => row.id)));
}

test('обычная подработка на границе обрезки журнала сохраняет уникальные ID после reload', async ({ page }) => {
  await openGame(page);
  const legacy = await exportSave(page);
  delete legacy.nextLedgerId;
  // Входная фикстура длительного прохождения старой версии, не результат новой работы.
  legacy.ledger = Array.from({ length: 12000 }, (_, i) => ({
    id: i + 1, day: 1, category: 'Историческая операция', amount: 1,
    source: 'Старое сохранение', note: '', project: '',
  }));
  legacy.cash = 13500;
  await importSave(page, legacy);
  await courier(page);
  const after = await exportSave(page);
  expect(after.ledger).toHaveLength(10001);
  expectUnique(after);
  const earned = after.ledger.filter(row => row.id > 12000);
  expect(earned).toHaveLength(2);
  expect(earned.map(row => row.category)).toEqual(['Оплата труда', 'Рабочие издержки']);
  expect(after.cash).toBe(legacy.cash + earned.reduce((sum, row) => sum + row.amount, 0));

  await page.reload();
  expect(await cash(page)).toBe(after.cash);
  const restored = await exportSave(page);
  expect(restored.ledger).toEqual(after.ledger);
  expect(restored.nextLedgerId).toBe(after.nextLedgerId);
  await courier(page);
  const continued = await exportSave(page);
  expectUnique(continued);
  expect(continued.ledger.filter(row => row.id >= after.nextLedgerId)).toHaveLength(2);
});

test('импорт старых повторных ID сохраняет уплаченные налоги и не повторяет операции после reload', async ({ page }) => {
  await openGame(page);
  const legacy = await exportSave(page);
  delete legacy.nextLedgerId;
  legacy.cash = 5900;
  legacy.ledger = [
    { id: 7, day: 1, category: 'Оплата клиентов', amount: 1000, source: 'Первый клиент' },
    { id: 7, day: 1, category: 'Оплата клиентов', amount: 1500, source: 'Второй клиент' },
    { id: 8, day: 1, category: 'Оплата клиентов', amount: 2000, source: 'Организация' },
    { id: 9, day: 1, category: 'Учебная уплата НПД', amount: -100, source: 'Налоговый кабинет' },
  ];
  legacy.economy.expansion.realism18.tax.records = {
    7: { kind: 'individual', paid: true },
    8: { kind: 'business', paid: false },
    70: { kind: 'exclude', paid: true },
  };
  await importSave(page, legacy);
  expect(await cash(page)).toBe(5900);
  const migrated = await exportSave(page);
  expectUnique(migrated);
  expect(migrated.ledger).toHaveLength(4);
  expect(migrated.ledger.map(({ id, ...row }) => row)).toEqual(legacy.ledger.map(({ id, ...row }) => row));
  await tab(page, 'realism');
  for (const row of migrated.ledger.slice(0, 2)) {
    await expect(page.locator(`[data-real-tax="${row.id}"]`)).toBeDisabled();
  }
  await expect(page.locator('#real-pay')).toContainText(/120\s*₽/);
  await page.locator('#real-pay').click();
  expect(await cash(page)).toBe(5780);
  await expect(page.locator('#real-pay')).toBeDisabled();
  const paid = await exportSave(page);
  expectUnique(paid);
  expect(paid.ledger).toHaveLength(5);
  await page.reload();
  expect(await cash(page)).toBe(5780);
  await tab(page, 'realism');
  await expect(page.locator('#real-pay')).toBeDisabled();
  const restored = await exportSave(page);
  expect(restored.ledger).toEqual(paid.ledger);
  expect(restored.economy.expansion.realism18.tax.records).toEqual(paid.economy.expansion.realism18.tax.records);
});
