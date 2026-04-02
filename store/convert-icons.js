// convert-icons.js — converts SVG icons to PNG for Chrome Web Store
// Usage: node store/convert-icons.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SIZES = [16, 32, 48, 128];
const ICONS_DIR = path.join(__dirname, '..', 'icons');

(async () => {
  const browser = await chromium.launch();

  for (const size of SIZES) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: size, height: size });

    const svgPath = path.join(ICONS_DIR, `icon${size}.svg`);
    const svgContent = fs.readFileSync(svgPath, 'utf8');

    // Render the SVG inline in a minimal HTML page
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; }
  body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
  img { width: ${size}px; height: ${size}px; display: block; }
</style>
</head>
<body>
  <img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}">
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle' });

    const outPath = path.join(ICONS_DIR, `icon${size}.png`);
    await page.screenshot({
      path: outPath,
      type: 'png',
      clip: { x: 0, y: 0, width: size, height: size }
    });

    await page.close();
    console.log(`✓ icon${size}.png`);
  }

  await browser.close();
  console.log('\nPNG icons saved to icons/');
})();
