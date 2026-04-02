// capture.js — generates all Chrome Web Store assets as PNG
// Usage:
//   npm install playwright
//   node store/capture.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const ASSETS = [
  { file: 'screenshot-1.html', out: 'screenshot-1.png', w: 1280, h: 800 },
  { file: 'screenshot-2.html', out: 'screenshot-2.png', w: 1280, h: 800 },
  { file: 'screenshot-3.html', out: 'screenshot-3.png', w: 1280, h: 800 },
  { file: 'promo-tile.html',   out: 'promo-tile.png',   w: 440,  h: 280 },
  { file: 'marquee.html',      out: 'marquee.png',      w: 1400, h: 560 },
];

(async () => {
  const browser = await chromium.launch();

  for (const asset of ASSETS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: asset.w, height: asset.h });
    const filePath = 'file://' + path.join(__dirname, asset.file);
    await page.goto(filePath, { waitUntil: 'networkidle' });
    const outPath = path.join(OUTPUT_DIR, asset.out);
    await page.screenshot({ path: outPath, type: 'png', fullPage: false });
    await page.close();
    console.log('✓', asset.out);
  }

  await browser.close();
  console.log('\nAll assets saved to store/output/');
})();
