import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { launchApp, type AppHandle } from './helpers';

// 앱 상세의 [이 앱 지우기]: 확인 창 → 끄고 보관소·설정을 지우고 홈으로. 만든 대화는 보관함으로 간다.

let handle: AppHandle | null = null;
test.afterEach(async () => {
  await handle?.cleanup();
  handle = null;
});

test('만든 앱을 켠 채로 지우면 확인 뒤 홈에서 사라지고, 보관소·설정에서 빠지고, 스레드는 보관함으로 간다', async () => {
  handle = await launchApp({ claude: 'in' });
  const { page, userData } = handle;
  await page.locator('.create-app-button').click({ timeout: 10_000 });
  await page.locator('.composer textarea').fill('build-demo');
  await page.locator('.composer textarea').press('Enter');
  await expect(page.locator('.build-box.is-done')).toBeVisible({ timeout: 60_000 });
  // 내 앱에 들어간 대화는 대화 화면에서 지우지 않는다(앱 상세에서 앱을 지운다)
  await expect(page.locator('.remove-thread')).toHaveCount(0);
  await page.locator('.build-box.is-done button').click();
  await expect(page.locator('.detail-page h1')).toHaveText('오늘 날짜');

  // 켜 둔 채로 지운다(지우기가 먼저 끈다)
  await page.locator('.detail-actions .toggle-button').click();
  await expect(page.locator('.detail-actions .toggle-button')).toHaveClass(/is-active/);
  const settings = () => JSON.parse(readFileSync(join(userData, 'settings.json'), 'utf8'));
  expect(settings().enabled).toContain('my.today');

  // Esc는 아무것도 지우지 않고 닫는다. 기본 초점은 [취소]
  await page.locator('[data-remove-app-open="my.today"]').click();
  const dialog = page.locator('[data-remove-app="my.today"]');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('h2')).toHaveText('오늘 날짜을(를) 지울까요?');
  await expect(dialog.getByRole('button', { name: '취소' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  expect(existsSync(join(userData, 'apps', 'my.today'))).toBe(true);

  // 확인하면 지우고 홈으로
  await page.locator('[data-remove-app-open="my.today"]').click();
  await page.locator('[data-confirm-remove="my.today"]').click();
  await expect(page.locator('.toast').last()).toContainText('오늘 날짜을(를) 지웠어요');
  await expect(page.locator('.app-header h1')).toHaveText('HackMac');
  await expect(page.locator('[data-card-details="my.today"]')).toHaveCount(0);
  await expect(page.locator('.thread-card')).toHaveCount(0);

  expect(existsSync(join(userData, 'apps', 'my.today'))).toBe(false);
  const s = settings();
  expect(s.enabled).not.toContain('my.today');
  expect(Object.keys(s.hotkeys).filter((k) => k.startsWith('my.today/'))).toEqual([]);
  expect(Object.keys(s.hotkeysPrevious).filter((k) => k.startsWith('my.today/'))).toEqual([]);
  // 스레드는 지우지 않고 보관함으로
  const threadsDir = join(userData, 'threads');
  expect(readdirSync(threadsDir).filter((n) => n !== '.archive')).toEqual([]);
  expect(readdirSync(join(threadsDir, '.archive'))).toHaveLength(1);
});

test('HackMac 기본 앱에는 [이 앱 지우기]가 없다', async () => {
  handle = await launchApp({ claude: 'in' });
  const page = handle.page;
  await page.locator('[data-card-details="hackmac.gtd-reminders"]').click({ timeout: 10_000 });
  await expect(page.locator('.detail-page h1')).toBeVisible();
  await expect(page.locator('.remove-app-button')).toHaveCount(0);
});

test('만드는 중인 대화를 지우면 확인 뒤 홈의 "만드는 중"에서 사라지고, 대화는 보관함으로 간다', async () => {
  handle = await launchApp({ claude: 'in' });
  const { page, userData } = handle;
  await page.locator('.create-app-button').click({ timeout: 10_000 });
  await page.locator('.composer textarea').fill('메뉴바에 시계');
  await expect(page.locator('.composer button[type=submit]')).toBeEnabled();
  await page.locator('.composer textarea').press('Enter');
  await expect(page.locator('.bubble-assistant').last()).toHaveText('echo:메뉴바에 시계', { timeout: 10_000 });
  await page.locator('.titlebar-back').click();
  await expect(page.locator('.thread-card')).toHaveCount(1);
  await page.locator('.thread-card').click();

  const open = page.locator('[data-remove-thread-open]');
  await expect(open).toBeEnabled();
  // Esc는 아무것도 지우지 않는다
  await open.click();
  const dialog = page.locator('[data-remove-thread]');
  await expect(dialog.locator('h2')).toHaveText("'메뉴바에 시계' 대화를 지울까요?");
  await expect(dialog.locator('.modal-list li').first()).toHaveText('주고받은 글 2개');
  await expect(dialog.locator('.modal-warning')).toContainText('[레시피 만들기]');
  await expect(dialog.getByRole('button', { name: '취소' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  await open.click();
  await page.locator('[data-confirm-remove-thread]').click();
  await expect(page.locator('.toast').last()).toContainText("'메뉴바에 시계' 대화를 지웠어요");
  await expect(page.locator('.app-header h1')).toHaveText('HackMac');
  await expect(page.locator('.thread-card')).toHaveCount(0);

  const threadsDir = join(userData, 'threads');
  expect(readdirSync(threadsDir).filter((n) => n !== '.archive')).toEqual([]);
  expect(readdirSync(join(threadsDir, '.archive'))).toHaveLength(1);
});
