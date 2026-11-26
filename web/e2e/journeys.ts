import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { Page } from 'playwright-core';
import { preview } from 'vite';
import { chooseAction, BALANCED } from '../../src/bots/heuristic.js';
import { snapBid } from '../../src/engine/bids.js';
import { createDuel, submit } from '../../src/engine/duel.js';
import { viewFor } from '../../src/engine/view.js';
import { decodeSave } from '../../src/persist/save.js';
import { launchBrowser } from './browser.js';

const out = process.env.E2E_OUT ?? '/tmp/zaisaku-e2e';
mkdirSync(out, { recursive: true });
const server = await preview({ configFile: 'web/vite.config.ts', preview: { port: 4195, strictPort: true, host: '127.0.0.1' }, logLevel: 'silent' });
const base = server.resolvedUrls!.local[0]!;
const browser = await launchBrowser();
const errors: string[] = [];

const watch = (page: Page): void => {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
};
const shot = async (page: Page, name: string) => {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} horizontal overflow`);
  await page.screenshot({ path: `${out}/${name}.png` });
};
const read = async (page: Page) => {
  const save = decodeSave(await page.evaluate(() => localStorage.getItem('zaisaku.save.v1')));
  assert.ok(save, 'The current save must decode');
  return save;
};
const act = (page: Page, id: string) => page.locator(`[data-act="${id}"]`);
const ready = (page: Page, place: string) => page.waitForFunction((place) => {
  const data = document.documentElement.dataset;
  return data.pose?.endsWith(`,${place}`) && data.nav === 'idle' && !document.querySelector('#world-host')?.hasAttribute('hidden');
}, place, { timeout: 12_000 });
const tap = async (page: Page, tx: number, ty: number, touch = false, offset = 16) => {
  const point = await page.evaluate(({ tx, ty, offset }) => {
    const rect = document.querySelector('#world-host canvas')!.getBoundingClientRect();
    const [x, y, zoom] = document.documentElement.dataset.cam!.split(',').map(Number);
    return { x: rect.left + rect.width / 2 + (tx * 32 + 16 - x! - rect.width / 2) * zoom!,
      y: rect.top + rect.height / 2 + (ty * 32 + offset - y! - rect.height / 2) * zoom! };
  }, { tx, ty, offset });
  const view = page.viewportSize()!;
  assert.ok(point.x >= 0 && point.y >= 0 && point.x < view.width && point.y < view.height, `Tile ${tx},${ty} off screen (${point.x},${point.y})`);
  if (touch) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
};
const walk = async (page: Page, x: number, y: number) => {
  await tap(page, x, y);
  await page.waitForFunction(({ x, y }) => {
    const [px, py] = (document.documentElement.dataset.pose ?? '').split(',').map(Number);
    return document.documentElement.dataset.nav === 'idle' && Math.hypot(px! - (x * 32 + 16), py! - (y * 32 + 16)) < 27;
  }, { x, y }, { timeout: 10_000 });
};

async function collectingAndStress() {
  const recording = process.env.E2E_RECORD ? { dir: `${out}/recordings`, size: { width: 1080, height: 675 } } : undefined;
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true, recordVideo: recording });
  const page = await context.newPage();
  watch(page);
  await page.goto(base);
  await page.click('#go-world');
  await ready(page, 'district-01');
  await shot(page, 'district-1440');
  for (const [width, height] of [[1280, 800], [390, 844], [360, 800], [844, 390]] as const) {
    await page.setViewportSize({ width, height });
    await page.waitForFunction(({ width, height }) => {
      const canvas = document.querySelector<HTMLCanvasElement>('#world-host canvas');
      return canvas?.width === width && canvas?.height === height;
    }, { width, height });
    await shot(page, `district-${width}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  const touchInput = await context.newCDPSession(page);
  const beforePinch = await page.locator('html').getAttribute('data-pose');
  const pinch = async (spreadFrom: number, spreadTo: number, zoom: string) => {
    const points = (spread: number) => [{ x: 195 - spread, y: 460, id: 1 }, { x: 195 + spread, y: 460, id: 2 }];
    await touchInput.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(spreadFrom) });
    await touchInput.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(spreadTo) });
    await touchInput.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForFunction((zoom) => document.documentElement.dataset.cam?.endsWith(`,${zoom}`), zoom, { timeout: 3_000 });
  };
  await pinch(40, 56, '2');
  await pinch(56, 40, '1.5');
  assert.equal(await page.locator('html').getAttribute('data-pose'), beforePinch);
  await tap(page, 16, 19, true);
  await ready(page, 'residence');
  await shot(page, 'residence-390');
  await page.waitForTimeout(450);
  await tap(page, 7, 8, true);
  await ready(page, 'district-01');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(200);
  await walk(page, 12, 14);
  await walk(page, 10, 10);
  await tap(page, 8, 7);
  await page.locator('.world-panel.talk .bust').waitFor();
  await shot(page, 'ivo-dialogue');
  await page.locator('[data-opens="merchant"]').click();
  await act(page, 'buy').first().click();
  const bought = await read(page);
  const item = bought.profile.inventory[0];
  assert.ok(item, 'The purchase appears in the vault');
  await shot(page, 'market-world');
  await act(page, 'close-panel').click();
  await act(page, 'world-vault').click();
  await act(page, 'inspect-vault').click();
  assert.ok((await read(page)).profile.inventory[0]?.revealedProps.length);
  await shot(page, 'item-inspection');
  await act(page, 'close-panel').click();
  await walk(page, 11, 12);
  await walk(page, 16, 16);
  await tap(page, 16, 19);
  await ready(page, 'residence');
  await tap(page, 10, 3);
  await page.locator('[data-opens="display"]').click();
  await act(page, 'place').click();
  assert.equal((await read(page)).world.displays['shelf-a'], item.id);
  await page.waitForFunction(() => document.documentElement.dataset.worldDisplays === '1');
  await act(page, 'close-panel').click();
  await shot(page, 'residence-display');
  await page.reload();
  await ready(page, 'residence');
  await page.waitForFunction(() => document.documentElement.dataset.worldDisplays === '1');
  const restored = await read(page);
  assert.deepEqual(restored.profile.wallets, bought.profile.wallets);
  assert.equal(restored.world.displays['shelf-a'], item.id);
  await tap(page, 7, 8);
  await ready(page, 'district-01');
  await walk(page, 12, 14);
  await walk(page, 10, 10);
  await tap(page, 8, 7);
  await page.locator('[data-opens="merchant"]').click();
  await act(page, 'close-panel').click();
  await act(page, 'world-vault').click();
  await act(page, 'sell-vault').click();
  const sold = await read(page);
  assert.ok(!sold.profile.inventory.some((owned) => owned.id === item.id));
  assert.equal(sold.world.displays['shelf-a'], null);
  await act(page, 'close-panel').click();
  await walk(page, 12, 14);
  await walk(page, 16, 16);
  for (let trip = 0; trip < 4; trip += 1) {
    await tap(page, 16, 19);
    await ready(page, 'residence');
    await page.waitForFunction(() => document.documentElement.dataset.worldDisplays === '0');
    await page.waitForTimeout(450);
    await tap(page, 7, 8);
    await ready(page, 'district-01');
    await page.waitForTimeout(500);
    await act(page, 'world-vault').click();
    await act(page, 'close-panel').click();
  }
  assert.equal(await page.locator('#world-host canvas').count(), 1);
  await page.goto(`${base}#/contracts`);
  await page.locator('[data-screen="contracts"]').waitFor();
  await shot(page, 'requests');
  const requests = (await read(page)).profile.requests;
  await page.goto(`${base}#/settings`);
  await act(page, 'motion').filter({ hasText: 'Reduce' }).click();
  await act(page, 'type').click();
  await act(page, 'sound').click();
  await page.fill('#collector', 'Łucja Żur');
  await page.locator('[data-act="rename"] button').click();
  await shot(page, 'settings');
  await page.goto(`${base}#/auction`);
  await act(page, 'open-auction').click();
  await act(page, 'auction-bid').first().click();
  const escrow = await read(page);
  assert.ok(escrow.profile.wallets.reserved > 0);
  await shot(page, 'auction-escrow');
  const reopened = await context.newPage();
  watch(reopened);
  await reopened.goto(`${base}#/auction`);
  await reopened.locator('[data-screen="auction"]').waitFor();
  const latest = await read(reopened);
  assert.equal(latest.profile.auction?.id, escrow.profile.auction?.id);
  assert.deepEqual(latest.profile.wallets, escrow.profile.wallets);
  assert.deepEqual(latest.profile.requests, requests);
  assert.equal(latest.world.locationId, 'district-01');
  assert.equal(latest.world.displays['shelf-a'], null);
  assert.equal(latest.profile.name, 'Łucja Żur');
  assert.deepEqual(latest.settings, { reducedMotion: 'reduce', sound: true, largeText: true });
  const video = page.video();
  await context.close();
  if (video) await video.saveAs(`${out}/collecting-and-exploration.webm`);
  return { item: item.definitionId, transitions: 8, reopened: true, touchResidence: true, pinchZoom: true };
}

function bidFixture(): { seed: number; offer: number } {
  for (let seed = 1; seed < 100; seed += 1) {
    const game = createDuel(seed);
    const view = viewFor(game, 'p0');
    for (const [offer, item] of view.offers.entries()) {
      const aimed = snapBid(Math.floor(item.quote.liquidation * 0.85), view.minBid, view.increment);
      const first = submit(game, 'p0', { type: 'bid', instanceId: item.instanceId, amount: aimed || view.minBid });
      if (!first.ok) continue;
      const second = submit(first.value, 'p1', chooseAction(viewFor(first.value, 'p1'), BALANCED));
      if (second.ok && viewFor(second.value, 'p0').inventory.length) return { seed, offer };
    }
  }
  throw new Error('No fixture for the sale round');
}

async function duel(width: number, height: number) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 900 });
  const page = await context.newPage();
  watch(page);
  const fixture = bidFixture();
  await page.addInitScript((seed) => {
    const original = Crypto.prototype.getRandomValues;
    Crypto.prototype.getRandomValues = function (array) {
      if (array instanceof Uint32Array && array.length === 1) { array[0] = seed; return array; }
      return original.call(this, array) as typeof array;
    };
  }, fixture.seed);
  await page.goto(`${base}#/duel`);
  await page.click('#begin-duel');
  const round = async (n: number) => page.locator('.instrument-clock').getByText(`R${n}/6`, { exact: true }).waitFor();
  await round(1);
  assert.equal(await page.locator('.instrument-detail h2').count(), 1);
  const firstClock = await page.locator('[data-timer]').innerText();
  await page.waitForFunction((firstClock) => document.querySelector('[data-timer]')?.textContent !== firstClock, firstClock);
  await page.locator('[data-kind="offer"]').nth(fixture.offer).click();
  const bid = await page.locator('#bid-amount').innerText();
  await act(page, 'bid-inc').click();
  assert.notEqual(await page.locator('#bid-amount').innerText(), bid);
  await act(page, 'bid-dec').click();
  assert.equal(await page.locator('#bid-amount').innerText(), bid);
  await shot(page, `duel-six-round-${width}`);
  await act(page, 'lock-bid').click();
  await round(2);
  await page.locator('[data-kind="own"]').first().click();
  await act(page, 'sell').click();
  await round(3);
  await page.locator('[data-kind="offer"]').first().click();
  await act(page, 'inspect').click();
  await round(4);
  await act(page, 'pass').click();
  await round(5);
  await round(6); // A real countdown elapses and the timeout advances the round.
  await act(page, 'pass').click();
  const complete = await read(page);
  assert.equal(complete.duel?.phase, 'complete');
  assert.equal(complete.lastResult?.decisions.length, 6);
  const decisions = complete.duel?.actionLog.filter((entry) => entry.player === 'p0');
  assert.deepEqual(decisions?.map((entry) => entry.action.type), ['bid', 'sell', 'inspect', 'pass', 'pass', 'pass']);
  assert.equal(decisions?.[4]?.expired, true);
  assert.equal(complete.profile.wallets.permanent, 2400);
  assert.equal(complete.profile.inventory.length, 0);
  await page.getByRole('link', { name: 'Read the result' }).click();
  await shot(page, `duel-results-${width}`);
  await page.getByRole('link', { name: 'Return to district' }).click();
  await ready(page, 'district-01');
  await context.close();
  return { width, height, rounds: 6, decisions: decisions?.map((entry) => entry.action.type), expired: true };
}

try {
  const tasks = await Promise.allSettled([collectingAndStress(), duel(1440, 900), duel(390, 844), duel(360, 800), duel(844, 390)]);
  const report = tasks.map((result) => result.status === 'fulfilled' ? result.value : { error: String(result.reason) });
  writeFileSync(`${out}/journeys.json`, JSON.stringify({ report, errors }, null, 2) + '\n');
  console.log(JSON.stringify({ report, errors }, null, 2));
  assert.ok(tasks.every((task) => task.status === 'fulfilled') && !errors.length, 'Browser journeys reported failures');
} finally {
  await browser.close();
  await server.close();
}
