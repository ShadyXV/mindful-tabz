
interface Site {
  domain: string;
  limitMinutes: number;
  timeSpentToday: number;
}

interface Group {
  id: string;
  name: string;
  sites: string[];
  limitMinutes: number;
  timeSpentToday: number;
}

interface StorageData {
  sites: Site[];
  groups: Group[];
  lastResetDate: string;
}

let activeTabDomain: string | null = null;
let lastTickTime = Date.now();

// Utility to get domain from URL
function getDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function checkAndRedirect(domain: string, data: StorageData) {
  const site = data.sites.find(s => s.domain === domain);
  const groups = data.groups.filter(g => g.sites.includes(domain));

  let shouldBlock = false;

  if (site && site.limitMinutes > 0 && site.timeSpentToday >= site.limitMinutes) {
    shouldBlock = true;
  }

  for (const group of groups) {
    if (group.limitMinutes > 0 && group.timeSpentToday >= group.limitMinutes) {
      shouldBlock = true;
      break;
    }
  }

  if (shouldBlock) {
    const tabs = await chrome.tabs.query({ url: [`*://*.${domain}/*`] });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.update(tab.id, { url: chrome.runtime.getURL(`blocked.html?site=${domain}`) });
      }
    }
  }
}

async function updateTime() {
  const now = Date.now();
  const deltaSeconds = (now - lastTickTime) / 1000;
  lastTickTime = now;

  if (!activeTabDomain) return;

  const result = await chrome.storage.local.get(['sites', 'groups', 'lastResetDate']);
  const sites = (result.sites || []) as Site[];
  const groups = (result.groups || []) as Group[];
  const lastResetDate = (result.lastResetDate || '') as string;

  // Reset at midnight
  const today = new Date().toISOString().split('T')[0];
  if (lastResetDate !== today) {
    sites.forEach(s => s.timeSpentToday = 0);
    groups.forEach(g => g.timeSpentToday = 0);
    await chrome.storage.local.set({ sites, groups, lastResetDate: today });
    return;
  }

  let changed = false;
  const deltaMinutes = deltaSeconds / 60;

  // Update site time
  const site = sites.find(s => s.domain === activeTabDomain);
  if (site) {
    const oldMinutes = site.timeSpentToday;
    site.timeSpentToday += deltaMinutes;
    changed = true;

    // Warning notification (5 mins and 1 min)
    if (site.limitMinutes > 0) {
        if (oldMinutes < site.limitMinutes - 5 && site.timeSpentToday >= site.limitMinutes - 5) {
            showNotification(`5 minutes remaining for ${activeTabDomain}`);
        } else if (oldMinutes < site.limitMinutes - 1 && site.timeSpentToday >= site.limitMinutes - 1) {
            showNotification(`1 minute remaining for ${activeTabDomain}`);
        }
    }
  }

  // Update group time
  for (const group of groups) {
    if (group.sites.includes(activeTabDomain)) {
      const oldMinutes = group.timeSpentToday;
      group.timeSpentToday += deltaMinutes;
      changed = true;

      if (group.limitMinutes > 0) {
          if (oldMinutes < group.limitMinutes - 5 && group.timeSpentToday >= group.limitMinutes - 5) {
              showNotification(`5 minutes remaining for group: ${group.name}`);
          } else if (oldMinutes < group.limitMinutes - 1 && group.timeSpentToday >= group.limitMinutes - 1) {
              showNotification(`1 minute remaining for group: ${group.name}`);
          }
      }
    }
  }

  if (changed) {
    await chrome.storage.local.set({ sites, groups });
    await checkAndRedirect(activeTabDomain, { sites, groups, lastResetDate });
  }
}

function showNotification(message: string) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'favicon.svg',
        title: 'Block-Ext Warning',
        message: message,
        priority: 2
    });
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

chrome.windows.onFocusChanged.addListener(async (windowId: number) => {
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

// Tick every 10 seconds
chrome.alarms.create('tick', { periodInMinutes: 10 / 60 });
chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
  if (alarm.name === 'tick') {
    updateTime();
  }
});

// Initialization
chrome.runtime.onInstalled.addListener(() => {
    const today = new Date().toISOString().split('T')[0];
    chrome.storage.local.set({ sites: [], groups: [], lastResetDate: today });
});
