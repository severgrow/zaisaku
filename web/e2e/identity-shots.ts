import { mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright-core';
import { preview } from 'vite';

const OUT = '/cursor/stores/bc-e7f2e0c6-f99a-409f-bbaa-d4b46ca4e062/media';
mkdirSync(OUT, { recursive: true });

const server = await preview({
  configFile: 'web/vite.config.ts',
  preview: { port: 4188, strictPort: true, host: '127.0.0.1' },
  logLevel: 'silent',
});

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page: Page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const errors: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().includes('favicon')) errors.push(msg.text());
});
page.on('response', (res) => {
  if (res.status() >= 400 && !res.url().includes('favicon')) errors.push(`${res.status()} ${res.url()}`);
});

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
  await page.waitForTimeout(600);
};

const feet = (tx: number, ty: number) => ({ x: tx * 32 + 16, y: ty * 32 + 24 });

await page.goto('http://127.0.0.1:4188/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.click('#go-world');
await page.waitForSelector('#world-host canvas');
await page.waitForTimeout(500);

const west = feet(10, 8);
await place({ locationId: 'district-01', x: west.x, y: west.y, facing: 'n' });
await page.screenshot({ path: `${OUT}/identity-desktop.png` });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const porch = feet(6, 8);
await place({ locationId: 'district-01', x: porch.x, y: porch.y, facing: 'n' });
await page.screenshot({ path: `${OUT}/identity-portrait.png` });

await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(400);
const duelDoor = feet(9, 12);
await place({ locationId: 'district-01', x: duelDoor.x, y: duelDoor.y, facing: 'w' });
await page.screenshot({ path: `${OUT}/identity-landscape.png` });

await page.setViewportSize({ width: 1280, height: 800 });
const home = feet(16, 18);
await place({ locationId: 'district-01', x: home.x, y: home.y, facing: 's' });
await page.waitForFunction(() => (document.querySelector('[data-prompt]')?.textContent ?? '').includes('Residence'));
await page.locator('#world-host canvas').click({ position: { x: 640, y: 400 } });
await page.keyboard.press('KeyE');
await page.waitForFunction(() => {
  const raw = localStorage.getItem('zaisaku.save.v1');
  return raw ? JSON.parse(raw).world.locationId === 'residence' : false;
});
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/identity-residence.png` });

await page.goto('http://127.0.0.1:4188/#/duel', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.locator('[data-act="begin-duel"]').first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/identity-duel.png` });

console.log(errors.length ? errors.join('\n') : 'no page errors');
await browser.close();
await server.close();
