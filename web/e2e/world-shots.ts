import { mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright-core';
import { preview } from 'vite';
import { decodeSave } from '../../src/persist/save.js';

const OUT = '/cursor/stores/bc-e7f2e0c6-f99a-409f-bbaa-d4b46ca4e062/media';
mkdirSync(OUT, { recursive: true });

const server = await preview({
  configFile: 'web/vite.config.ts',
  preview: { port: 4181, strictPort: true, host: '127.0.0.1' },
  logLevel: 'silent',
});

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const problems: string[] = [];
const page: Page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const errors: string[] = [];
const urls: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  const text = msg.text();
  if (msg.type() === 'error' && !text.includes('favicon') && !text.includes('404')) errors.push(text);
});
page.on('response', (res) => {
  urls.push(res.url());
  if (res.status() >= 400 && !res.url().includes('favicon')) errors.push(`${res.status()} ${res.url()}`);
});

await page.goto('http://127.0.0.1:4181/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#go-world');
if (urls.some((url) => url.includes('phaser'))) problems.push('terminal startup downloaded phaser');

await page.click('#go-world');
await page.waitForSelector('#world-host canvas');
await page.waitForTimeout(700);
const before = await page.evaluate(() => {
  const canvas = document.querySelector('#world-host canvas');
  if (!(canvas instanceof HTMLCanvasElement)) return null;
  const pen = canvas.getContext('2d');
  const pixel = pen?.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
  return pixel ? Array.from(pixel) : null;
});
await page.keyboard.down('ArrowUp');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/district-walk.png` });
await page.waitForTimeout(500);
await page.keyboard.up('ArrowUp');
await page.waitForTimeout(200);
const after = await page.evaluate(() => {
  const canvas = document.querySelector('#world-host canvas');
  if (!(canvas instanceof HTMLCanvasElement)) return null;
  const pen = canvas.getContext('2d');
  const pixel = pen?.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
  return { pixel: pixel ? Array.from(pixel) : null, frameMs: document.documentElement.dataset.frameMs ?? '', canvases: document.querySelectorAll('#world-host canvas').length };
});
if (!before || !after?.pixel) problems.push('world canvas missing');
if (after && Number(after.frameMs) <= 0) problems.push('frame time was not measured');
await page.screenshot({ path: `${OUT}/district-desktop.png` });

await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/district-mobile.png` });
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/district-portrait.png` });

const place = async (world: { locationId: string; x: number; y: number; facing: string }) => {
  await page.evaluate((pose) => {
    const raw = localStorage.getItem('zaisaku.save.v1');
    if (!raw) return;
    const save = JSON.parse(raw) as { world: typeof pose; revision: number };
    save.world = { ...save.world, ...pose };
    save.revision += 1;
    localStorage.setItem('zaisaku.save.v1', JSON.stringify(save));
  }, world);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#world-host canvas');
  await page.waitForTimeout(500);
};

await page.setViewportSize({ width: 1280, height: 800 });
await place({ locationId: 'district-01', x: 8 * 32 + 16, y: 8 * 32 + 24, facing: 'n' });
const nearMerchant = await page.evaluate(() => ({
  prompt: document.querySelector('[data-prompt]')?.textContent ?? '',
  world: JSON.parse(localStorage.getItem('zaisaku.save.v1') ?? '{}').world,
}));
console.log('near-merchant', JSON.stringify(nearMerchant));
await page.locator('#world-host canvas').click({ force: true, position: { x: 12, y: 80 } });
await page.keyboard.down('KeyE');
await page.waitForTimeout(350);
await page.keyboard.up('KeyE');
await page.waitForSelector('.world-panel');
await page.screenshot({ path: `${OUT}/merchant-desktop.png` });
const beforeBuy = decodeSave(await page.evaluate(() => localStorage.getItem('zaisaku.save.v1')));
const plated = page.locator('.world-panel article:has(img.art) [data-act="buy"]');
if (await plated.count()) await plated.first().click();
else await page.locator('.world-panel [data-act="buy"]').first().click();
await page.waitForSelector('text=Bought');
const bought = decodeSave(await page.evaluate(() => localStorage.getItem('zaisaku.save.v1')));
if (!bought || !beforeBuy || bought.profile.inventory.length !== beforeBuy.profile.inventory.length + 1) problems.push('merchant purchase did not enter the vault');
if (bought && beforeBuy && bought.profile.wallets.permanent >= beforeBuy.profile.wallets.permanent) problems.push('purchase did not spend Zai');
const ownedId = bought?.profile.inventory.at(-1)?.id ?? '';

await place({ locationId: 'residence', x: 7 * 32 + 16, y: 6 * 32 + 24, facing: 's' });
await page.screenshot({ path: `${OUT}/residence-desktop.png` });
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/residence-mobile.png` });

await page.setViewportSize({ width: 1280, height: 800 });
await place({ locationId: 'residence', x: 10 * 32 + 16, y: 4 * 32 + 24, facing: 'n' });
await page.locator('#world-host canvas').click({ force: true, position: { x: 12, y: 80 } });
await page.keyboard.down('KeyE');
await page.waitForTimeout(350);
await page.keyboard.up('KeyE');
await page.waitForSelector('[data-act="place"]');
await page.locator(`[data-act="place"][data-id="${ownedId}"]`).click();
await page.waitForSelector('text=It is on the shelf');
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#world-host canvas');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/residence-display.png` });
const displayed = decodeSave(await page.evaluate(() => localStorage.getItem('zaisaku.save.v1')));
if (displayed?.world.displays['shelf-a'] !== ownedId && displayed?.world.displays['shelf-b'] !== ownedId) problems.push('displayed object did not survive reload');
await page.locator('#world-host canvas').click({ force: true, position: { x: 12, y: 80 } });
await page.keyboard.down('KeyE');
await page.waitForTimeout(350);
await page.keyboard.up('KeyE');
await page.waitForSelector('.world-panel');
await page.locator('[data-act="world-vault"]').click();
await page.locator(`.world-panel [data-act="sell-vault"][data-id="${ownedId}"]`).click();
await page.waitForSelector('text=Sold');
const cleared = decodeSave(await page.evaluate(() => localStorage.getItem('zaisaku.save.v1')));
if (cleared?.world.displays['shelf-a'] === ownedId || cleared?.world.displays['shelf-b'] === ownedId) problems.push('sold object stayed on the shelf');

await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://127.0.0.1:4181/#/', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/terminal-portrait.png` });
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto('http://127.0.0.1:4181/#/workshop', { waitUntil: 'networkidle' });
await page.waitForSelector('[data-workshop] canvas');
await page.screenshot({ path: `${OUT}/workshop-desktop.png` });

const hostHidden = await page.evaluate(() => document.querySelector('#world-host')?.hasAttribute('hidden') === true);
if (!hostHidden) problems.push('workshop left the world host visible');

console.log(JSON.stringify({ frameMs: after?.frameMs, canvases: after?.canvases, problems, errors: errors.slice(0, 8) }, null, 2));
await browser.close();
await server.close();
if (problems.length || errors.length) process.exit(1);
