const { test, expect, openGame, tab, cash, sleep, courier } = require('./helpers/game');
const KEY = 'iz_nulya_v3_state';
async function exportSave(page) {
  await tab(page, 'guide');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Экспортировать сохранение', exact: true }).click()]);
  return JSON.parse(await downloadText(download));
}
async function downloadText(download) {
  const chunks = []; for await (const c of await download.createReadStream()) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}
async function importFile(page, value, recovery = false) {
  if (!recovery) await tab(page, 'guide');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Импортировать сохранение', exact: true }).click()]);
  await chooser.setFiles({ name: 'save.json', mimeType: 'application/json', buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)) });
}
const legacy = () => ({ version: 3, day: 3, cash: 20000, debt: 500, energy: 80, stress: 10, hours: 12, rep: 0, skills: {}, owned: [0], projects: { p19: { open: true, posts: 0, audience: 0, staff: 0, automation: 0 } }, ledger: [], workCount: 0, events: [], tab: 'home', lastBonus: 0, seed: 0,
  economy: { business14: { history: [], round: 0, byProject: { p19: { stock: 5, unitsSold: 0 } } } } });
async function stored(context, key = KEY) {
  const state = await context.storageState();
  return state.origins.find(o => o.origin === 'http://127.0.0.1:4173')?.localStorage.find(r => r.name === key)?.value;
}

test('старое сохранение с бизнесом: восстановление полей, экспорт и повторная загрузка без начислений', async ({ page }) => {
  await openGame(page); const input = legacy();
  await importFile(page, input); await expect(page.locator('#toast')).toHaveText('Сохранение восстановлено');
  await tab(page, 'inventory23'); await expect(page.locator('[data-warehouse-capacity="p19"]')).toContainText('Вместимость: 5/100');
  const before = await exportSave(page);
  expect(before.cash).toBe(20000); expect(before.debt).toBe(500); expect(before.owned).toEqual([0]);
  await page.reload(); const restored = await exportSave(page);
  for (const key of ['cash', 'debt', 'ledger', 'owned', 'projects']) expect(restored[key]).toEqual(before[key]);
  await importFile(page, before); await expect(page.locator('#toast')).toHaveText('Сохранение восстановлено');
  const roundTrip = await exportSave(page);
  for (const key of ['cash', 'debt', 'ledger', 'owned', 'projects']) expect(roundTrip[key]).toEqual(before[key]);
});

test('повреждённый JSON и неверная вложенная структура не заменяют текущий прогресс', async ({ page }) => {
  await openGame(page); await courier(page); const before = await exportSave(page);
  for (const input of ['{broken', { ...before, economy: { ...before.economy, receivables: {} } }]) {
    await importFile(page, input); await expect(page.locator('#toast')).toContainText('Некорректный файл сохранения');
    expect(await cash(page)).toBe(before.cash);
    const after = await exportSave(page);
    for (const key of ['cash', 'debt', 'ledger', 'owned', 'projects', 'skills', 'workCount']) expect(after[key]).toEqual(before[key]);
    await page.reload(); expect(await cash(page)).toBe(before.cash);
  }
});

test('незавершённый договор после reload освобождается и выполняется заново без двойной оплаты', async ({ page }) => {
  await openGame(page); const fixture = await exportSave(page);
  fixture.economy.contracts11 = { seq: 500, lastDay: 1, active: null, history: [], pending: [], offers: [{ id: 500, job: 'w0', quote: 1000, delay: 1, risk: 0, expires: 3, taken: false }] };
  await importFile(page, fixture); await expect(page.locator('#toast')).toHaveText('Сохранение восстановлено');
  await tab(page, 'contracts11'); await page.locator('[data-contract11="500"]').click();
  await page.locator('#modal').getByRole('button', { name: 'Аптека — до 12:00', exact: true }).click();
  await page.reload(); await expect(page.locator('[data-save-notice]')).toContainText('Незавершённый');
  expect(await cash(page)).toBe(fixture.cash); await expect(page.locator('#modal')).toBeHidden();
  await page.locator('[data-contract11="500"]').click();
  for (const name of ['Аптека — до 12:00', 'Офис — до 13:00', 'Дом — до 15:00']) await page.locator('#modal').getByRole('button', { name, exact: true }).click();
  const submitted = await exportSave(page); expect(submitted.economy.contracts11.pending).toHaveLength(1); expect(submitted.workCount).toBe(1);
  await page.reload(); await sleep(page); const paid = await exportSave(page);
  expect(paid.ledger.filter(r => r.category === 'Поступление по договору')).toHaveLength(1);
  await page.reload(); const restored = await exportSave(page);
  expect(restored.cash).toBe(paid.cash); expect(restored.ledger).toEqual(paid.ledger);
});

test('обычная незавершённая смена не тратит ресурсы и не приносит денег при reload', async ({ page }) => {
  await openGame(page); const before = await exportSave(page);
  await tab(page, 'work'); await page.locator('[data-work="w0"]').click();
  await page.locator('#modal').getByRole('button', { name: 'Аптека — до 12:00', exact: true }).click(); await page.reload();
  await expect(page.locator('[data-save-notice]')).toContainText('начните его заново');
  const after = await exportSave(page);
  for (const key of ['cash', 'debt', 'energy', 'hours', 'ledger', 'skills', 'workCount']) expect(after[key]).toEqual(before[key]);
});

test.describe('повреждение локальных данных до запуска приложения', () => {
  // Входная фикстура браузерного хранилища, без выполнения JavaScript в игре.
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://127.0.0.1:4173', localStorage: [{ name: KEY, value: '{broken' }] }] } });
  test('ошибка видна, исходник скачивается, автосохранение не уничтожает его', async ({ page, context }) => {
    await page.goto('/index.html'); await expect(page.getByRole('heading', { name: 'Сохранение требует восстановления' })).toBeVisible();
    await page.locator('#savebtn').click(); expect(await stored(context)).toBe('{broken');
    await page.locator('#nav [data-tab="work"]').click(); await expect(page.getByRole('heading', { name: 'Сохранение требует восстановления' })).toBeVisible();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Скачать исходное сохранение', exact: true }).click()]);
    expect(await downloadText(download)).toBe('{broken');
    await page.reload(); expect(await stored(context)).toBe('{broken');
    await importFile(page, legacy(), true); await expect(page.locator('#toast')).toHaveText('Сохранение восстановлено');
    expect(await cash(page)).toBe(20000); await page.reload(); expect(await cash(page)).toBe(20000);
    await tab(page, 'guide'); const [original] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Скачать исходник до восстановления', exact: true }).click()]);
    expect(await downloadText(original)).toBe('{broken');
  });
  test('новая игра требует подтверждения и сохраняет повреждённый исходник отдельно', async ({ page }) => {
    await page.goto('/index.html');
    page.once('dialog', d => d.dismiss()); await page.getByRole('button', { name: 'Начать новую игру с подтверждением' }).click();
    await expect(page.getByRole('heading', { name: 'Сохранение требует восстановления' })).toBeVisible();
    page.once('dialog', d => d.accept()); await page.getByRole('button', { name: 'Начать новую игру с подтверждением' }).click();
    expect(await cash(page)).toBe(1500); await tab(page, 'guide');
    const [original] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Скачать исходник до восстановления', exact: true }).click()]);
    expect(await downloadText(original)).toBe('{broken');
  });
});
