const { test, expect, openGame, tab, cash, sleep } = require('./helpers/game');

async function exportSave(page) {
  await tab(page, 'guide');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Экспортировать сохранение', exact: true }).click()]);
  const chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function importSave(page, fixture) {
  await tab(page, 'guide');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Импортировать сохранение', exact: true }).click()]);
  await chooser.setFiles({ name: 'legacy-finances.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) });
  await expect(page.locator('#toast')).toHaveText('Сохранение восстановлено');
}
const rubles = text => Number(text.replace(/[^\d-]/g, ''));
const cardValue = (page, label) => page.locator('#main .card').filter({ has: page.locator('.mini', { hasText: label }) }).locator('.statnum').first();

// Фикстуры старых сохранений загружаются только штатным импортом. Все действия,
// выплаты, налоговая разметка и проверки после импорта происходят через интерфейс.
test('договор: выполнение, дебиторка, прогноз, оплата и налог после reload', async ({ page }) => {
  await openGame(page);
  const fixture = await exportSave(page);
  fixture.cash = 20000;
  fixture.economy.contracts11 = { seq: 900, lastDay: fixture.day, history: [], pending: [], active: null, offers: [
    { id: 900, job: 'w11', quote: 3000, expires: fixture.day + 3, delay: 1, risk: 0, taken: false },
  ] };
  await importSave(page, fixture);
  await tab(page, 'contracts11');
  await page.locator('[data-contract11="900"]').click();
  await page.locator('#modal').getByRole('button', { name: 'total = price * quantity', exact: true }).click();
  await expect(page.locator('#modal')).toBeHidden();
  const submitted = await exportSave(page), contract = submitted.economy.contracts11.pending[0];
  expect(contract.gross).toBeGreaterThan(0);
  await tab(page, 'finance');
  await expect(cardValue(page, 'Денежные поступления')).toHaveText(/(^|\s)0\s*₽/);
  await tab(page, 'realism');
  await expect(page.locator('[data-real-tax]')).toHaveCount(0);
  await page.reload();
  await tab(page, 'planning');
  expect(rubles(await cardValue(page, 'Счета к получению').innerText())).toBe(contract.gross);
  await tab(page, 'risk21');
  await page.locator('#risk-collection').selectOption('100');
  const first = page.locator('#main tbody tr').first();
  const expectedCash = rubles(await first.locator('td').nth(3).innerText());
  const expectedDebt = rubles(await first.locator('td').nth(4).innerText());
  await sleep(page);
  expect(await cash(page)).toBe(expectedCash);
  await tab(page, 'contracts11');
  await expect(page.locator('#main tbody tr')).toContainText('Оплачено');
  const received = await exportSave(page);
  expect(received.debt).toBe(expectedDebt);
  const payments = received.ledger.filter(x => x.category === 'Поступление по договору');
  expect(payments).toHaveLength(1); expect(payments[0].amount).toBe(contract.gross);
  await tab(page, 'realism');
  await page.locator(`[data-real-tax="${payments[0].id}"]`).selectOption('business');
  const due = Math.round(contract.gross * .06), before = await cash(page);
  await expect(page.locator('#real-pay')).toContainText(String(due));
  await page.locator('#real-pay').click(); expect(await cash(page)).toBe(before - due);
  await page.reload();
  await expect(page.locator('#real-pay')).toBeDisabled();
  const restored = await exportSave(page);
  expect(restored.cash).toBe(before - due);
  expect(restored.ledger.filter(x => x.category === 'Поступление по договору')).toHaveLength(1);
  expect(restored.ledger.filter(x => x.category === 'Учебная уплата НПД')).toHaveLength(1);
});

test('оклад и доплата команды совпадают с прогнозом и сохраняются после reload', async ({ page }) => {
  await openGame(page);
  const fixture = await exportSave(page);
  fixture.cash = 50000;
  fixture.projects.p19 = { open: true, posts: 0, audience: 0, staff: 1, automation: 0 };
  await importSave(page, fixture);
  await tab(page, 'team27');
  await page.locator('[data-role27="p19"]').selectOption('operations');
  await page.locator('[data-hire27="p19"]').click();
  await tab(page, 'morale29');
  await page.locator('[data-bonus29="p19"]').click();
  await tab(page, 'team27');
  await expect(page.locator('#main')).toContainText(/Оклады в день:\s*650\s*₽/);
  const before = await exportSave(page);
  await page.reload(); await tab(page, 'risk21');
  const first = page.locator('#main tbody tr').first();
  const expectedCash = rubles(await first.locator('td').nth(3).innerText());
  const dailyOut = rubles(await first.locator('td').nth(2).innerText());
  await sleep(page);
  const after = await exportSave(page);
  expect(after.cash).toBe(expectedCash); expect(before.cash - after.cash).toBe(dailyOut);
  const wages = after.ledger.filter(x => x.category === 'Зарплата команды');
  expect(wages).toHaveLength(1); expect(wages[0].amount).toBe(-650);
  expect(after.ledger.filter(x => x.category === 'Зарплата персонала').map(x => x.amount)).toEqual([-650]);
  await page.reload();
  const restored = await exportSave(page);
  expect(restored.cash).toBe(after.cash); expect(restored.ledger).toEqual(after.ledger);
});

test('старый оплаченный налог зачтён; дубликат очереди договора не даёт второй выплаты', async ({ page }) => {
  await openGame(page);
  const fixture = await exportSave(page);
  fixture.cash = 9900;
  fixture.ledger = [
    { id: 1, day: 1, category: 'Оплата труда', amount: 2500, source: 'Создание сайтов', note: '' },
    { id: 2, day: 1, category: 'Перевод в дебиторскую задолженность', amount: -2500, source: 'Создание сайтов', note: '' },
    { id: 3, day: 1, category: 'Учебная уплата НПД', amount: -100, source: 'Налоговый кабинет', note: '' },
  ];
  const contract = { id: 7, day: 1, due: 2, job: 'w11', gross: 3000, cost: 0, hours: 3, risk: 0, status: 'pending' };
  fixture.economy.contracts11 = { offers: [], active: null, lastDay: 1, seq: 7, history: [contract], pending: [contract, { ...contract }] };
  fixture.economy.expansion.realism18.tax.records = { 1: { kind: 'individual', paid: true } };
  await importSave(page, fixture); await page.reload(); await sleep(page);
  const settled = await exportSave(page), payments = settled.ledger.filter(x => x.category === 'Поступление по договору');
  expect(payments).toHaveLength(1); expect(payments[0].amount).toBe(3000);
  expect(settled.economy.contracts11.history[0].status).toBe('paid');
  await tab(page, 'realism');
  await page.locator(`[data-real-tax="${payments[0].id}"]`).selectOption('business');
  await expect(page.locator('#real-pay')).toContainText(/80\s*₽/);
  const before = await cash(page); await page.locator('#real-pay').click(); expect(await cash(page)).toBe(before - 80);
  await page.reload(); await expect(page.locator('#real-pay')).toBeDisabled();
  const restored = await exportSave(page);
  expect(restored.cash).toBe(before - 80);
  expect(restored.ledger.filter(x => x.category === 'Поступление по договору')).toHaveLength(1);
  expect(restored.ledger.filter(x => x.category === 'Учебная уплата НПД').map(x => x.amount)).toEqual([-100, -80]);
});
