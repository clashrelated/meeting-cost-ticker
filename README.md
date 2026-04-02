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
