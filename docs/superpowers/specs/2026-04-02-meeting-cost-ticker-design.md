# Meeting Cost Ticker — Design Spec
Date: 2026-04-02

## Overview

A Manifest V3 Chrome extension that injects a live, draggable cost ticker into Google Meet and Zoom web. Shows real-time financial cost of meetings ticking up per second based on team size and salary. Minimal, non-intrusive, shareable.

- **Name:** Meeting Cost Ticker
- **Short name:** MeetCost
- **Version:** 1.0.0
- **License:** MIT
- **Ko-fi:** Y8Y0BW7ME

---

## Architecture

Three runtime contexts, all vanilla JS, no dependencies, no build step.

### Runtime Contexts

| File | Context | Role |
|------|---------|------|
| `background.js` | Service worker | Install defaults, tab listener |
| `content.js` | Injected page script | Meeting detection, ticker widget, cost calc, summary overlay |
| `popup.html/js/css` | Extension popup | Settings UI, weekly stats, history |
| `summary.js` | Injected alongside content.js | End-of-meeting overlay (can be part of content.js) |

### Data Layer

| Store | Key(s) | Purpose |
|-------|--------|---------|
| `chrome.storage.sync` | `team_size`, `annual_salary`, `currency` | Settings — syncs across devices |
| `chrome.storage.local` | `meeting_history` (array, max 100) | Meeting records |
| `sessionStorage` | `mct_dismissed` | Per-page dismissed state |

---

## File Structure

```
meeting-cost-ticker/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── popup.css
├── summary.js
├── icons/
│   ├── icon16.svg
│   ├── icon32.svg
│   ├── icon48.svg
│   ├── icon128.svg
│   └── logo-full.svg
├── store/
│   ├── screenshot-1.html
│   ├── screenshot-2.html
│   ├── screenshot-3.html
│   ├── promo-tile.html
│   └── store-listing.md
└── README.md
```

---

## Component Designs

### manifest.json

- Manifest V3
- Permissions: `["storage", "tabs", "activeTab", "scripting"]`
- Host permissions: `["https://meet.google.com/*", "https://zoom.us/*"]`
- Content scripts: inject `content.js` + `summary.js` on both hosts
- Background service worker: `background.js`
- Action popup: `popup.html`
- Icons at 16, 32, 48, 128

### background.js

- `chrome.runtime.onInstalled` → set defaults if not present: `{team_size: 5, annual_salary: 60000, currency: 'USD'}`
- `chrome.tabs.onUpdated` → when URL matches meet.google.com or zoom.us, send `{type: 'TAB_ACTIVATED'}` to content script
- No persistent state

### content.js

**Meeting Detection:**
- `MutationObserver` on `document.body`
- Google Meet: watch for button with `aria-label` containing "Leave call"
- Zoom: watch for element with class `footer__btns-container` or button text "Leave"/"End"
- On detection → `startMeeting()`. On removal → `endMeeting()`.

**Ticker Widget (`#mct-ticker`):**
- `position: fixed`, `bottom: 20px`, `right: 20px`, `z-index: 999999`
- Dark pill: `background: rgba(26,26,26,0.9)`, white text, subtle border
- 3-line layout:
  - Line 1: "Meeting cost" label (muted)
  - Line 2: Large bold cost `$0.00`
  - Line 3: `04:32 · 5 people`
- × close button → sets `sessionStorage.mct_dismissed = '1'`, removes ticker
- Minimize button → collapses to small cost pill
- Draggable: `mousedown` captures offset, `mousemove` repositions, `mouseup` releases

**Cost Calculation:**
- Read settings from `chrome.storage.sync` on meeting start
- `cost_per_second = (annual_salary / 52 / 40 / 3600) * team_size`
- `setInterval` every 1000ms, increment accumulated cost
- Format: `Intl.NumberFormat` with ISO currency code, always 2 decimal places
- Cost is constant once meeting starts (settings changes mid-meeting don't affect running total)

**Meeting End:**
- Clear interval
- Show summary overlay (see summary.js)
- Save to `chrome.storage.local` meeting_history: `{date, duration_seconds, cost, team_size, salary, currency}`
- Cap history at 100 entries, trim oldest

**Share Button:**
- Generate text: `"Just finished a {N}-min meeting that cost our team ${cost} 💸 — Meeting Cost Ticker for Chrome"`
- `navigator.clipboard.writeText(...)` → show "Copied!" confirmation

### summary.js (end-of-meeting overlay)

- Full-page dark overlay, centered card
- Shows: "Meeting complete", duration, cost, team size, salary used
- "Share this" button (clipboard copy)
- "Dismiss" button (removes overlay)

### popup.html / popup.js / popup.css

Width: 320px, dark-friendly UI.

**Sections:**
1. Header — logo + title + version
2. Config — team size, annual salary, currency select (USD/EUR/GBP/NPR/INR/AUD). Live calculation display: "Hourly cost per person" and "Per second". Save button → `chrome.storage.sync`
3. Stats — "This Week": total meetings, total time (hrs), total cost ($)
4. History — last 5 meetings (date, duration, cost). "Clear history" link
5. Footer — "Rate this extension" | "Report a bug" | "More tools by TabKit" links + Ko-fi widget (ID: Y8Y0BW7ME, color: #72a4f2) + "Made with ♥ by TabKit"

### Icons

Dollar sign ($) inside a clock face circle. Color: `#72a4f2` blue, white accents, dark bg `#1a1a2e`. Geometric, minimal.

- `icon16.svg` — simplified: $ in circle, no hands
- `icon32.svg` — $ with simplified clock circle
- `icon48.svg` — full design with clock hands at ~10:10
- `icon128.svg` — full detail with SVG filter inner glow
- `logo-full.svg` — 400×100 horizontal lockup: icon + wordmark + tagline

### Store Assets

All HTML files: `<!-- Screenshot at 1280x800 -->` comment at top.

- `screenshot-1.html` — fake Google Meet UI with ticker overlay showing `$87.42 · 12:34 · 5 people`. Caption: "Live cost tracker — always visible, never intrusive"
- `screenshot-2.html` — Chrome browser frame with popup UI and sample stats. Caption: "Set once, works everywhere"
- `screenshot-3.html` — end-of-meeting summary overlay on blurred Meet bg. Caption: "Every meeting gets a receipt"
- `promo-tile.html` — 440×280, dark `#1a1a2e` bg, icon, title, subtitle, 3 feature pills

---

## Key Decisions

1. **No build step** — pure vanilla JS, load directly in Chrome
2. **MutationObserver not polling** — efficient meeting detection
3. **Cost locked at meeting start** — settings changes don't affect running meeting (prevents confusion)
4. **summary.js as separate file** — keeps content.js focused; both injected via manifest
5. **History capped at 100** — trim oldest when exceeded, prevents unbounded storage growth
6. **Intl.NumberFormat for currency** — correct locale symbols without a library

---

## Constraints

- No external network requests from content.js or background.js
- Extension works fully offline
- No backend, no account, no data leaves browser
- Ko-fi widget loads from `https://storage.ko-fi.com/cdn/widget/Widget_2.js` (popup only)
