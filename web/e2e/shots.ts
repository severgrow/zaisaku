import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { decodeSave } from '../../src/persist/save.js';
import { preview } from 'vite';
import type { Page } from 'playwright-core';

const OUT = '/cursor/stores/bc-e7f2e0c6-f99a-409f-bbaa-d4b46ca4e062/media';
mkdirSync(OUT, { recursive: true });

const server = await preview({
  configFile: 'web/vite.config.ts',
  preview: { port: 4179, strictPort: true, host: '127.0.0.1' },
  logLevel: 'silent',
});
console.log('preview', server.resolvedUrls);

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const problems: string[] = [];

const open = async (width: number, height: number) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon')) errors.push(`${res.status()} ${res.url()}`);
  });
  await page.goto('http://127.0.0.1:4179/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-screen="home"]');
  return { page, errors };
};

const overflow = async (page: Page, name: string) => {
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (extra > 1) problems.push(`${name} overflows by ${extra}px`);
};

const shot = async (page: Page, file: string, name: string) => {
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: false });
  await overflow(page, name);
};

const home = async (width: number, height: number, file: string) => {
  const { page, errors } = await open(width, height);
  await shot(page, file, file);
  if (errors.length) problems.push(`${file}: ${errors.join(' | ')}`);
  await page.close();
};

const duel = async (width: number, height: number, file: string) => {
  const { page, errors } = await open(width, height);
  await page.locator('a[href="#/duel"]:visible').first().click();
  await page.click('#begin-duel');
  await page.waitForSelector('.lot');
  await page.click('.lot');
  await shot(page, file, file);
  if (errors.length) problems.push(`${file}: ${errors.join(' | ')}`);
  await page.close();
};

const market = async (width: number, height: number, file: string) => {
  const { page, errors } = await open(width, height);
  await page.click('#go-market');
  await page.waitForSelector('[data-act="buy"]');
  await shot(page, file, file);
  if (errors.length) problems.push(`${file}: ${errors.join(' | ')}`);
  await page.close();
};

const auction = async (width: number, height: number, file: string) => {
  const { page, errors } = await open(width, height);
  await page.click('#go-auction');
  await page.click('[data-act="open-auction"]');
  await page.waitForSelector('.art');
  await shot(page, file, file);
  if (errors.length) problems.push(`${file}: ${errors.join(' | ')}`);
  await page.close();
};

const vault = async (width: number, height: number, file: string) => {
  const { page, errors } = await open(width, height);
  await page.locator('a[href="#/market"]:visible').first().click();
  await page.click('[data-act="buy"]');
  await page.waitForSelector('text=Bought');
  await page.locator('a[href="#/vault"]:visible').first().click();
  await page.waitForSelector('[data-act="sell-vault"]');
  await shot(page, file, file);
  if (errors.length) problems.push(`${file}: ${errors.join(' | ')}`);
  await page.close();
};

await home(390, 844, 'home-mobile.png');
await home(1280, 800, 'home-desktop.png');
await duel(390, 844, 'duel-mobile.png');
await duel(1280, 800, 'duel-desktop.png');
await market(390, 844, 'market-mobile.png');
await market(1280, 800, 'market-desktop.png');
await auction(390, 844, 'auction-mobile.png');
await auction(1280, 800, 'auction-desktop.png');
await vault(390, 844, 'vault-mobile.png');
await vault(1280, 800, 'vault-desktop.png');

// Full loop on a phone: duel action, market buy, vault, auction bid, reload.
const loop = await open(390, 844);
const page = loop.page;
await page.locator('a[href="#/duel"]:visible').first().click();
await page.click('#begin-duel');
await page.click('.lot');
await page.click('[data-act="lock-bid"]');
await page.waitForSelector('.log');
await page.locator('a[href="#/market"]:visible').first().click();
await page.click('[data-act="buy"]');
await page.click('[data-act="advance"]');
await page.locator('a[href="#/vault"]:visible').first().click();
await page.click('[data-act="inspect-vault"]');
await page.locator('a[href="#/auction"]:visible').first().click();
await page.click('[data-act="open-auction"]');
await page.click('[data-act="auction-bid"]');
const raw = await page.evaluate(() => localStorage.getItem('zaisaku.save.v1'));
const decoded = decodeSave(raw);
if (!decoded || decoded.profile.inventory.length < 1) problems.push('the loop did not keep a purchase');
await page.reload({ waitUntil: 'networkidle' });
const still = await page.locator('[data-screen]').getAttribute('data-screen');
const balance = await page.locator('.funds').innerText();
if (balance.includes('2,400')) problems.push(`reload did not keep the purchase: ${balance}`);
if (loop.errors.length) problems.push(`loop: ${loop.errors.join(' | ')}`);
console.log(JSON.stringify({ screen: still, balance, problems }, null, 2));
await page.close();
await browser.close();
await server.close();
if (problems.length) process.exit(1);
