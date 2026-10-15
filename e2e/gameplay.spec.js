const { test, expect, openGame, tab, cash, sleep, courier } = require('./helpers/game');

test.beforeEach(async ({ page }) => openGame(page));

test('новая жизнь сбрасывает прогресс и позволяет начать игру из комнаты', async ({ page }) => {
  await courier(page);
  await sleep(page);
  await tab(page, 'guide');
  page.once('dialog', async dialog => {
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toContain('Начать новую игру?');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Начать новую жизнь', exact: true }).click();
  await expect(page.locator('#day')).toHaveText('1');
  expect(await cash(page)).toBe(1500);
  await expect(page.locator('#energy')).toHaveText('90%');
  await expect(page.locator('#main')).toContainText('Выполни одну подработку · 0/1');
  await page.getByRole('button', { name: /Работать/ }).click();
  await expect(page.locator('#main h1')).toHaveText('Мои проекты');
  await courier(page);
  await expect(page.locator('.job').filter({ has: page.locator('[data-work="w0"]') })).toContainText('Навык: 1');
});

test('основные вкладки показывают соответствующие экраны', async ({ page }) => {
  const screens = [
    ['work', 'Биржа подработок'],
    ['projects', 'Мои проекты'],
    ['market', 'Рынок идей и предприятий'],
    ['finance', 'Финансовый центр'],
    ['life', 'Быт, активы и обязательства'],
    ['guide', 'Справочник модели'],
    ['inventory23', 'Управление товарным бизнесом'],
    ['home', 'Моя жизнь'],
  ];
  for (const [id, heading] of screens) {
    await test.step(heading, async () => {
      await tab(page, id);
      await expect(page.locator('#main h1')).toHaveText(heading);
      await expect(page.locator('#nav button.active')).toHaveCount(1);
      await expect(page.locator('#main')).not.toBeEmpty();
    });
  }
});

test('первая доступная подработка проходится через мини-игру', async ({ page }) => {
  await courier(page);
  const card = page.locator('.job').filter({ has: page.locator('[data-work="w0"]') });
  await expect(card).toContainText('Навык: 1');
  await expect(page.locator('#energy')).toHaveText('65%');
  await tab(page, 'home');
  await expect(page.locator('.world-facts')).toContainText('8 ч');
  await expect(page.locator('#main')).toContainText('Выполни одну подработку · 1/1');
  await expect(page.locator('[data-mission="start"]')).toBeEnabled();
});

test('доход курьера увеличивает деньги и отражается в журнале', async ({ page }) => {
  const before = await cash(page);
  await courier(page);
  const after = await cash(page);
  expect(after).toBeGreaterThan(before);
  await tab(page, 'finance');
  const rows = page.locator('#main tbody tr');
  const incomeRow = rows.filter({ hasText: 'Курьер' }).filter({ hasText: 'Оплата труда' });
  const costRow = rows.filter({ hasText: 'Курьер' }).filter({ hasText: 'Рабочие издержки' });
  await expect(incomeRow).toHaveCount(1);
  await expect(costRow).toHaveCount(1);
  const amount = async row => Number((await row.locator('td').nth(3).innerText()).replace(/[^\d-]/g, ''));
  const gross = await amount(incomeRow);
  const costs = await amount(costRow);
  expect(gross).toBeGreaterThan(0);
  expect(costs).toBeLessThan(0);
  expect(after - before).toBe(gross + costs);
});

test('сон переводит на следующий день, восстанавливает ресурсы и списывает быт', async ({ page }) => {
  await courier(page);
  const before = await cash(page);
  await sleep(page);
  await expect(page.locator('#day')).toHaveText('2');
  await expect(page.locator('#energy')).toHaveText('100%');
  await expect(page.locator('.world-facts')).toContainText('12 ч');
  expect(await cash(page)).toBeLessThan(before);
  await tab(page, 'finance');
  await expect(page.locator('#main tbody tr').filter({ hasText: 'Личная жизнь' })).toHaveCount(5);
});

test('сохранённые деньги, день, энергия и навык переживают перезагрузку', async ({ page }) => {
  await courier(page);
  await sleep(page);
  await tab(page, 'work');
  const before = {
    cash: await page.locator('#cash').innerText(),
    day: await page.locator('#day').innerText(),
    energy: await page.locator('#energy').innerText(),
  };
  await page.getByRole('button', { name: /Сохранить/ }).click();
  await page.reload();
  await expect(page.locator('#cash')).toHaveText(before.cash);
  await expect(page.locator('#day')).toHaveText(before.day);
  await expect(page.locator('#energy')).toHaveText(before.energy);
  await expect(page.locator('#nav button[data-tab="work"]')).toHaveClass(/active/);
  await expect(page.locator('.job').filter({ has: page.locator('[data-work="w0"]') })).toContainText('Навык: 1');
  await tab(page, 'finance');
  await expect(page.locator('#main tbody tr').filter({ hasText: 'Оплата труда' })).toHaveCount(1);
});

test('товарный бизнес открывается на капитал, заработанный обычными сменами', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const progress = [];
  try {
    await tab(page, 'inventory23');
    await expect(page.locator('#main')).toContainText('Открой товарный проект');
    await page.getByRole('button', { name: 'Выбрать проект', exact: true }).click();
    const launch = page.locator('button[data-open="p19"]');
    const card = page.locator('.job').filter({ has: launch });
    await expect(card).toContainText(/Запуск: 25\s*000 ₽/);
    await expect(launch).toBeDisabled();

    // Обычная работа из биржи подработок: решаем видимую задачу веб-разработчика.
    // Доход случайный, поэтому проверяем достигнутую сумму, а не число смен.
    for (let shift = 0; shift < 40 && await cash(page) < 25000; shift++) {
      await tab(page, 'work');
      const job = page.locator('button[data-work="w11"]');
      if (await job.isDisabled()) {
        await sleep(page);
        await tab(page, 'work');
      }
      await expect(job, 'Веб-разработка должна быть доступна после отдыха').toBeEnabled();
      await job.click();
      const modal = page.locator('#modal');
      await expect(modal).toContainText('Веб-разработка: исправь формулу');
      await modal.getByRole('button', { name: 'total = price * quantity', exact: true }).click();
      await expect(modal).toBeHidden();
      progress.push({ shift: shift + 1, day: await page.locator('#day').innerText(), cash: await cash(page) });
    }
    const before = await cash(page);
    expect(before, 'За 40 обычных смен не удалось накопить 25 000 ₽; см. журнал прохождения').toBeGreaterThanOrEqual(25000);
    await tab(page, 'market');
    await expect(launch).toBeEnabled();
    await launch.click();
    await expect(launch).toHaveText('Открыт');
    await expect(launch).toBeDisabled();
    expect(await cash(page)).toBe(before - 25000);
    await tab(page, 'projects');
    await expect(page.locator('.job').filter({ hasText: 'Товарный бизнес' })).toContainText('Работает');
    await tab(page, 'inventory23');
    await expect(page.locator('#main h2')).toHaveText('Товарный бизнес');
    await expect(page.locator('[data-b23-buy="p19"][data-count="5"]')).toBeVisible();
    await page.getByRole('button', { name: /Сохранить/ }).click();
    await page.reload();
    await expect(page.locator('#main h2')).toHaveText('Товарный бизнес');
    expect(await cash(page)).toBe(before - 25000);
  } finally {
    await testInfo.attach('business-progression', {
      body: JSON.stringify(progress, null, 2), contentType: 'application/json',
    });
  }
});

// Регрессия порядка инициализации: сохранённый экран доступен при первом показе.
test('сохранённая вкладка товарного бизнеса восстанавливается без ошибок после перезагрузки', async ({ page }) => {
  await tab(page, 'inventory23');
  await expect(page.locator('#main h1')).toHaveText('Управление товарным бизнесом');
  await page.getByRole('button', { name: /Сохранить/ }).click();
  await page.reload();
  await expect(page.locator('#nav button[data-tab="inventory23"]')).toHaveClass(/active/);
  await expect(page.locator('#main h1')).toHaveText('Управление товарным бизнесом');
});
