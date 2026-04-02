// background.js
const DEFAULT_SETTINGS = {
  team_size: 5,
  annual_salary: 60000,
  currency: 'USD',
  mode: 'company'
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS), (stored) => {
    const toSet = {};
    for (const [key, val] of Object.entries(DEFAULT_SETTINGS)) {
      if (stored[key] === undefined) toSet[key] = val;
    }
    if (Object.keys(toSet).length > 0) {
      chrome.storage.sync.set(toSet).catch((err) => {
        console.error('[MeetCost] Failed to write default settings:', err);
      });
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
