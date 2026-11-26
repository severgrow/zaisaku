import { mkdirSync } from 'node:fs';
import { chromium, type Page } from 'playwright-core';
import { preview } from 'vite';

const OUT = process.env.E2E_OUT ?? '/tmp/zaisaku-e2e';
mkdirSync(OUT, { recursive: true });

const server = await preview({
  configFile: 'web/vite.config.ts',
  preview: { port: 4193, strictPort: true, host: '127.0.0.1' },
  logLevel: 'silent',
});

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const problems: string[] = [];

const poseOf = async (page: Page): Promise<{ x: number; y: number; facing: string; location: string; nav: string }> => {
  const raw = await page.evaluate(() => ({
    pose: document.documentElement.dataset.pose ?? '',
    nav: document.documentElement.dataset.nav ?? '',
  }));
  const [x, y, facing, location] = raw.pose.split(',');
  return { x: Number(x), y: Number(y), facing: facing ?? '', location: location ?? '', nav: raw.nav };
};

const clickTile = async (page: Page, tx: number, ty: number): Promise<boolean> => {
  const point = await page.evaluate(({ tx, ty }) => {
    const canvas = document.querySelector('#world-host canvas');
    const rect = canvas instanceof HTMLElement ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const cam = (document.documentElement.dataset.cam ?? '0,0,2').split(',').map(Number);
    const scrollX = cam[0] ?? 0;
    const scrollY = cam[1] ?? 0;
    const zoom = cam[2] || 2;
    const midX = scrollX + rect.width / 2;
    const midY = scrollY + rect.height / 2;
    const worldX = tx * 32 + 16;
    const worldY = ty * 32 + 16;
    return { x: rect.left + rect.width / 2 + (worldX - midX) * zoom, y: rect.top + rect.height / 2 + (worldY - midY) * zoom };
  }, { tx, ty });
  const view = page.viewportSize();
  if (!view || point.x < 16 || point.y < 78 || point.x > view.width - 16 || point.y > view.height - 16) return false;
  await page.mouse.click(point.x, point.y);
  return true;
};

const waitNear = async (page: Page, tx: number, ty: number): Promise<void> => {
  await page.waitForFunction(
    ({ tx, ty }) => {
      const pose = document.documentElement.dataset.pose ?? '';
      const [x, y] = pose.split(',').map(Number);
      const nav = document.documentElement.dataset.nav;
      return nav !== 'walk' && Math.hypot(x - (tx * 32 + 16), y - (ty * 32 + 16)) < 56;
    },
    { tx, ty },
    { timeout: 12_000 },
  );
};

const openWorld = async (page: Page): Promise<void> => {
  await page.goto('http://127.0.0.1:4193/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('#go-world');
  await page.waitForSelector('#world-host canvas');
  await page.waitForFunction(() => (document.documentElement.dataset.pose ?? '').includes('district-01'), null, { timeout: 10_000 });
  await page.waitForTimeout(400);
};

const assertChrome = async (page: Page, label: string): Promise<void> => {
  const chrome = await page.evaluate(() => ({
    joy: document.querySelector('[data-joy]') !== null,
    use: document.querySelector('.use') !== null || document.querySelector('[data-act="world-interact"]') !== null,
    bar: document.querySelector('.hud-bar') !== null,
  }));
  if (chrome.joy) problems.push(`${label}: joystick still present`);
  if (chrome.use) problems.push(`${label}: permanent Use still present`);
  if (!chrome.bar) problems.push(`${label}: balance bar missing`);
};

const errors: string[] = [];
const attach = (page: Page): void => {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('favicon') && !text.includes('404')) errors.push(text);
  });
};

const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: '/tmp/nav-video', size: { width: 1280, height: 800 } },
});
const page = await context.newPage();
attach(page);

try {
  await openWorld(page);
  await assertChrome(page, 'desktop');
  const start = await poseOf(page);

  const east = await clickTile(page, 20, 16);
  if (!east) problems.push('first ground tap was off screen');
  await page.waitForFunction(() => document.documentElement.dataset.nav === 'walk', null, { timeout: 4_000 });
  await page.waitForTimeout(450);
  const retarget = await clickTile(page, 14, 13);
  if (!retarget) problems.push('cancel tap was off screen');
  await waitNear(page, 14, 13);
  const walked = await poseOf(page);
  if (Math.hypot(walked.x - start.x, walked.y - start.y) < 20) problems.push('character did not walk');

  if (!(await clickTile(page, 10, 10))) problems.push('approach tap was off screen');
  await waitNear(page, 10, 10);
  if (!(await clickTile(page, 8, 7))) problems.push('merchant tap was off screen');
  await page.waitForSelector('.world-panel.talk', { timeout: 10_000 });
  await page.waitForTimeout(350);
  await assertChrome(page, 'merchant');
  await page.screenshot({ path: `${OUT}/nav-desktop.png` });

  await page.click('[data-act="close-panel"]');
  await page.waitForFunction(() => document.documentElement.dataset.nav === 'idle');
  if (!(await clickTile(page, 15, 13))) {
    if (!(await clickTile(page, 15, 12))) problems.push('npc tap was off screen');
  }
  await page.waitForSelector('.world-panel.talk', { timeout: 10_000 });
  await page.waitForTimeout(250);
  await page.click('[data-act="close-panel"]');
  await page.waitForFunction(() => document.documentElement.dataset.nav === 'idle');

  if (!(await clickTile(page, 16, 16))) problems.push('door approach was off screen');
  await waitNear(page, 16, 16);
  if (!(await clickTile(page, 16, 19))) problems.push('door tap was off screen');
  await page.waitForFunction(() => (document.documentElement.dataset.pose ?? '').includes('residence'), null, { timeout: 12_000 });
  await page.waitForTimeout(500);
  const inside = await poseOf(page);
  if (inside.location !== 'residence') problems.push('residence door did not enter');
  await assertChrome(page, 'residence');
} catch (error) {
  problems.push(error instanceof Error ? error.message : String(error));
  await page.screenshot({ path: `${OUT}/nav-desktop.png` }).catch(() => undefined);
}

const video = page.video();
await page.close();
await context.close();
if (video) {
  const webm = await video.path();
  const { spawnSync } = await import('node:child_process');
  const encoded = spawnSync('ffmpeg', ['-y', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an', `${OUT}/nav-demo.mp4`], { encoding: 'utf8' });
  if (encoded.error && 'code' in encoded.error && encoded.error.code === 'ENOENT') {
    const { copyFileSync } = await import('node:fs');
    copyFileSync(webm, `${OUT}/nav-demo.webm`);
  } else if (encoded.status !== 0) {
    problems.push(`ffmpeg failed: ${encoded.stderr.slice(-400)}`);
  }
}

const shot = async (width: number, height: number, file: string): Promise<void> => {
  const extra = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  attach(extra);
  try {
    await openWorld(extra);
    await assertChrome(extra, file);
    const before = await poseOf(extra);
    const step = width > height ? { tx: 18, ty: 16 } : { tx: 16, ty: 14 };
    if (!(await clickTile(extra, step.tx, step.ty))) problems.push(`${file}: walk tap off screen`);
    await waitNear(extra, step.tx, step.ty);
    const after = await poseOf(extra);
    if (Math.hypot(after.x - before.x, after.y - before.y) < 12) problems.push(`${file}: character did not walk`);
    const npc = await clickTile(extra, 15, 13);
    if (npc) {
      await extra.waitForSelector('.world-panel.talk', { timeout: 8_000 });
      await extra.waitForTimeout(300);
    }
    await assertChrome(extra, file);
    await extra.screenshot({ path: `${OUT}/${file}` });
  } catch (error) {
    problems.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
    await extra.screenshot({ path: `${OUT}/${file}` }).catch(() => undefined);
  }
  await extra.close();
};

await shot(390, 844, 'nav-portrait.png');
await shot(844, 390, 'nav-landscape.png');

await browser.close();
await server.close();

if (errors.length) problems.push(...errors.slice(0, 6));
console.log(problems.length ? problems.join('\n') : 'nav proof ok');
if (problems.length) process.exitCode = 1;
