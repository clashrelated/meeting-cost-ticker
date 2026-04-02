# Meeting Cost Ticker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, production-ready Chrome Extension (Manifest V3) that injects a live draggable cost ticker into Google Meet and Zoom web, showing real-time meeting cost based on team size and salary.

**Architecture:** Three runtime contexts — background service worker (install defaults + tab listener), content script (meeting detection, ticker widget, cost calc, end-of-meeting overlay), and popup (settings UI + weekly stats + history). All vanilla JS, no build step, no external dependencies in runtime contexts. User-data is always set via `textContent`, never `innerHTML`, to prevent XSS.

**Tech Stack:** Vanilla JS, Chrome Extension Manifest V3, chrome.storage API, MutationObserver, Intl.NumberFormat, SVG icons, plain HTML/CSS.

---

## File Map

| File | Responsibility |
|------|---------------|
| `manifest.json` | Extension metadata, permissions, content script injection points |
| `background.js` | Install-time defaults, tab update listener |
| `content.js` | Meeting detection (Meet + Zoom), ticker widget, drag, cost calc, share |
| `summary.js` | End-of-meeting overlay, history save, share button |
| `popup.html` | Popup shell + Ko-fi script tag |
| `popup.css` | Popup styles (320px wide, dark-friendly) |
| `popup.js` | Settings load/save, live calc display, weekly stats, history list |
| `icons/icon16.svg` | 16px simplified $ in circle |
| `icons/icon32.svg` | 32px $ with clock circle |
| `icons/icon48.svg` | 48px full clock with hands at 10:10 |
| `icons/icon128.svg` | 128px full detail with SVG glow filter |
| `icons/logo-full.svg` | 400x100 horizontal lockup wordmark |
| `store/screenshot-1.html` | 1280x800 fake Meet UI with ticker overlay |
| `store/screenshot-2.html` | 1280x800 popup UI in browser frame |
| `store/screenshot-3.html` | 1280x800 end-of-meeting summary overlay |
| `store/promo-tile.html` | 440x280 Chrome Web Store promo tile |
| `store/store-listing.md` | Full CWS listing copy + SEO keywords |
| `README.md` | Project README with badges, features, install, privacy |

---

## Task 1: Project Scaffold and manifest.json

**Files:**
- Create: `manifest.json`
- Create: `icons/` directory
- Create: `store/` directory

- [ ] **Step 1: Create the directories**

```bash
cd /Users/bhabishya/meeting-cost-ticker
mkdir -p icons store
```

- [ ] **Step 2: Write manifest.json**

Create file `manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Meeting Cost Ticker",
  "short_name": "MeetCost",
  "version": "1.0.0",
  "description": "See the real cost of your meetings tick up in real time. Set your team size and salary, and never waste another hour again.",
  "permissions": ["storage", "tabs", "activeTab", "scripting"],
  "host_permissions": [
    "https://meet.google.com/*",
    "https://zoom.us/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.svg",
      "32": "icons/icon32.svg",
      "48": "icons/icon48.svg",
      "128": "icons/icon128.svg"
    }
  },
  "icons": {
    "16": "icons/icon16.svg",
    "32": "icons/icon32.svg",
    "48": "icons/icon48.svg",
    "128": "icons/icon128.svg"
  },
  "content_scripts": [
    {
      "matches": [
        "https://meet.google.com/*",
        "https://zoom.us/*"
      ],
      "js": ["content.js", "summary.js"],
      "run_at": "document_idle"
    }
  ]
}
```

- [ ] **Step 3: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest.json: valid')"
```

Expected output: `manifest.json: valid`

- [ ] **Step 4: Commit**

```bash
git init
git add manifest.json
git commit -m "feat: add manifest.json for Meeting Cost Ticker MV3"
```

---

## Task 2: Background Service Worker

**Files:**
- Create: `background.js`

- [ ] **Step 1: Write background.js**

```js
// background.js
const DEFAULT_SETTINGS = {
  team_size: 5,
  annual_salary: 60000,
  currency: 'USD'
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS), (stored) => {
    const toSet = {};
    for (const [key, val] of Object.entries(DEFAULT_SETTINGS)) {
      if (stored[key] === undefined) toSet[key] = val;
    }
    if (Object.keys(toSet).length > 0) {
      chrome.storage.sync.set(toSet);
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  const url = tab.url || '';
  if (url.includes('meet.google.com') || url.includes('zoom.us')) {
    chrome.tabs.sendMessage(tabId, { type: 'TAB_ACTIVATED' }).catch(() => {
      // Content script may not be ready yet -- safe to ignore
    });
  }
});
```

- [ ] **Step 2: Verify syntax**

```bash
node --check background.js && echo "background.js: syntax OK"
```

Expected output: `background.js: syntax OK`

- [ ] **Step 3: Commit**

```bash
git add background.js
git commit -m "feat: add background service worker with install defaults"
```

---

## Task 3: SVG Icons

**Files:**
- Create: `icons/icon16.svg`
- Create: `icons/icon32.svg`
- Create: `icons/icon48.svg`
- Create: `icons/icon128.svg`
- Create: `icons/logo-full.svg`

- [ ] **Step 1: Write icon16.svg** (simplified: $ in circle, no clock hands)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
  <circle cx="8" cy="8" r="7.5" fill="#1a1a2e" stroke="#72a4f2" stroke-width="1"/>
  <text x="8" y="12" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#72a4f2" text-anchor="middle">$</text>
</svg>
```

- [ ] **Step 2: Write icon32.svg** ($ with subtle clock ring)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="15" fill="#1a1a2e" stroke="#72a4f2" stroke-width="1.5"/>
  <circle cx="16" cy="16" r="11" fill="none" stroke="#72a4f2" stroke-width="0.5" stroke-dasharray="2 2" opacity="0.4"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-weight="bold" font-size="16" fill="#72a4f2" text-anchor="middle">$</text>
</svg>
```

- [ ] **Step 3: Write icon48.svg** (full design with clock hands at 10:10)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <circle cx="24" cy="24" r="23" fill="#1a1a2e" stroke="#72a4f2" stroke-width="2"/>
  <circle cx="24" cy="24" r="18" fill="none" stroke="#72a4f2" stroke-width="0.8" opacity="0.5"/>
  <line x1="24" y1="7" x2="24" y2="9" stroke="#72a4f2" stroke-width="1.5" opacity="0.6"/>
  <line x1="24" y1="39" x2="24" y2="41" stroke="#72a4f2" stroke-width="1.5" opacity="0.6"/>
  <line x1="7" y1="24" x2="9" y2="24" stroke="#72a4f2" stroke-width="1.5" opacity="0.6"/>
  <line x1="39" y1="24" x2="41" y2="24" stroke="#72a4f2" stroke-width="1.5" opacity="0.6"/>
  <line x1="24" y1="24" x2="15" y2="13" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <line x1="24" y1="24" x2="33" y2="13" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="24" cy="24" r="2" fill="#72a4f2"/>
  <text x="24" y="34" font-family="Arial, sans-serif" font-weight="bold" font-size="13" fill="#72a4f2" text-anchor="middle" opacity="0.9">$</text>
</svg>
```

- [ ] **Step 4: Write icon128.svg** (full detail with SVG filter glow)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#1e2a4a"/>
      <stop offset="100%" stop-color="#0d0d1a"/>
    </radialGradient>
  </defs>
  <circle cx="64" cy="64" r="62" fill="url(#bg)" stroke="#72a4f2" stroke-width="3"/>
  <circle cx="64" cy="64" r="54" fill="none" stroke="#72a4f2" stroke-width="1" opacity="0.3" filter="url(#glow)"/>
  <circle cx="64" cy="64" r="48" fill="none" stroke="#72a4f2" stroke-width="1.5" opacity="0.6"/>
  <line x1="64" y1="18" x2="64" y2="24" stroke="#72a4f2" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <line x1="64" y1="104" x2="64" y2="110" stroke="#72a4f2" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <line x1="18" y1="64" x2="24" y2="64" stroke="#72a4f2" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <line x1="104" y1="64" x2="110" y2="64" stroke="#72a4f2" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <line x1="88" y1="21" x2="86" y2="26" stroke="#72a4f2" stroke-width="1.5" opacity="0.5"/>
  <line x1="107" y1="40" x2="102" y2="42" stroke="#72a4f2" stroke-width="1.5" opacity="0.5"/>
  <line x1="107" y1="88" x2="102" y2="86" stroke="#72a4f2" stroke-width="1.5" opacity="0.5"/>
  <line x1="88" y1="107" x2="86" y2="102" stroke="#72a4f2" stroke-width="1.5" opacity="0.5"/>
  <line x1="40" y1="107" x2="42" y2="102" stroke="#72a4f2" stroke-width="1.5" opacity="0.5"/>
  <line x1="21" y1="88" x2="26" y2="86" stroke="#72a4f2" stroke-width="1.5" opacity="0.5"/>
  <line x1="21" y1="40" x2="26" y2="42" stroke="#72a4f2" stroke-width="1.5" opacity="0.5"/>
  <line x1="40" y1="21" x2="42" y2="26" stroke="#72a4f2" stroke-width="1.5" opacity="0.5"/>
  <line x1="64" y1="64" x2="37" y2="32" stroke="#ffffff" stroke-width="5" stroke-linecap="round" filter="url(#glow)"/>
  <line x1="64" y1="64" x2="91" y2="32" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="64" cy="64" r="5" fill="#72a4f2" filter="url(#glow)"/>
  <text x="64" y="96" font-family="Arial, sans-serif" font-weight="bold" font-size="28" fill="#72a4f2" text-anchor="middle" filter="url(#glow)">$</text>
</svg>
```

- [ ] **Step 5: Write logo-full.svg** (400x100 horizontal lockup)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" width="400" height="100">
  <rect width="400" height="100" fill="#1a1a2e" rx="8"/>
  <circle cx="44" cy="50" r="30" fill="#1e2a4a" stroke="#72a4f2" stroke-width="2"/>
  <circle cx="44" cy="50" r="22" fill="none" stroke="#72a4f2" stroke-width="1" opacity="0.5"/>
  <line x1="44" y1="50" x2="33" y2="37" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="44" y1="50" x2="55" y2="37" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <circle cx="44" cy="50" r="3" fill="#72a4f2"/>
  <text x="44" y="67" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#72a4f2" text-anchor="middle">$</text>
  <text x="88" y="44" font-family="Arial, sans-serif" font-weight="bold" font-size="22" fill="#ffffff">Meeting Cost Ticker</text>
  <text x="88" y="66" font-family="Arial, sans-serif" font-size="13" fill="#888899">Know what your meetings really cost</text>
</svg>
```

- [ ] **Step 6: Verify all icon files exist**

```bash
ls icons/
```

Expected: `icon16.svg  icon32.svg  icon48.svg  icon128.svg  logo-full.svg`

- [ ] **Step 7: Commit**

```bash
git add icons/
git commit -m "feat: add SVG icons and logo lockup"
```

---

## Task 4: Popup HTML Structure

**Files:**
- Create: `popup.html`

- [ ] **Step 1: Write popup.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Cost Ticker</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>

  <header class="header">
    <div class="header-left">
      <img src="icons/icon48.svg" alt="MCT" class="header-icon">
      <div class="header-title">Meeting Cost Ticker</div>
    </div>
    <span class="version-tag">v1.0.0</span>
  </header>

  <section class="section">
    <div class="section-heading">Your Settings</div>
    <div class="field">
      <label for="team-size">Team size</label>
      <input type="number" id="team-size" min="1" max="500" value="5">
    </div>
    <div class="field">
      <label for="annual-salary">Average annual salary (USD)</label>
      <input type="number" id="annual-salary" min="1000" value="60000">
    </div>
    <div class="field">
      <label for="currency">Currency</label>
      <select id="currency">
        <option value="USD">USD — US Dollar</option>
        <option value="EUR">EUR — Euro</option>
        <option value="GBP">GBP — British Pound</option>
        <option value="NPR">NPR — Nepalese Rupee</option>
        <option value="INR">INR — Indian Rupee</option>
        <option value="AUD">AUD — Australian Dollar</option>
      </select>
    </div>
    <div class="calc-display">
      <div class="calc-row">
        <span class="calc-label">Hourly cost per person</span>
        <span class="calc-value" id="hourly-per-person">$28.85</span>
      </div>
      <div class="calc-row">
        <span class="calc-label">Per second (whole team)</span>
        <span class="calc-value" id="per-second">$0.008</span>
      </div>
    </div>
    <button class="btn-save" id="save-btn">Save Settings</button>
    <div class="save-confirm" id="save-confirm">Settings saved!</div>
  </section>

  <section class="section">
    <div class="section-heading">This Week</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value" id="stat-meetings">0</div>
        <div class="stat-label">Meetings</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-hours">0h</div>
        <div class="stat-label">Total time</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-cost">$0</div>
        <div class="stat-label">Total cost</div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-heading-row">
      <div class="section-heading">Recent Meetings</div>
      <button class="btn-link" id="clear-history">Clear history</button>
    </div>
    <div id="history-list">
      <div class="history-empty">No meetings recorded yet.</div>
    </div>
  </section>

  <footer class="footer">
    <div class="footer-links">
      <a href="https://chrome.google.com/webstore" target="_blank" class="footer-link">Rate this extension</a>
      <span class="footer-sep">|</span>
      <a href="https://github.com/tabkit/meeting-cost-ticker/issues" target="_blank" class="footer-link">Report a bug</a>
      <span class="footer-sep">|</span>
      <a href="https://tabkit.dev" target="_blank" class="footer-link">More tools by TabKit</a>
    </div>
    <div id="kofi-widget-container"></div>
    <div class="footer-made">Made with &#9829; by TabKit</div>
  </footer>

  <script src="popup.js"></script>
  <script src="https://storage.ko-fi.com/cdn/widget/Widget_2.js" type="text/javascript"></script>
  <script>
    kofiwidget2.init('Support me on Ko-fi', '#72a4f2', 'Y8Y0BW7ME');
    kofiwidget2.draw();
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify Ko-fi ID and inputs are present**

```bash
node -e "
const h = require('fs').readFileSync('popup.html','utf8');
console.log(h.includes('Y8Y0BW7ME') ? 'kofi ID: OK' : 'kofi ID: MISSING');
console.log(h.includes('team-size') ? 'team-size input: OK' : 'team-size input: MISSING');
console.log(h.includes('annual-salary') ? 'salary input: OK' : 'salary input: MISSING');
console.log(h.includes('currency') ? 'currency select: OK' : 'currency select: MISSING');
"
```

Expected: all four lines `OK`

- [ ] **Step 3: Commit**

```bash
git add popup.html
git commit -m "feat: add popup HTML structure with Ko-fi widget"
```

---

## Task 5: Popup CSS

**Files:**
- Create: `popup.css`

- [ ] **Step 1: Write popup.css**

```css
/* popup.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  width: 320px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  background: #111118;
  color: #e0e0e8;
  min-height: 100px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #222230;
  background: #16161f;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-icon { width: 28px; height: 28px; }
.header-title { font-size: 14px; font-weight: 600; color: #fff; }
.version-tag {
  font-size: 10px;
  color: #555566;
  background: #1e1e2a;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #2a2a3a;
}

.section { padding: 12px 14px; border-bottom: 1px solid #1a1a28; }
.section-heading {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #5a5a7a;
  margin-bottom: 10px;
}
.section-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.section-heading-row .section-heading { margin-bottom: 0; }

.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.field label { font-size: 11px; color: #7a7a9a; font-weight: 500; }
.field input, .field select {
  background: #1c1c28;
  border: 1px solid #2c2c3e;
  color: #e0e0f0;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
}
.field input:focus, .field select:focus { border-color: #72a4f2; }
.field select option { background: #1c1c28; }

.calc-display {
  background: #181824;
  border: 1px solid #2a2a3c;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 10px;
}
.calc-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; }
.calc-label { color: #6a6a88; font-size: 11px; }
.calc-value { color: #72a4f2; font-weight: 600; font-size: 12px; }

.btn-save {
  width: 100%;
  background: #72a4f2;
  color: #0a0a14;
  border: none;
  border-radius: 7px;
  padding: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-save:hover { background: #8fb6f5; }
.save-confirm {
  font-size: 11px;
  color: #72a4f2;
  text-align: center;
  margin-top: 6px;
  height: 16px;
  opacity: 0;
  transition: opacity 0.3s;
}
.save-confirm.visible { opacity: 1; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.stat-card {
  background: #181824;
  border: 1px solid #2a2a3c;
  border-radius: 8px;
  padding: 10px 8px;
  text-align: center;
}
.stat-value { font-size: 16px; font-weight: 700; color: #72a4f2; line-height: 1.2; }
.stat-label { font-size: 10px; color: #5a5a78; margin-top: 3px; }

.history-empty { color: #4a4a62; font-size: 12px; padding: 6px 0; }
.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px solid #1a1a28;
  font-size: 12px;
}
.history-item:last-child { border-bottom: none; }
.history-date { color: #5a5a78; font-size: 11px; }
.history-duration { color: #9a9ab8; }
.history-cost { color: #72a4f2; font-weight: 600; }
.btn-link {
  background: none;
  border: none;
  color: #4a4a68;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.btn-link:hover { color: #e06060; }

.footer { padding: 12px 14px; background: #0e0e18; }
.footer-links { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-bottom: 10px; }
.footer-link { color: #4a4a68; text-decoration: none; font-size: 11px; }
.footer-link:hover { color: #72a4f2; }
.footer-sep { color: #2a2a40; font-size: 11px; }
.footer-made { font-size: 10px; color: #333348; text-align: center; margin-top: 8px; }
#kofi-widget-container { margin-top: 8px; }
```

- [ ] **Step 2: Commit**

```bash
git add popup.css
git commit -m "feat: add popup CSS — dark theme, 320px width"
```

---

## Task 6: Popup JavaScript

**Files:**
- Create: `popup.js`

- [ ] **Step 1: Write popup.js**

All user-sourced data is set via `textContent`, never via `innerHTML` interpolation. History rows are built using `document.createElement`.

```js
// popup.js

const CURRENCY_LOCALES = {
  USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB',
  NPR: 'ne-NP', INR: 'en-IN', AUD: 'en-AU'
};

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency] || 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(amount);
}

function updateCalcDisplay() {
  const salary = parseFloat(document.getElementById('annual-salary').value) || 0;
  const teamSize = parseInt(document.getElementById('team-size').value) || 1;
  const currency = document.getElementById('currency').value;
  const hourly = salary / 52 / 40;
  const perSec = (salary / 52 / 40 / 3600) * teamSize;
  document.getElementById('hourly-per-person').textContent = formatCurrency(hourly, currency);
  document.getElementById('per-second').textContent = formatCurrency(perSec, currency);
}

function loadSettings() {
  chrome.storage.sync.get(['team_size', 'annual_salary', 'currency'], (s) => {
    document.getElementById('team-size').value = s.team_size ?? 5;
    document.getElementById('annual-salary').value = s.annual_salary ?? 60000;
    const currencySelect = document.getElementById('currency');
    if (s.currency) currencySelect.value = s.currency;
    updateCalcDisplay();
  });
}

function saveSettings() {
  const settings = {
    team_size: parseInt(document.getElementById('team-size').value) || 5,
    annual_salary: parseFloat(document.getElementById('annual-salary').value) || 60000,
    currency: document.getElementById('currency').value
  };
  chrome.storage.sync.set(settings, () => {
    const confirm = document.getElementById('save-confirm');
    confirm.classList.add('visible');
    setTimeout(() => confirm.classList.remove('visible'), 2000);
  });
}

function getStartOfWeek() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

function loadStats() {
  chrome.storage.local.get(['meeting_history'], ({ meeting_history = [] }) => {
    const weekStart = getStartOfWeek();
    const weekMeetings = meeting_history.filter(m => new Date(m.date).getTime() >= weekStart);
    document.getElementById('stat-meetings').textContent = weekMeetings.length;
    const totalSecs = weekMeetings.reduce((a, m) => a + (m.duration_seconds || 0), 0);
    document.getElementById('stat-hours').textContent = (totalSecs / 3600).toFixed(1) + 'h';
    const totalCost = weekMeetings.reduce((a, m) => a + (m.cost || 0), 0);
    const currency = weekMeetings.length > 0
      ? weekMeetings[weekMeetings.length - 1].currency
      : 'USD';
    document.getElementById('stat-cost').textContent = formatCurrency(totalCost, currency);
    renderHistory(meeting_history);
  });
}

function renderHistory(history) {
  const list = document.getElementById('history-list');
  // Clear existing content safely
  while (list.firstChild) list.removeChild(list.firstChild);

  const recent = [...history].reverse().slice(0, 5);
  if (recent.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = 'No meetings recorded yet.';
    list.appendChild(empty);
    return;
  }

  recent.forEach(m => {
    const row = document.createElement('div');
    row.className = 'history-item';

    const dateEl = document.createElement('span');
    dateEl.className = 'history-date';
    dateEl.textContent = new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const durEl = document.createElement('span');
    durEl.className = 'history-duration';
    durEl.textContent = Math.round((m.duration_seconds || 0) / 60) + 'm';

    const costEl = document.createElement('span');
    costEl.className = 'history-cost';
    costEl.textContent = formatCurrency(m.cost || 0, m.currency || 'USD');

    row.appendChild(dateEl);
    row.appendChild(durEl);
    row.appendChild(costEl);
    list.appendChild(row);
  });
}

function clearHistory() {
  if (!confirm('Clear all meeting history?')) return;
  chrome.storage.local.set({ meeting_history: [] }, loadStats);
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadStats();
  document.getElementById('team-size').addEventListener('input', updateCalcDisplay);
  document.getElementById('annual-salary').addEventListener('input', updateCalcDisplay);
  document.getElementById('currency').addEventListener('change', updateCalcDisplay);
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  document.getElementById('clear-history').addEventListener('click', clearHistory);
});
```

- [ ] **Step 2: Verify syntax**

```bash
node --check popup.js && echo "popup.js: syntax OK"
```

Expected output: `popup.js: syntax OK`

- [ ] **Step 3: Commit**

```bash
git add popup.js
git commit -m "feat: add popup JS with settings, live calc, weekly stats, history"
```

---

## Task 7: Content Script

**Files:**
- Create: `content.js`

All user-sourced values (`cost`, `team_size`, `duration`) are set via `textContent`. The static ticker structure is built using `document.createElement` to avoid any XSS surface.

- [ ] **Step 1: Write content.js**

```js
// content.js

let tickerEl = null;
let intervalId = null;
let accumulatedCost = 0;
let startTime = null;
let meetingActive = false;
let settings = { team_size: 5, annual_salary: 60000, currency: 'USD' };

// ---- TICKER STYLES -------------------------------------------------------

function injectTickerStyles() {
  if (document.getElementById('mct-styles')) return;
  const style = document.createElement('style');
  style.id = 'mct-styles';
  style.textContent = [
    '#mct-ticker .mct-controls{display:flex;justify-content:flex-end;gap:4px;margin-bottom:2px}',
    '#mct-ticker .mct-btn{background:none;border:none;color:rgba(255,255,255,0.4);font-size:14px;cursor:pointer;padding:0 2px;line-height:1}',
    '#mct-ticker .mct-btn:hover{color:rgba(255,255,255,0.9)}',
    '#mct-ticker .mct-label{font-size:10px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}',
    '#mct-ticker .mct-cost{font-size:22px;font-weight:700;color:#72a4f2;line-height:1.1;margin-bottom:4px}',
    '#mct-ticker .mct-meta{font-size:11px;color:rgba(255,255,255,0.45)}'
  ].join('');
  document.head.appendChild(style);
}

// ---- TICKER WIDGET -------------------------------------------------------

function createTicker() {
  if (document.getElementById('mct-ticker')) return;
  if (sessionStorage.getItem('mct_dismissed') === '1') return;

  injectTickerStyles();

  tickerEl = document.createElement('div');
  tickerEl.id = 'mct-ticker';

  // Controls row
  const controls = document.createElement('div');
  controls.className = 'mct-controls';

  const minBtn = document.createElement('button');
  minBtn.className = 'mct-btn mct-minimize';
  minBtn.title = 'Minimize';
  minBtn.textContent = '\u2212'; // minus sign

  const closeBtn = document.createElement('button');
  closeBtn.className = 'mct-btn mct-close';
  closeBtn.title = 'Dismiss';
  closeBtn.textContent = '\u00d7'; // multiplication sign

  controls.appendChild(minBtn);
  controls.appendChild(closeBtn);

  // Body
  const body = document.createElement('div');
  body.className = 'mct-body';

  const labelEl = document.createElement('div');
  labelEl.className = 'mct-label';
  labelEl.textContent = 'Meeting cost';

  const costEl = document.createElement('div');
  costEl.className = 'mct-cost';
  costEl.textContent = formatCost(0, settings.currency);

  const metaEl = document.createElement('div');
  metaEl.className = 'mct-meta';
  metaEl.textContent = '0:00 \u00b7 ' + settings.team_size + ' people';

  body.appendChild(labelEl);
  body.appendChild(costEl);
  body.appendChild(metaEl);

  tickerEl.appendChild(controls);
  tickerEl.appendChild(body);

  Object.assign(tickerEl.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '999999',
    background: 'rgba(26,26,26,0.92)',
    backdropFilter: 'blur(8px)',
    color: '#ffffff',
    border: '1px solid rgba(114,164,242,0.3)',
    borderRadius: '12px',
    padding: '10px 14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '13px',
    cursor: 'grab',
    userSelect: 'none',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    minWidth: '140px'
  });

  document.body.appendChild(tickerEl);
  makeDraggable(tickerEl);

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sessionStorage.setItem('mct_dismissed', '1');
    tickerEl.remove();
    tickerEl = null;
  });

  minBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const minimized = tickerEl.classList.toggle('mct-minimized');
    body.style.display = minimized ? 'none' : '';
    minBtn.textContent = minimized ? '+' : '\u2212';
    tickerEl.style.padding = minimized ? '6px 10px' : '10px 14px';
    controls.style.marginBottom = minimized ? '0' : '2px';
  });
}

// ---- DRAG ---------------------------------------------------------------

function makeDraggable(el) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  el.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('mct-btn')) return;
    isDragging = true;
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    el.style.cursor = 'grabbing';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.left = rect.left + 'px';
    el.style.top = rect.top + 'px';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;
    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - el.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - el.offsetHeight));
    el.style.left = newLeft + 'px';
    el.style.top = newTop + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      el.style.cursor = 'grab';
    }
  });
}

// ---- COST HELPERS -------------------------------------------------------

function calcCostPerSecond(salary, teamSize) {
  return (salary / 52 / 40 / 3600) * teamSize;
}

function formatCost(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ':' + String(s).padStart(2, '0');
}

// ---- TICKER UPDATE ------------------------------------------------------

function updateTicker(cost, elapsedSecs) {
  if (!tickerEl) return;
  const costEl = tickerEl.querySelector('.mct-cost');
  const metaEl = tickerEl.querySelector('.mct-meta');
  if (costEl) costEl.textContent = formatCost(cost, settings.currency);
  if (metaEl) metaEl.textContent = formatDuration(elapsedSecs) + ' \u00b7 ' + settings.team_size + ' people';
}

// ---- MEETING LIFECYCLE --------------------------------------------------

function startMeeting() {
  if (meetingActive) return;
  meetingActive = true;
  accumulatedCost = 0;
  startTime = Date.now();

  chrome.storage.sync.get(['team_size', 'annual_salary', 'currency'], (s) => {
    settings = {
      team_size: s.team_size ?? 5,
      annual_salary: s.annual_salary ?? 60000,
      currency: s.currency ?? 'USD'
    };
    createTicker();
    const costPerSec = calcCostPerSecond(settings.annual_salary, settings.team_size);
    intervalId = setInterval(() => {
      accumulatedCost += costPerSec;
      const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
      updateTicker(accumulatedCost, elapsedSecs);
    }, 1000);
  });
}

function endMeeting() {
  if (!meetingActive) return;
  meetingActive = false;
  if (intervalId) { clearInterval(intervalId); intervalId = null; }

  const durationSecs = Math.floor((Date.now() - startTime) / 1000);
  if (tickerEl) { tickerEl.remove(); tickerEl = null; }

  if (typeof showMeetingSummary === 'function') {
    showMeetingSummary({
      cost: accumulatedCost,
      duration_seconds: durationSecs,
      team_size: settings.team_size,
      annual_salary: settings.annual_salary,
      currency: settings.currency
    });
  }

  saveMeetingRecord({
    date: new Date().toISOString(),
    duration_seconds: durationSecs,
    cost: accumulatedCost,
    team_size: settings.team_size,
    salary: settings.annual_salary,
    currency: settings.currency
  });
}

function saveMeetingRecord(record) {
  chrome.storage.local.get(['meeting_history'], (data) => {
    let history = data.meeting_history || [];
    history.push(record);
    if (history.length > 100) history = history.slice(-100);
    chrome.storage.local.set({ meeting_history: history });
  });
}

// ---- MEETING DETECTION --------------------------------------------------

function isMeetActive() {
  return !![...document.querySelectorAll('button')].find(
    b => b.getAttribute('aria-label') && b.getAttribute('aria-label').toLowerCase().includes('leave call')
  );
}

function isZoomActive() {
  return !!(
    document.querySelector('.footer__btns-container') ||
    [...document.querySelectorAll('button')].find(
      b => b.textContent && (b.textContent.trim() === 'Leave' || b.textContent.trim() === 'End')
    )
  );
}

function checkMeetingState() {
  const active = isMeetActive() || isZoomActive();
  if (active && !meetingActive) startMeeting();
  else if (!active && meetingActive) endMeeting();
}

const observer = new MutationObserver(() => checkMeetingState());
observer.observe(document.body, { childList: true, subtree: true });
checkMeetingState();

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'TAB_ACTIVATED') checkMeetingState();
});
```

- [ ] **Step 2: Verify syntax**

```bash
node --check content.js && echo "content.js: syntax OK"
```

Expected output: `content.js: syntax OK`

- [ ] **Step 3: Commit**

```bash
git add content.js
git commit -m "feat: add content script with ticker, drag, cost calc, meeting detection"
```

---

## Task 8: Summary Overlay

**Files:**
- Create: `summary.js`

All user-sourced values (cost, mins, team size, salary) are set via `textContent`.

- [ ] **Step 1: Write summary.js**

```js
// summary.js
// Called by endMeeting() in content.js via showMeetingSummary(data).

function showMeetingSummary({ cost, duration_seconds, team_size, annual_salary, currency }) {
  const existing = document.getElementById('mct-summary-overlay');
  if (existing) existing.remove();

  injectSummaryStyles();

  const mins = Math.round(duration_seconds / 60);
  const costStr = new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(cost);
  const salaryStr = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(annual_salary);

  // Build overlay
  const overlay = document.createElement('div');
  overlay.id = 'mct-summary-overlay';

  const card = document.createElement('div');
  card.id = 'mct-summary-card';

  // Icon
  const icon = document.createElement('div');
  icon.className = 'mct-sum-icon';
  icon.textContent = '\uD83D\uDCB8'; // money with wings emoji

  // Title
  const title = document.createElement('h2');
  title.className = 'mct-sum-title';
  title.textContent = 'Meeting complete';

  // Cost headline
  const costHeadline = document.createElement('div');
  costHeadline.className = 'mct-sum-cost';
  costHeadline.textContent = costStr;

  // Details block
  const details = document.createElement('div');
  details.className = 'mct-sum-details';

  function makeRow(label, value) {
    const row = document.createElement('div');
    row.className = 'mct-sum-row';
    const lbl = document.createElement('span');
    lbl.className = 'mct-sum-lbl';
    lbl.textContent = label;
    const val = document.createElement('span');
    val.className = 'mct-sum-val';
    val.textContent = value;
    row.appendChild(lbl);
    row.appendChild(val);
    return row;
  }

  details.appendChild(makeRow('Duration', mins + ' minutes'));
  details.appendChild(makeRow('Team size', team_size + ' people'));
  details.appendChild(makeRow('Avg salary', salaryStr + '/yr'));

  // Actions
  const actions = document.createElement('div');
  actions.className = 'mct-sum-actions';

  const shareBtn = document.createElement('button');
  shareBtn.id = 'mct-share-btn';
  shareBtn.className = 'mct-sum-btn mct-sum-share';
  shareBtn.textContent = 'Share this';

  const dismissBtn = document.createElement('button');
  dismissBtn.id = 'mct-dismiss-btn';
  dismissBtn.className = 'mct-sum-btn mct-sum-dismiss';
  dismissBtn.textContent = 'Dismiss';

  actions.appendChild(shareBtn);
  actions.appendChild(dismissBtn);

  // Copy confirmation
  const copiedMsg = document.createElement('div');
  copiedMsg.id = 'mct-copied-msg';
  copiedMsg.className = 'mct-copied-msg';
  copiedMsg.textContent = 'Copied to clipboard!';

  card.appendChild(icon);
  card.appendChild(title);
  card.appendChild(costHeadline);
  card.appendChild(details);
  card.appendChild(actions);
  card.appendChild(copiedMsg);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  dismissBtn.addEventListener('click', () => overlay.remove());

  shareBtn.addEventListener('click', () => {
    const shareText = 'Just finished a ' + mins + '-min meeting that cost our team ' + costStr + ' \uD83D\uDCB8 \u2014 Meeting Cost Ticker for Chrome';
    navigator.clipboard.writeText(shareText).then(() => {
      copiedMsg.style.opacity = '1';
      setTimeout(() => { copiedMsg.style.opacity = '0'; }, 2500);
    });
  });
}

function injectSummaryStyles() {
  if (document.getElementById('mct-summary-styles')) return;
  const style = document.createElement('style');
  style.id = 'mct-summary-styles';
  style.textContent = [
    '#mct-summary-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);z-index:9999999;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
    '#mct-summary-card{background:#16161f;border:1px solid rgba(114,164,242,0.25);border-radius:16px;padding:32px 36px;text-align:center;max-width:360px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.6);color:#e0e0f0}',
    '.mct-sum-icon{font-size:36px;margin-bottom:12px}',
    '.mct-sum-title{font-size:20px;font-weight:700;color:#fff;margin-bottom:8px}',
    '.mct-sum-cost{font-size:42px;font-weight:800;color:#72a4f2;margin-bottom:20px;line-height:1.1}',
    '.mct-sum-details{background:#1c1c2a;border-radius:10px;padding:12px 16px;margin-bottom:20px}',
    '.mct-sum-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}',
    '.mct-sum-lbl{color:#6a6a88}',
    '.mct-sum-val{color:#c0c0d8;font-weight:500}',
    '.mct-sum-actions{display:flex;gap:10px;justify-content:center}',
    '.mct-sum-btn{border:none;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s}',
    '.mct-sum-btn:hover{opacity:.85}',
    '.mct-sum-share{background:#72a4f2;color:#0a0a14}',
    '.mct-sum-dismiss{background:#2a2a3a;color:#a0a0c0}',
    '.mct-copied-msg{margin-top:12px;font-size:12px;color:#72a4f2;opacity:0;transition:opacity .3s}'
  ].join('');
  document.head.appendChild(style);
}
```

- [ ] **Step 2: Verify syntax**

```bash
node --check summary.js && echo "summary.js: syntax OK"
```

Expected output: `summary.js: syntax OK`

- [ ] **Step 3: Commit**

```bash
git add summary.js
git commit -m "feat: add end-of-meeting summary overlay with share button"
```

---

## Task 9: Store Screenshot HTMLs

**Files:**
- Create: `store/screenshot-1.html`
- Create: `store/screenshot-2.html`
- Create: `store/screenshot-3.html`

- [ ] **Step 1: Write store/screenshot-1.html** (ticker in live meeting)

```html
<!-- Screenshot at 1280x800 -->
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MCT Screenshot 1</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:800px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#202124}
.top-bar{position:absolute;top:0;left:0;right:0;height:56px;background:#202124;display:flex;align-items:center;padding:0 20px;gap:16px;border-bottom:1px solid #333;z-index:10}
.top-logo{color:#8ab4f8;font-weight:600;font-size:16px}
.top-title{color:#9aa0a6;font-size:14px}
.top-time{color:#9aa0a6;font-size:13px;margin-left:auto}
.grid{position:absolute;top:56px;left:0;right:0;bottom:80px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:4px;padding:12px}
.participant{border-radius:10px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px}
.avatar{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:#fff}
.pname{color:#e8eaed;font-size:13px;background:rgba(0,0,0,.5);padding:2px 8px;border-radius:4px}
.toolbar{position:absolute;bottom:0;left:0;right:0;height:80px;background:#202124;display:flex;align-items:center;justify-content:center;gap:16px;border-top:1px solid #333}
.tbtn{width:48px;height:48px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px}
.tbtn.red{background:#ea4335;color:#fff}
.tbtn.gray{background:#3c4043;color:#e8eaed}
.mct{position:absolute;bottom:100px;right:30px;background:rgba(26,26,26,.92);border:1px solid rgba(114,164,242,.35);border-radius:12px;padding:10px 14px;color:#fff;z-index:20;font-family:-apple-system,sans-serif;min-width:150px;box-shadow:0 4px 20px rgba(0,0,0,.5)}
.mct-ctrl{display:flex;justify-content:flex-end;gap:4px;margin-bottom:2px}
.mct-cbtn{background:none;border:none;color:rgba(255,255,255,.35);font-size:14px}
.mct-lbl{font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
.mct-cost-d{font-size:24px;font-weight:800;color:#72a4f2}
.mct-meta-d{font-size:11px;color:rgba(255,255,255,.4);margin-top:4px}
.caption{position:absolute;bottom:0;left:0;right:0;height:80px;display:flex;align-items:center;justify-content:center}
.cpill{background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.1);border-radius:30px;padding:10px 28px;color:#e8eaed;font-size:15px}
</style>
</head>
<body>
<div class="top-bar">
  <span class="top-logo">Google Meet</span>
  <span class="top-title">Team Standup</span>
  <span class="top-time">12:34 PM</span>
</div>
<div class="grid">
  <div class="participant" style="background:#1a2a3a"><div class="avatar" style="background:#1a73e8">AK</div><div class="pname">Alex K.</div></div>
  <div class="participant" style="background:#2a1a3a"><div class="avatar" style="background:#7c4dff">SJ</div><div class="pname">Sarah J.</div></div>
  <div class="participant" style="background:#1a3a1a"><div class="avatar" style="background:#0f9d58">MB</div><div class="pname">Mike B.</div></div>
  <div class="participant" style="background:#3a2a1a"><div class="avatar" style="background:#f4b400">LT</div><div class="pname">Lisa T.</div></div>
  <div class="participant" style="background:#2a1a1a"><div class="avatar" style="background:#ea4335">RN</div><div class="pname">Ryan N.</div></div>
  <div class="participant" style="background:#1a1a3a;border:2px solid #72a4f2"><div class="avatar" style="background:#34a853">You</div><div class="pname" style="color:#72a4f2">You (Host)</div></div>
</div>
<div class="toolbar">
  <button class="tbtn gray">&#127908;</button>
  <button class="tbtn gray">&#128247;</button>
  <button class="tbtn gray">&#128172;</button>
  <button class="tbtn red">&#128222;</button>
  <button class="tbtn gray">&#8942;</button>
</div>
<div class="mct">
  <div class="mct-ctrl">
    <button class="mct-cbtn">&#8722;</button>
    <button class="mct-cbtn">&#215;</button>
  </div>
  <div class="mct-lbl">Meeting cost</div>
  <div class="mct-cost-d">$87.42</div>
  <div class="mct-meta-d">12:34 &middot; 5 people</div>
</div>
<div class="caption"><div class="cpill">Live cost tracker &#8212; always visible, never intrusive</div></div>
</body>
</html>
```

- [ ] **Step 2: Write store/screenshot-2.html** (popup config UI)

```html
<!-- Screenshot at 1280x800 -->
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MCT Screenshot 2</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:800px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#dee1e6}
.browser{width:960px;height:700px;position:absolute;top:50px;left:160px;background:#fff;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden}
.bbar{height:52px;background:#f1f3f4;border-bottom:1px solid #dadce0;display:flex;align-items:center;padding:0 16px;gap:12px}
.dots{display:flex;gap:6px}
.dot{width:12px;height:12px;border-radius:50%}
.burl{flex:1;background:#fff;border:1px solid #dadce0;border-radius:20px;padding:6px 16px;font-size:13px;color:#5f6368}
.bcontent{background:#202124;height:calc(100% - 52px);position:relative;display:flex;align-items:center;justify-content:center}
.panel{width:320px;background:#111118;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.6);overflow:hidden;border:1px solid #222}
.ph{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#16161f;border-bottom:1px solid #222230}
.ph-title{font-size:14px;font-weight:600;color:#fff}
.ph-ver{font-size:10px;color:#555;background:#1e1e2a;padding:2px 6px;border-radius:4px}
.ps{padding:12px 14px;border-bottom:1px solid #1a1a28}
.psh{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#5a5a7a;margin-bottom:10px}
.pf{margin-bottom:10px}
.pl{font-size:11px;color:#7a7a9a;margin-bottom:4px;display:block}
.pi{width:100%;background:#1c1c28;border:1px solid #2c2c3e;color:#e0e0f0;border-radius:6px;padding:6px 10px;font-size:13px}
.pcalc{background:#181824;border:1px solid #2a2a3c;border-radius:8px;padding:8px 12px;margin-bottom:10px}
.pcrow{display:flex;justify-content:space-between;padding:3px 0;font-size:11px}
.pclbl{color:#6a6a88}
.pcval{color:#72a4f2;font-weight:600}
.psave{width:100%;background:#72a4f2;color:#0a0a14;border:none;border-radius:7px;padding:8px;font-size:13px;font-weight:600}
.sg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.sc{background:#181824;border:1px solid #2a2a3c;border-radius:8px;padding:10px 8px;text-align:center}
.sv{font-size:16px;font-weight:700;color:#72a4f2}
.sl{font-size:10px;color:#5a5a78;margin-top:3px}
.caption{position:absolute;bottom:24px;left:0;right:0;display:flex;justify-content:center}
.cpill{background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.1);border-radius:30px;padding:10px 28px;color:#e8eaed;font-size:15px}
</style>
</head>
<body>
<div class="browser">
  <div class="bbar">
    <div class="dots">
      <div class="dot" style="background:#ff5f57"></div>
      <div class="dot" style="background:#ffbd2e"></div>
      <div class="dot" style="background:#28c840"></div>
    </div>
    <div class="burl">meet.google.com/abc-defg-hij</div>
  </div>
  <div class="bcontent">
    <div class="panel">
      <div class="ph"><span class="ph-title">Meeting Cost Ticker</span><span class="ph-ver">v1.0.0</span></div>
      <div class="ps">
        <div class="psh">Your Settings</div>
        <div class="pf"><label class="pl">Team size</label><input class="pi" value="5" readonly></div>
        <div class="pf"><label class="pl">Average annual salary (USD)</label><input class="pi" value="60,000" readonly></div>
        <div class="pf"><label class="pl">Currency</label><input class="pi" value="USD &mdash; US Dollar" readonly></div>
        <div class="pcalc">
          <div class="pcrow"><span class="pclbl">Hourly cost per person</span><span class="pcval">$28.85</span></div>
          <div class="pcrow"><span class="pclbl">Per second (whole team)</span><span class="pcval">$0.008</span></div>
        </div>
        <button class="psave">Save Settings</button>
      </div>
      <div class="ps">
        <div class="psh">This Week</div>
        <div class="sg">
          <div class="sc"><div class="sv">8</div><div class="sl">Meetings</div></div>
          <div class="sc"><div class="sv">6.2h</div><div class="sl">Total time</div></div>
          <div class="sc"><div class="sv">$892</div><div class="sl">Total cost</div></div>
        </div>
      </div>
    </div>
    <div class="caption"><div class="cpill">Set once, works everywhere</div></div>
  </div>
</div>
</body>
</html>
```

- [ ] **Step 3: Write store/screenshot-3.html** (end-of-meeting summary)

```html
<!-- Screenshot at 1280x800 -->
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MCT Screenshot 3</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:800px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.meet-bg{width:100%;height:100%;background:#202124;filter:blur(3px) brightness(.4);position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:4px;padding:60px 12px 12px}
.participant{border-radius:10px;display:flex;align-items:center;justify-content:center}
.avatar{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:#fff}
.overlay{position:absolute;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:24px}
.card{background:#16161f;border:1px solid rgba(114,164,242,.25);border-radius:16px;padding:32px 40px;text-align:center;width:380px;box-shadow:0 20px 60px rgba(0,0,0,.6);color:#e0e0f0}
.s-icon{font-size:36px;margin-bottom:12px}
.s-title{font-size:20px;font-weight:700;color:#fff;margin-bottom:8px}
.s-cost{font-size:48px;font-weight:800;color:#72a4f2;margin-bottom:20px}
.s-details{background:#1c1c2a;border-radius:10px;padding:12px 16px;margin-bottom:20px}
.s-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}
.s-lbl{color:#6a6a88}
.s-val{color:#c0c0d8;font-weight:500}
.s-actions{display:flex;gap:10px;justify-content:center}
.s-btn{border:none;border-radius:8px;padding:10px 22px;font-size:13px;font-weight:600;cursor:pointer}
.s-share{background:#72a4f2;color:#0a0a14}
.s-dismiss{background:#2a2a3a;color:#a0a0c0}
.cpill{background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.1);border-radius:30px;padding:10px 28px;color:#e8eaed;font-size:15px}
</style>
</head>
<body>
<div class="meet-bg">
  <div class="participant" style="background:#1a2a3a"><div class="avatar" style="background:#1a73e8">AK</div></div>
  <div class="participant" style="background:#2a1a3a"><div class="avatar" style="background:#7c4dff">SJ</div></div>
  <div class="participant" style="background:#1a3a1a"><div class="avatar" style="background:#0f9d58">MB</div></div>
  <div class="participant" style="background:#3a2a1a"><div class="avatar" style="background:#f4b400">LT</div></div>
  <div class="participant" style="background:#2a1a1a"><div class="avatar" style="background:#ea4335">RN</div></div>
  <div class="participant" style="background:#1a1a3a"><div class="avatar" style="background:#34a853">You</div></div>
</div>
<div class="overlay">
  <div class="card">
    <div class="s-icon">&#128184;</div>
    <h2 class="s-title">Meeting complete</h2>
    <div class="s-cost">$142.30</div>
    <div class="s-details">
      <div class="s-row"><span class="s-lbl">Duration</span><span class="s-val">47 minutes</span></div>
      <div class="s-row"><span class="s-lbl">Team size</span><span class="s-val">5 people</span></div>
      <div class="s-row"><span class="s-lbl">Avg salary</span><span class="s-val">$60,000/yr</span></div>
    </div>
    <div class="s-actions">
      <button class="s-btn s-share">Share this</button>
      <button class="s-btn s-dismiss">Dismiss</button>
    </div>
  </div>
  <div class="cpill">Every meeting gets a receipt</div>
</div>
</body>
</html>
```

- [ ] **Step 4: Commit**

```bash
git add store/screenshot-1.html store/screenshot-2.html store/screenshot-3.html
git commit -m "feat: add store screenshot HTML mockups at 1280x800"
```

---

## Task 10: Promo Tile and Store Listing

**Files:**
- Create: `store/promo-tile.html`
- Create: `store/store-listing.md`

- [ ] **Step 1: Write store/promo-tile.html**

```html
<!-- Screenshot at 440x280 -->
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MCT Promo Tile</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:440px;height:280px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.tile{width:440px;height:280px;background:linear-gradient(135deg,#0d0d1a 0%,#1a1a2e 60%,#0a1628 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}
.bg-c{position:absolute;border-radius:50%;border:1px solid rgba(114,164,242,.08)}
.icon-w{margin-bottom:14px}
.icon-w svg{filter:drop-shadow(0 0 12px rgba(114,164,242,.4))}
.t-title{font-size:22px;font-weight:800;color:#fff;letter-spacing:-.3px;margin-bottom:6px}
.t-sub{font-size:12px;color:rgba(255,255,255,.45);margin-bottom:20px;letter-spacing:.02em}
.pills{display:flex;gap:8px}
.pill{background:rgba(114,164,242,.12);border:1px solid rgba(114,164,242,.3);border-radius:20px;padding:5px 14px;font-size:11px;color:#72a4f2;font-weight:500}
</style>
</head>
<body>
<div class="tile">
  <div class="bg-c" style="width:300px;height:300px;top:-80px;right:-80px"></div>
  <div class="bg-c" style="width:200px;height:200px;bottom:-60px;left:-60px"></div>
  <div class="icon-w">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <circle cx="32" cy="32" r="30" fill="#1e2a4a" stroke="#72a4f2" stroke-width="2"/>
      <circle cx="32" cy="32" r="22" fill="none" stroke="#72a4f2" stroke-width="1" opacity=".5"/>
      <line x1="32" y1="32" x2="19" y2="17" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <line x1="32" y1="32" x2="45" y2="17" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="3" fill="#72a4f2"/>
      <text x="32" y="50" font-family="Arial,sans-serif" font-weight="bold" font-size="16" fill="#72a4f2" text-anchor="middle">$</text>
    </svg>
  </div>
  <div class="t-title">Meeting Cost Ticker</div>
  <div class="t-sub">Know what your meetings really cost</div>
  <div class="pills">
    <div class="pill">Real-time</div>
    <div class="pill">Google Meet</div>
    <div class="pill">Zoom</div>
  </div>
</div>
</body>
</html>
```

- [ ] **Step 2: Write store/store-listing.md**

```markdown
# Meeting Cost Ticker — Chrome Web Store Listing

## Extension Name
Meeting Cost Ticker

## Short Description (132 chars max)
See the live cost of your meetings tick up in real time. Works on Google Meet and Zoom. Set your team, set your salary, wake up.

## Full Description

Every meeting has a price tag — most teams just never see it. Meeting Cost Ticker makes the invisible visible: a live, real-time cost counter that ticks up every second while your team is on a call.

Set your team size and average salary once, and the extension quietly runs in the background. The moment a Google Meet or Zoom call starts, a small, draggable cost ticker appears in the corner of your screen — showing the total financial cost of the meeting to the nearest cent, updated live.

**How it works:**

1. Install the extension and open the popup to set your team size and average annual salary.
2. Join any Google Meet or Zoom call — the ticker appears automatically.
3. At the end of the call, you get a meeting receipt: total time, total cost, and a one-click share button.

**Key Features:**

- Live cost ticker — cost updates every second on Google Meet and Zoom
- Draggable and minimizable — move it anywhere, collapse it to a cost pill
- Multi-currency support — USD, EUR, GBP, NPR, INR, AUD
- End-of-meeting summary — every call ends with a receipt
- One-click sharing — share meeting cost to Slack, email, or anywhere
- Weekly history — track total meetings, hours, and costs over time
- 100% private — no data ever leaves your browser, no backend, no account, no tracking
- Free forever — no subscription, no paywall

**Who it's for:**

- Engineering and product managers who run daily standups and want to see the true cost of synchronous communication
- Remote teams building a culture of meeting efficiency
- Freelancers tracking billable time by client
- Anyone who has ever sat through a 90-minute status update that could have been an email

**The math:**

Meeting Cost Ticker uses a simple, transparent formula:
cost per second = (annual salary divided by 52 weeks divided by 40 hours divided by 3600 seconds) times team size

No assumptions, no hidden multipliers — just your numbers.

**Privacy:**

All data is stored locally in your browser using Chrome's built-in storage API. Nothing is sent to any server. No account is required. The extension works fully offline.

Meeting Cost Ticker is free forever. If it saves you from one pointless meeting, consider buying me a coffee: ko-fi.com/Y8Y0BW7ME

## Category
Productivity

## Primary Keyword Targets
1. meeting cost calculator chrome extension
2. google meet cost tracker
3. zoom meeting cost extension
4. meeting productivity tool chrome
5. meeting timer cost chrome extension
6. team meeting expense tracker
7. real time meeting cost
8. how much does a meeting cost
9. meeting cost overlay google meet
10. zoom meeting productivity extension
11. meeting cost counter
12. billable meeting time tracker
13. remote meeting cost calculator
14. meeting waste calculator
15. google meet productivity extension

## Tags (up to 5)
productivity, meetings, google-meet, zoom, time-management

## Privacy Policy Summary
All data is stored locally in your browser using the chrome.storage API. No personal data is collected, transmitted, or stored on any external server. No account or login is required to use this extension.
```

- [ ] **Step 3: Commit**

```bash
git add store/promo-tile.html store/store-listing.md
git commit -m "feat: add store promo tile and CWS listing copy"
```

---

## Task 11: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README.md**

```markdown
# Meeting Cost Ticker

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-v1.0.0-brightgreen)](https://chrome.google.com/webstore)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-ff5e5b)](https://ko-fi.com/Y8Y0BW7ME)

> Know what your meetings actually cost.

A Manifest V3 Chrome extension that injects a live, draggable cost ticker into Google Meet and Zoom web. See the real-time financial cost of every meeting, ticking up per second based on your team size and salary.

---

## Features

- **Live cost ticker** — updates every second during Google Meet and Zoom calls
- **Draggable and minimizable** — position it anywhere on screen, collapse to a pill
- **Multi-currency** — USD, EUR, GBP, NPR, INR, AUD
- **End-of-meeting summary** — receipt with duration, cost, team size
- **One-click share** — copy shareable cost text to clipboard
- **Weekly history** — total meetings, hours, and costs in the popup
- **100% private** — no data leaves your browser, no backend, no account

---

## Installation

### From Chrome Web Store
1. Visit the Meeting Cost Ticker page on the Chrome Web Store
2. Click **Add to Chrome**
3. Click the extension icon, set your team size and salary, hit Save

### Developer Mode (manual install)
1. Clone this repo: `git clone https://github.com/tabkit/meeting-cost-ticker`
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `meeting-cost-ticker` folder
5. The extension icon appears in your toolbar

---

## How to Use

1. **Set up** — Click the extension icon, enter your team size and average annual salary, select currency, and click Save Settings.
2. **Join a meeting** — Navigate to any Google Meet or Zoom call. The cost ticker appears automatically.
3. **Review** — When the call ends, you will see a full meeting summary. Click "Share this" to copy the cost to your clipboard.

---

## Tech Stack

- **Vanilla JavaScript** — zero dependencies, no npm, no build step
- **Chrome Extension Manifest V3** — service worker, declarative content scripts
- **chrome.storage API** — `sync` for settings, `local` for meeting history
- **MutationObserver** — efficient meeting detection, no polling
- **Intl.NumberFormat** — locale-aware currency formatting

---

## Privacy

All data is stored locally in your browser using `chrome.storage`. Nothing is transmitted to any server. No account is required. The extension works fully offline.

---

## Contributing

Pull requests welcome. Please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push and open a PR

---

## License

MIT

---

## Support

Meeting Cost Ticker is free forever. If it saves you from one pointless meeting, consider buying me a coffee:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Y8Y0BW7ME)
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with features, install instructions, ko-fi link"
```

---

## Task 12: Final Verification

**Files:** (verification only — no changes)

- [ ] **Step 1: Verify all 18 files exist**

```bash
node -e "
const fs = require('fs');
const required = [
  'manifest.json','background.js','content.js','popup.html','popup.js','popup.css','summary.js',
  'icons/icon16.svg','icons/icon32.svg','icons/icon48.svg','icons/icon128.svg','icons/logo-full.svg',
  'store/screenshot-1.html','store/screenshot-2.html','store/screenshot-3.html',
  'store/promo-tile.html','store/store-listing.md','README.md'
];
const missing = required.filter(f => !fs.existsSync(f));
if (missing.length === 0) console.log('ALL 18 FILES PRESENT');
else { console.log('MISSING:'); missing.forEach(f => console.log(' -', f)); }
"
```

Expected: `ALL 18 FILES PRESENT`

- [ ] **Step 2: Validate manifest.json references**

```bash
node -e "
const fs = require('fs');
const m = JSON.parse(fs.readFileSync('manifest.json','utf8'));
const checks = [
  [m.manifest_version === 3, 'manifest_version 3'],
  [m.permissions.includes('storage'), 'permission: storage'],
  [m.permissions.includes('tabs'), 'permission: tabs'],
  [m.host_permissions.includes('https://meet.google.com/*'), 'host: meet.google.com'],
  [m.host_permissions.includes('https://zoom.us/*'), 'host: zoom.us'],
  [fs.existsSync(m.background.service_worker), 'background.js exists'],
  [fs.existsSync(m.action.default_popup), 'popup.html exists'],
  [m.content_scripts[0].js.includes('content.js'), 'content.js injected'],
  [m.content_scripts[0].js.includes('summary.js'), 'summary.js injected'],
];
checks.forEach(([pass, label]) => console.log(pass ? 'OK' : 'FAIL', label));
"
```

Expected: all lines show `OK`

- [ ] **Step 3: Verify JS syntax**

```bash
for f in background.js content.js popup.js summary.js; do
  node --check $f && echo "OK $f" || echo "FAIL $f"
done
```

Expected: `OK` for all four

- [ ] **Step 4: Verify cost formula**

```bash
node -e "
const salary = 60000, team = 5;
const perSec = (salary / 52 / 40 / 3600) * team;
const perHour = salary / 52 / 40;
console.log('Per second:', perSec.toFixed(6));
console.log('Per hour per person:', perHour.toFixed(2));
console.log(perSec > 0.003 && perSec < 0.005 ? 'formula: OK' : 'formula: FAIL');
"
```

Expected: `formula: OK`

- [ ] **Step 5: Verify Ko-fi and currency list in popup.html**

```bash
node -e "
const h = require('fs').readFileSync('popup.html','utf8');
['Y8Y0BW7ME','storage.ko-fi.com','USD','EUR','GBP','NPR','INR','AUD'].forEach(s => {
  console.log(h.includes(s) ? 'OK' : 'MISSING', s);
});
"
```

Expected: `OK` for all 8

- [ ] **Step 6: Verify screenshot comment headers**

```bash
node -e "
['store/screenshot-1.html','store/screenshot-2.html','store/screenshot-3.html','store/promo-tile.html'].forEach(f => {
  const h = require('fs').readFileSync(f,'utf8').trim();
  console.log(h.startsWith('<!-- Screenshot at') ? 'OK' : 'MISSING comment', f);
});
"
```

Expected: `OK` for all 4

- [ ] **Step 7: Print directory tree**

```bash
find . -not -path './docs/*' -not -path './.git/*' -type f | sort
```

Expected (18 files):
```
./README.md
./background.js
./content.js
./icons/icon128.svg
./icons/icon16.svg
./icons/icon32.svg
./icons/icon48.svg
./icons/logo-full.svg
./manifest.json
./popup.css
./popup.html
./popup.js
./store/promo-tile.html
./store/screenshot-1.html
./store/screenshot-2.html
./store/screenshot-3.html
./store/store-listing.md
./summary.js
```

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete Meeting Cost Ticker v1.0.0"
```

---

## Self-Review

**Spec coverage:**
- manifest.json with all permissions and host_permissions: Task 1
- background.js install defaults + tab listener: Task 2
- All 5 SVG icons: Task 3
- popup.html with Ko-fi Y8Y0BW7ME + all 6 currencies: Task 4
- popup.css 320px dark-friendly: Task 5
- popup.js settings/calc/stats/history with safe DOM (no innerHTML for user data): Task 6
- content.js ticker widget, drag, cost formula, meeting detection (Meet + Zoom), share: Task 7
- summary.js end-of-meeting overlay, safe DOM, share, history save (capped at 100): Task 8
- store/screenshot-*.html x3 with 1280x800 comment: Task 9
- store/promo-tile.html 440x280 + store-listing.md: Task 10
- README.md with ko-fi link: Task 11
- Final verification checklist: Task 12

**Type consistency:**
- `showMeetingSummary({cost, duration_seconds, team_size, annual_salary, currency})` — called in content.js `endMeeting()`, defined in summary.js. Signature identical.
- `meeting_history` array key — used in content.js `saveMeetingRecord`, popup.js `loadStats`/`renderHistory`/`clearHistory`. Consistent.
- `settings.currency` ISO code string — passed to `Intl.NumberFormat` in both content.js and summary.js. Consistent.

**XSS safety:**
- popup.js: history rows built with `createElement` + `textContent` only
- content.js: ticker structure built with `createElement`; cost/meta updated via `textContent`
- summary.js: entire card built with `createElement`; all values set via `textContent`
