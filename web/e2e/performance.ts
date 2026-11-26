import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { preview } from 'vite';
import { launchBrowser } from './browser.js';

const out = process.env.E2E_OUT ?? '/tmp/zaisaku-e2e';
mkdirSync(out, { recursive: true });
const config = 'web/vite.config.ts';
const targets = [{ label: 'current', config, port: 4196 }];
if (process.env.E2E_BASELINE) targets.unshift({ label: 'baseline', config: join(process.env.E2E_BASELINE, config), port: 4197 });
const browser = await launchBrowser();
const report = [];

const sorted = (samples: number[]) => [...samples].sort((a, b) => a - b);
const median = (samples: number[]) => sorted(samples)[Math.floor(samples.length / 2)]!;

try {
  for (const target of targets) {
    const server = await preview({ configFile: target.config, preview: { port: target.port, strictPort: true, host: '127.0.0.1' }, logLevel: 'silent' });
    const url = server.resolvedUrls!.local[0]!;
    const laps = [];
    try {
      for (let index = 0; index < 3; index += 1) {
        const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const page = await context.newPage();
        const start = performance.now();
        await page.goto(url);
        await page.locator('#go-world').waitFor();
        const homeMs = Math.round(performance.now() - start);
        assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some((entry) => /\/phaser-/.test(entry.name))), false);
        const entering = performance.now();
        await page.click('#go-world');
        await page.waitForFunction(() => document.documentElement.dataset.pose?.endsWith(',district-01'));
        const worldMs = Math.round(performance.now() - entering);
        const images = await page.evaluate(() => {
          const pngs = (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter((entry) => entry.name.endsWith('.png'));
          return { count: pngs.length, bytes: pngs.reduce((total, file) => total + file.encodedBodySize, 0) };
        });
        const frames = await page.evaluate(async () => {
          const samples: number[] = [];
          let before = await new Promise<number>(requestAnimationFrame);
          for (let i = 0; i < 90; i += 1) {
            const now = await new Promise<number>(requestAnimationFrame);
            samples.push(now - before);
            before = now;
          }
          return samples;
        });
        const cdp = await context.newCDPSession(page);
        await cdp.send('Performance.enable');
        await cdp.send('HeapProfiler.collectGarbage');
        const before = (await cdp.send('Performance.getMetrics')).metrics.find(({ name }) => name === 'JSHeapUsedSize')!.value;
        for (let i = 0; i < 4; i += 1) {
          await page.goto(`${url}#/`);
          await page.click('#go-world');
          await page.locator('#world-host canvas').waitFor();
        }
        await cdp.send('Page.enable');
        await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
        await cdp.send('Page.setWebLifecycleState', { state: 'active' });
        await page.setViewportSize({ width: 844, height: 390 });
        await page.waitForFunction(() => document.querySelector<HTMLCanvasElement>('#world-host canvas')?.width === 844);
        const beforeMove = await page.evaluate(() => Number(document.documentElement.dataset.pose?.split(',')[0]));
        await page.keyboard.down('ArrowLeft');
        await page.waitForTimeout(350);
        await page.keyboard.up('ArrowLeft');
        const afterMove = await page.evaluate(() => Number(document.documentElement.dataset.pose?.split(',')[0]));
        assert.ok(afterMove < beforeMove, 'Keyboard movement resumes after freezing and resizing the page');
        assert.equal(await page.locator('#world-host canvas').count(), 1);
        await cdp.send('HeapProfiler.collectGarbage');
        const after = (await cdp.send('Performance.getMetrics')).metrics.find(({ name }) => name === 'JSHeapUsedSize')!.value;
        laps.push({ homeMs, worldMs, images, frameMedianMs: median(frames), frameP95Ms: sorted(frames)[85]!, jsHeapBeforeBytes: before, jsHeapAfterBytes: after });
        await context.close();
      }
      report.push({ label: target.label, runs: laps, medianHomeMs: median(laps.map((lap) => lap.homeMs)), medianWorldMs: median(laps.map((lap) => lap.worldMs)) });
    } finally {
      await server.close();
    }
  }
  const artifact = { browser: browser.version(), viewport: '1440×900', report };
  writeFileSync(`${out}/performance.json`, JSON.stringify(artifact, null, 2) + '\n');
  console.log(JSON.stringify(artifact, null, 2));
} finally {
  await browser.close();
}
