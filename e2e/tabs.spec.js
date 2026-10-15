const { test, expect, openGame, tab, cash, courier } = require('./helpers/game');

// Список реальных вкладок #nav, включая экраны всех модулей v0.4–v0.30.
const tabs = [
  'home', 'work', 'projects', 'market', 'finance', 'life', 'guide',
  'econ', 'opportunities', 'household', 'city', 'career', 'debt', 'tax',
  'bonuses', 'labour', 'audit8', 'planning', 'strategy10', 'contracts11',
  'business14', 'youtube15', 'video16', 'youtube17', 'realism', 'labour19',
  'cash_audit20', 'risk21', 'inventory23', 'suppliers26', 'team27',
  'training28', 'morale29', 'competition30',
];

test('регрессионный список охватывает все вкладки навигации', async ({ page }) => {
  await openGame(page);
  const actual = await page.locator('#nav button[data-tab]').evaluateAll(
    buttons => buttons.map(button => button.dataset.tab),
  );
  expect([...actual].sort()).toEqual([...tabs].sort());
});

for (const id of tabs) {
  test(`сохранение и перезагрузка вкладки ${id} сохраняют экран и заработанный прогресс`, async ({ page }) => {
    await openGame(page);
    await courier(page);
    const balance = await cash(page);
    const day = await page.locator('#day').innerText();
    const energy = await page.locator('#energy').innerText();
    await tab(page, id);
    const heading = await page.locator('#main h1').innerText();
    expect(heading.trim()).not.toBe('');
    await page.locator('#savebtn').click();
    await page.reload();
    await expect(page.locator('#main h1')).toHaveText(heading);
    await expect(page.locator(`#nav button[data-tab="${id}"]`)).toHaveClass(/active/);
    await expect(page.locator('#nav button.active')).toHaveCount(1);
    expect(await cash(page)).toBe(balance);
    await expect(page.locator('#day')).toHaveText(day);
    await expect(page.locator('#energy')).toHaveText(energy);
    await tab(page, 'work');
    await expect(page.locator('.job').filter({ has: page.locator('[data-work="w0"]') })).toContainText('Навык: 1');
    // Проверяем, что интерфейс после восстановления остаётся рабочим.
    await tab(page, id);
    await expect(page.locator('#main h1')).toHaveText(heading);
  });
}
