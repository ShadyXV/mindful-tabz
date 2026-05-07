import { focusTracker } from './lib/FocusTracker';
import type { FocusEffect } from './lib/FocusTracker';
import { domainNormalizer } from './lib/DomainNormalizer';

async function runTick() {
  const effects = await focusTracker.handleTick();
  executeEffects(effects);
}

function executeEffects(effects: FocusEffect[]) {
  for (const effect of effects) {
    switch (effect.type) {
      case 'BLOCK':
        blockDomain(effect.domain, effect.reason);
        break;
      case 'NOTIFY':
        showNotification(effect.message);
        break;
    }
  }
}

async function blockDomain(domain: string, reason: string) {
  const tabs = await chrome.tabs.query({ url: [`*://*.${domain}/*`] });
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.update(tab.id, { url: chrome.runtime.getURL(`blocked.html?site=${domain}&reason=${reason}`) });
    }
  }
}

function showNotification(message: string) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'favicon.svg',
    title: 'Block-Ext',
    message: message,
    priority: 2
  });
}

// Event Listeners: Thin relays to the FocusTracker
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    focusTracker.setActiveDomain(domainNormalizer.normalize(tab.url));
  } catch (err) {
    console.error(err);
  }
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    focusTracker.setActiveDomain(domainNormalizer.normalize(tab.url));
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    focusTracker.setActiveDomain(null);
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        focusTracker.setActiveDomain(domainNormalizer.normalize(tab.url));
      }
    } catch (err) {
      console.error(err);
    }
  }
});

chrome.alarms.create('tick', { periodInMinutes: 10 / 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tick') {
    runTick();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  runTick();
});
