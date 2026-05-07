
interface Site {
  domain: string;
  limitMinutes: number;
  sessionLimitMinutes: number;
  timeSpentToday: number;
  sessionTimeSpent: number;
}

interface ScreenTimeEntry {
  domain: string;
  timeSpentToday: number; // in minutes
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
  screenTime: ScreenTimeEntry[];
  lastResetDate: string;
}

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

async function checkAndRedirect(domain: string, data: StorageData) {
  const site = data.sites.find(s => s.domain === domain);
  const groups = data.groups.filter(g => g.sites.includes(domain));

  let shouldBlock = false;
  let reason = 'daily';

  if (site) {
    if (site.limitMinutes > 0 && site.timeSpentToday >= site.limitMinutes) {
      shouldBlock = true;
      reason = 'daily';
    } else if (site.sessionLimitMinutes > 0 && site.sessionTimeSpent >= site.sessionLimitMinutes) {
      shouldBlock = true;
      reason = 'session';
    }
  }

  if (!shouldBlock) {
    for (const group of groups) {
      if (group.limitMinutes > 0 && group.timeSpentToday >= group.limitMinutes) {
        shouldBlock = true;
        reason = 'group';
        break;
      }
    }
  }

  if (shouldBlock) {
    const tabs = await chrome.tabs.query({ url: [`*://*.${domain}/*`] });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.update(tab.id, { url: chrome.runtime.getURL(`blocked.html?site=${domain}&reason=${reason}`) });
      }
    }
  }
}

async function updateTime() {
  const now = Date.now();
  const deltaSeconds = (now - lastTickTime) / 1000;
  lastTickTime = now;

  const result = await chrome.storage.local.get(['sites', 'groups', 'screenTime', 'lastResetDate']);
  const sites = (result.sites || []) as Site[];
  const groups = (result.groups || []) as Group[];
  const screenTime = (result.screenTime || []) as ScreenTimeEntry[];
  const lastResetDate = (result.lastResetDate || '') as string;

  const today = new Date().toISOString().split('T')[0];
  if (lastResetDate !== today) {
    sites.forEach(s => {
      s.timeSpentToday = 0;
      s.sessionTimeSpent = 0;
    });
    groups.forEach(g => g.timeSpentToday = 0);
    // Reset screen time daily too
    await chrome.storage.local.set({ sites, groups, screenTime: [], lastResetDate: today });
    return;
  }

  if (!activeTabDomain) return;

  let changed = false;
  let screenTimeChanged = false;
  const deltaMinutes = deltaSeconds / 60;

  // Track global screen time for ALL visited sites
  let entry = screenTime.find(e => e.domain === activeTabDomain);
  if (!entry) {
    entry = { domain: activeTabDomain, timeSpentToday: 0 };
    screenTime.push(entry);
  }
  entry.timeSpentToday += deltaMinutes;
  screenTimeChanged = true;

  // Reset other sites' session time if they are not active
  sites.forEach(s => {
    if (s.domain !== activeTabDomain) {
      s.sessionTimeSpent = 0;
    }
  });

  const site = sites.find(s => s.domain === activeTabDomain);
  if (site) {
    const oldDaily = site.timeSpentToday;
    const oldSession = site.sessionTimeSpent;
    
    site.timeSpentToday += deltaMinutes;
    site.sessionTimeSpent += deltaMinutes;
    changed = true;

    if (site.limitMinutes > 0) {
      if (oldDaily < site.limitMinutes - 5 && site.timeSpentToday >= site.limitMinutes - 5) {
        showNotification(`5 minutes left today for ${activeTabDomain}`);
      } else if (oldDaily < site.limitMinutes - 1 && site.timeSpentToday >= site.limitMinutes - 1) {
        showNotification(`1 minute left today for ${activeTabDomain}`);
      }
    }

    if (site.sessionLimitMinutes > 0) {
      if (oldSession < site.sessionLimitMinutes - 2 && site.sessionTimeSpent >= site.sessionLimitMinutes - 2) {
        showNotification(`Session ending in 2 minutes for ${activeTabDomain}`);
      }
    }
  }

  for (const group of groups) {
    if (group.sites.includes(activeTabDomain)) {
      group.timeSpentToday += deltaMinutes;
      changed = true;
    }
  }

  const updates: any = {};
  if (changed) {
    updates.sites = sites;
    updates.groups = groups;
  }
  if (screenTimeChanged) {
    updates.screenTime = screenTime;
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
    if (changed) {
      await checkAndRedirect(activeTabDomain, { sites, groups, screenTime, lastResetDate });
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
  const today = new Date().toISOString().split('T')[0];
  chrome.storage.local.set({ sites: [], groups: [], screenTime: [], lastResetDate: today });
});
