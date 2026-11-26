import { mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright-core';
import { preview } from 'vite';

const OUT = '/cursor/stores/bc-e7f2e0c6-f99a-409f-bbaa-d4b46ca4e062/media';
mkdirSync(OUT, { recursive: true });

const server = await preview({
  configFile: 'web/vite.config.ts',
  preview: { port: 4182, strictPort: true, host: '127.0.0.1' },
  logLevel: 'silent',
});

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const problems: string[] = [];
const page: Page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const errors: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (msg) => {
  const text = msg.text();
  if (msg.type() === 'error' && !text.includes('favicon') && !text.includes('404')) errors.push(text);
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

await page.goto('http://127.0.0.1:4182/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.click('#go-world');
await page.waitForSelector('#world-host canvas');
await page.waitForTimeout(500);

const feet = (tx: number, ty: number) => ({ x: tx * 32 + 16, y: ty * 32 + 24 });

await page.setViewportSize({ width: 1280, height: 800 });
await place({ locationId: 'district-01', ...feet(16, 15), facing: 's' });
await page.screenshot({ path: `${OUT}/pack10-path-desktop.png` });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/pack10-path-portrait.png` });

await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/pack10-path-landscape.png` });

await page.setViewportSize({ width: 1280, height: 800 });
await place({ locationId: 'residence', ...feet(7, 6), facing: 'n' });
await page.screenshot({ path: `${OUT}/pack10-residence.png` });

await place({ locationId: 'district-01', ...feet(6, 8), facing: 'n' });
await page.screenshot({ path: `${OUT}/pack10-exchange.png` });

await place({ locationId: 'district-01', ...feet(25, 8), facing: 'n' });
await page.screenshot({ path: `${OUT}/pack10-research.png` });

await place({ locationId: 'district-01', ...feet(8, 8), facing: 'n' });
await page.locator('#world-host canvas').click({ force: true, position: { x: 12, y: 80 } });
await page.keyboard.press('KeyE');
await page.waitForSelector('.talk img');
const bust = await page.locator('.talk img').evaluate((node) => {
  const image = node as HTMLImageElement;
  return { src: image.currentSrc, width: image.naturalWidth, name: image.parentElement?.querySelector('h2')?.textContent ?? '' };
});
if (bust.width < 64) problems.push('bust did not load');
if (!bust.name) problems.push('conversation has no name');
await page.screenshot({ path: `${OUT}/pack10-conversation.png` });

console.log(JSON.stringify({ bust, problems, errors: errors.slice(0, 12) }, null, 2));
await browser.close();
await server.close();
if (problems.length || errors.length) process.exit(1);
