import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const outputDir = 'docs/screenshots';
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await desktop.goto('http://127.0.0.1:4173/dashboard.html?dashboard_mode=demo', { waitUntil: 'networkidle' });
  await desktop.screenshot({ path: `${outputDir}/dashboard-data-mode-desktop.png`, fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto('http://127.0.0.1:4173/dashboard.html?dashboard_mode=demo', { waitUntil: 'networkidle' });
  await mobile.screenshot({ path: `${outputDir}/dashboard-data-mode-mobile.png`, fullPage: true });
} finally {
  await browser.close();
}

console.log('dashboard screenshots captured');
