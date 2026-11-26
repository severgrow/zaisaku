import { mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright-core';
import { preview } from 'vite';
import { BALANCED, chooseAction } from '../../src/bots/heuristic.js';
import { maxAffordableBid } from '../../src/engine/bids.js';
import { createDuel, submit } from '../../src/engine/duel.js';
import { viewFor } from '../../src/engine/view.js';
import { createProfile } from '../../src/economy/profile.js';
import { defaultSettings, encodeSave } from '../../src/persist/save.js';
import { defaultWorld } from '../../src/world/state.js';
import type { DuelAction, DuelState } from '../../src/engine/types.js';

const OUT = '/cursor/stores/bc-e7f2e0c6-f99a-409f-bbaa-d4b46ca4e062/media';
mkdirSync(OUT, { recursive: true });

const withBot = (state: DuelState, action: DuelAction): DuelState => {
  const mine = submit(state, 'p0', action);
  if (!mine.ok) throw new Error(mine.reason);
  let next = mine.value;
  if (next.phase === 'decide' && next.decisions.p0 && !next.decisions.p1) {
    const choice = chooseAction(viewFor(next, 'p1'), BALANCED);
    const bot = submit(next, 'p1', choice);
    if (!bot.ok) throw new Error(bot.reason);
    next = bot.value;
  }
  return next;
};

const visibleEffect = (state: DuelState): string | null => {
  const view = viewFor(state, 'p0');
  const ids = new Set(view.inventory.map((item) => item.definitionId));
  if (ids.has('amber-hourglass')) return 'amber-hourglass';
  if (ids.has('twin-left') && ids.has('twin-right')) return 'twins';
  if (ids.has('null-magnet') && [...view.offers, ...view.inventory].some((item) => item.category === 'electronics')) return 'null-magnet';
  if (view.knowledge) return 'tomorrow-receiver';
  if (view.inventory.some((item) => item.warning)) return 'red-box';
  if (ids.has('memory-lens')) return 'memory-lens';
  return null;
};

const holdEffect = (): { save: string; note: string } | null => {
  for (let seed = 1; seed < 240; seed += 1) {
    let state = createDuel(seed, { names: ['Guest', 'Clerk Vesper'], simulated: [false, true] });
    for (let guard = 0; guard < 8 && state.phase === 'decide'; guard += 1) {
      const found = visibleEffect(state);
      if (found) return { save: pack(state), note: `${found} seed ${seed} round ${state.round}` };
      const view = viewFor(state, 'p0');
      const target = view.offers.find((item) =>
        ['amber-hourglass', 'null-magnet', 'red-box', 'tomorrow-receiver', 'memory-lens', 'twin-left', 'twin-right'].includes(item.definitionId),
      );
      const amount = maxAffordableBid(view.cash, view.minBid, view.increment);
      const action: DuelAction = target && amount >= view.minBid ? { type: 'bid', instanceId: target.instanceId, amount } : { type: 'pass' };
      state = withBot(state, action);
    }
  }
  return null;
};

const sealedSave = (): string => {
  const state = createDuel(4, { names: ['Guest', 'Clerk Vesper'], simulated: [false, true] });
  const locked = submit(state, 'p0', { type: 'pass' });
  if (!locked.ok) throw new Error(locked.reason);
  return pack(locked.value);
};

const pack = (duel: DuelState): string =>
  encodeSave({
    version: 2,
    revision: 3,
    writer: 'duel-visual',
    profile: createProfile('Guest', 4),
    duel,
    settings: defaultSettings(),
    lastResult: duel.result,
    world: { ...defaultWorld(), x: 272, y: 408, facing: 'w' },
  });

const server = await preview({
  configFile: 'web/vite.config.ts',
  preview: { port: 4188, strictPort: true, host: '127.0.0.1' },
  logLevel: 'silent',
});

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const problems: string[] = [];

const open = async (width: number, height: number) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon')) errors.push(`${res.status()} ${res.url()}`);
  });
  await page.goto('http://127.0.0.1:4188/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-screen="home"]');
  return { page, errors };
};

const overflow = async (page: Page, name: string) => {
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (extra > 1) problems.push(`${name} overflows by ${extra}px`);
};

const shot = async (page: Page, file: string) => {
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: false });
  await overflow(page, file);
};

const begin = async (page: Page) => {
  await page.locator('a[href="#/duel"]:visible').first().click();
  await page.click('#begin-duel');
  await page.waitForSelector('.lot');
};

const playSix = async (page: Page, label: string) => {
  const seen = new Set<string>();
  for (let guard = 0; guard < 8; guard += 1) {
    const round = await page.locator('[data-round]').getAttribute('data-round');
    const done = await page.locator('.xu a[href="#/results"]').count();
    if (done > 0) break;
    if (round) seen.add(round);
    await page.click('[data-act="arm"][data-kind="pass"]');
    await page.click('[data-act="confirm"]');
    await page.waitForTimeout(80);
  }
  if ((await page.locator('.xu a[href="#/results"]').count()) === 0) {
    problems.push(`${label} did not finish six rounds (saw ${[...seen].join(',')})`);
  }
};

const { page, errors } = await open(1280, 800);
await begin(page);
const boxes = await page.evaluate(() => {
  const opp = document.querySelector('.xu-opp')?.getBoundingClientRect();
  const center = document.querySelector('.xu-center')?.getBoundingClientRect();
  const player = document.querySelector('.xu-player')?.getBoundingClientRect();
  return {
    opp: opp ? `${Math.round(opp.x)}:${Math.round(opp.width)}` : '',
    center: center ? `${Math.round(center.x)}:${Math.round(center.width)}` : '',
    player: player ? `${Math.round(player.x)}:${Math.round(player.width)}` : '',
    name: document.querySelector('.xu-player h2')?.textContent ?? '',
  };
});
console.log('desktop boxes', JSON.stringify(boxes));
await shot(page, 'duel-opening-desktop.png');
await page.locator('.lot').first().click({ force: true });
await shot(page, 'duel-object-selection.png');
await page.click('[data-act="bid-inc"]');
await page.click('[data-act="bid-inc"]');
await shot(page, 'duel-bid-adjustment.png');
await page.locator('.contract').scrollIntoViewIfNeeded();
await shot(page, 'duel-private-contract.png');
await page.click('[data-act="arm"][data-kind="bid"]');
await page.waitForSelector('.xu-confirm');
await page.locator('.xu-confirm').scrollIntoViewIfNeeded();
await shot(page, 'duel-sealed-decisions.png');
await page.click('[data-act="confirm"]');
await page.waitForSelector('.log');
await shot(page, 'duel-round-resolution.png');
await playSix(page, 'desktop');
await page.locator('.xu a[href="#/results"]').click();
await page.waitForSelector('.winner');
await shot(page, 'duel-final-results.png');
if (errors.length) problems.push(`desktop: ${errors.join(' | ')}`);
await page.close();

const mobile = await open(390, 844);
await begin(mobile.page);
await shot(mobile.page, 'duel-opening-portrait-mobile.png');
await mobile.page.click('.lot');
await shot(mobile.page, 'duel-object-selection-portrait.png');
await mobile.page.click('[data-act="bid-inc"]');
await shot(mobile.page, 'duel-bid-adjustment-portrait.png');
await mobile.page.locator('.contract').scrollIntoViewIfNeeded();
await shot(mobile.page, 'duel-private-contract-portrait.png');
await mobile.page.click('[data-act="arm"][data-kind="pass"]');
await mobile.page.waitForSelector('.xu-confirm');
await shot(mobile.page, 'duel-sealed-decisions-portrait.png');
await playSix(mobile.page, 'portrait');
await mobile.page.locator('.xu a[href="#/results"]').click();
await mobile.page.waitForSelector('.winner');
await shot(mobile.page, 'duel-final-results-portrait.png');
if (mobile.errors.length) problems.push(`portrait: ${mobile.errors.join(' | ')}`);
await mobile.page.close();

const effect = holdEffect();
const fxPage = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
fxPage.on('pageerror', (error) => problems.push(`effect: ${error.message}`));
await fxPage.goto('http://127.0.0.1:4188/#/duel', { waitUntil: 'networkidle' });
if (effect) {
  await fxPage.evaluate((raw) => localStorage.setItem('zaisaku.save.v1', raw), effect.save);
  await fxPage.reload({ waitUntil: 'networkidle' });
  await fxPage.waitForSelector('.xu');
  await shot(fxPage, 'duel-special-effect.png');
  console.log('effect', effect.note);
} else problems.push('no owned signature object in 80 seeds');
await fxPage.close();

const lamps = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await lamps.goto('http://127.0.0.1:4188/#/duel', { waitUntil: 'networkidle' });
await lamps.evaluate((raw) => localStorage.setItem('zaisaku.save.v1', raw), sealedSave());
await lamps.reload({ waitUntil: 'networkidle' });
await lamps.waitForSelector('.sealed-state');
await shot(lamps, 'duel-sealed-waiting.png');
await lamps.close();

const world = await open(1280, 800);
await world.page.evaluate(() => {
  const raw = localStorage.getItem('zaisaku.save.v1');
  if (!raw) return;
  const save = JSON.parse(raw) as { world: { x: number; y: number; facing: string; locationId: string }; revision: number };
  save.world = { ...save.world, locationId: 'district-01', x: 300, y: 408, facing: 'w' };
  save.revision += 1;
  localStorage.setItem('zaisaku.save.v1', JSON.stringify(save));
});
await world.page.goto('http://127.0.0.1:4188/#/world', { waitUntil: 'networkidle' });
await world.page.waitForSelector('#world-host canvas');
await world.page.waitForTimeout(800);
await shot(world.page, 'duel-entrance-district.png');
if (world.errors.length) problems.push(`world: ${world.errors.join(' | ')}`);
await world.page.close();

await browser.close();
await server.close();
console.log(JSON.stringify({ problems }, null, 2));
if (problems.length) process.exit(1);
