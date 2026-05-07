import { storageEngine } from './lib/StorageEngine';

let activeTabDomain: string | null = null;
let lastTickTime = Date.now();

function getDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function updateTime() {
  const now = Date.now();
  const deltaSeconds = (now - lastTickTime) / 1000;
  lastTickTime = now;

  // 1. Locality of reset logic: one method call handles the check
  const didReset = await storageEngine.resetIfNewDay();
  if (didReset) return;

  if (!activeTabDomain) return;

  const deltaMinutes = deltaSeconds / 60;

  // 2. Leverage: Unified activity recording hides multiple state updates
  const { shouldBlock, reason } = await storageEngine.recordActivity(activeTabDomain, deltaMinutes);

  if (shouldBlock) {
    const tabs = await chrome.tabs.query({ url: [`*://*.${activeTabDomain}/*`] });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.update(tab.id, { url: chrome.runtime.getURL(`blocked.html?site=${activeTabDomain}&reason=${reason}`) });
      }
    }
  }
}

// Track active tab
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    activeTabDomain = getDomain(tab.url);
    lastTickTime = Date.now();
  } catch (err) {
    console.error(err);
  }
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    activeTabDomain = getDomain(tab.url);
    lastTickTime = Date.now();
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    activeTabDomain = null;
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        activeTabDomain = getDomain(tab.url);
      }
    } catch (err) {
      console.error(err);
    }
  }
  lastTickTime = Date.now();
});

chrome.alarms.create('tick', { periodInMinutes: 10 / 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tick') {
    updateTime();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  storageEngine.resetIfNewDay();
});
