import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

export const launchBrowser = () => chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE ?? ['/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
