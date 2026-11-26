import { mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright-core';
import { preview } from 'vite';

const OUT = '/cursor/stores/bc-e7f2e0c6-f99a-409f-bbaa-d4b46ca4e062/media';
mkdirSync(OUT, { recursive: true });

const server = await preview({
  configFile: 'web/vite.config.ts',
  preview: { port: 4199, strictPort: true, host: '127.0.0.1' },
  logLevel: 'silent',
});

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const problems: string[] = [];

const shoot = async (page: Page, name: string, width: number, height: number): Promise<void> => {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/${name}.png` });
};

const place = async (page: Page, world: { locationId: string; x: number; y: number; facing: string }): Promise<void> => {
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
  await page.waitForFunction(() => (document.documentElement.dataset.anchors ?? '').includes('@'), undefined, { timeout: 15000 });
  await page.waitForTimeout(400);
};

const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const errors: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  const text = msg.text();
  if (msg.type() === 'error' && !text.includes('favicon') && !text.includes('404')) errors.push(text);
});
page.on('response', (res) => {
  if (res.status() >= 400 && !res.url().includes('favicon')) errors.push(`${res.status()} ${res.url()}`);
});

await page.goto('http://127.0.0.1:4199/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#go-world', { timeout: 15000 });
await page.click('#go-world');
await page.waitForSelector('#world-host canvas');
await page.waitForTimeout(700);

const feet = (tx: number, ty: number): { x: number; y: number } => ({ x: tx * 32 + 16, y: ty * 32 + 24 });
const district = feet(11, 10);
await place(page, { locationId: 'district-01', x: district.x, y: district.y, facing: 'n' });
const anchors = await page.evaluate(() => document.documentElement.dataset.anchors ?? '');
console.log('anchors', anchors);
for (const line of anchors.split(' ').filter(Boolean)) {
  const [, size, origin] = line.split(':');
  const [source, shown] = (size ?? '').split('@');
  if (!shown || !origin) {
    problems.push(`anchor missing ${line}`);
    continue;
  }
  const [sw, sh] = shown.split('x').map(Number);
  const [ow, oh] = (origin ?? '').split(',').map(Number);
  if (ow !== 0.5 || oh !== 1) problems.push(`origin ${line}`);
  if (source === '192x64' && (sw !== 96 || sh !== 32)) problems.push(`foreground scale ${line}`);
  if (source === '64x64' && (sw !== 32 || sh !== 32)) problems.push(`cell scale ${line}`);
}
await page.keyboard.down('ArrowUp');
await page.waitForTimeout(280);
await page.keyboard.up('ArrowUp');
await page.waitForTimeout(200);
await shoot(page, 'pack09-district-desktop', 1280, 800);

await shoot(page, 'pack09-district-portrait', 390, 844);
const canopy = feet(8, 14);
await place(page, { locationId: 'district-01', x: canopy.x, y: canopy.y, facing: 's' });
await shoot(page, 'pack09-district-landscape', 844, 390);

const home = feet(7, 5);
await page.setViewportSize({ width: 1280, height: 800 });
await place(page, { locationId: 'residence', x: home.x, y: home.y, facing: 'n' });
await shoot(page, 'pack09-residence', 1280, 800);

const besideIvo = feet(7, 7);
await page.setViewportSize({ width: 1280, height: 800 });
await place(page, { locationId: 'district-01', x: besideIvo.x, y: besideIvo.y, facing: 'e' });
const prompt = await page.locator('[data-prompt]').innerText().catch(() => '');
console.log('prompt', JSON.stringify(prompt));
await page.locator('#world-host canvas').click({ force: true, position: { x: 30, y: 120 } });
await page.keyboard.down('KeyE');
await page.waitForTimeout(400);
await page.keyboard.up('KeyE');
await page.waitForTimeout(300);
const talk = await page.locator('.talk').count();
if (!talk) problems.push(`conversation panel did not open (${prompt})`);
else await page.screenshot({ path: `${OUT}/pack09-conversation.png` });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://127.0.0.1:4199/#/duel', { waitUntil: 'networkidle' });
await page.click('#begin-duel');
await page.waitForSelector('.exchange');
await page.waitForTimeout(500);
const portrait = await page.evaluate(() => ({
  recess: getComputedStyle(document.querySelector('.exchange')!).backgroundImage,
  timer: document.querySelector('[data-timer]')?.textContent ?? '',
  bid: document.querySelector('.bidbox')?.textContent ?? '',
  trays: document.querySelectorAll('.object-tray').length,
  emptySlots: document.querySelectorAll('.object-tray .empty, .slot-empty').length,
  offers: document.querySelectorAll('.exchange .lot').length,
}));
console.log('duel-portrait', JSON.stringify(portrait));
if (!portrait.recess.includes('mobile-exchange-recess')) problems.push('portrait duel is missing the exchange recess');
if (!portrait.timer.trim()) problems.push('timer missing');
if (portrait.emptySlots) problems.push('empty tray slots');
if (!portrait.offers) problems.push('no objects on the table');
await page.screenshot({ path: `${OUT}/pack09-duel-portrait.png` });

await page.setViewportSize({ width: 360, height: 844 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/pack09-duel-narrow.png` });

console.log(JSON.stringify({ problems, errors: errors.slice(0, 12) }, null, 2));
await browser.close();
await server.close();
if (problems.length || errors.length) process.exit(1);
