import browser from './browser/api'
import { focusTracker } from './lib/FocusTracker'
import type { FocusEffect } from './lib/FocusTracker'
import { domainNormalizer } from './lib/DomainNormalizer'

async function syncActiveTab() {
  try {
    const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true })
    if (tab) {
      focusTracker.setActiveDomain(domainNormalizer.normalize(tab.url))
    }
  } catch (err) {
    console.error('Failed to sync active tab:', err)
  }
}

async function runTick() {
  await syncActiveTab()
  const effects = await focusTracker.handleTick()
  executeEffects(effects)
}

function executeEffects(effects: FocusEffect[]) {
  for (const effect of effects) {
    switch (effect.type) {
      case 'BLOCK':
        blockDomain(effect.domain, effect.reason)
        break
      case 'NOTIFY':
        showNotification(effect.message)
        break
    }
  }
}

async function blockDomain(domain: string, reason: string) {
  const tabs = await browser.tabs.query({ url: [`*://*.${domain}/*`] })
  for (const tab of tabs) {
    if (tab.id) {
      browser.tabs.update(tab.id, {
        url: browser.runtime.getURL(`blocked.html?site=${domain}&reason=${reason}`),
      })
    }
  }
}

function showNotification(message: string) {
  browser.notifications.create({
    type: 'basic',
    iconUrl: 'favicon.svg',
    title: 'Mindful Tabz',
    message: message,
    priority: 2,
  })
}

browser.tabs.onActivated.addListener(async activeInfo => {
  try {
    const tab = await browser.tabs.get(activeInfo.tabId)
    focusTracker.setActiveDomain(domainNormalizer.normalize(tab.url))
  } catch (err) {
    console.error(err)
  }
})

browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    focusTracker.setActiveDomain(domainNormalizer.normalize(tab.url))
  }
})

browser.windows.onFocusChanged.addListener(async windowId => {
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    focusTracker.setActiveDomain(null)
  } else {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (tab) {
        focusTracker.setActiveDomain(domainNormalizer.normalize(tab.url))
      }
    } catch (err) {
      console.error(err)
    }
  }
})

browser.alarms.create('tick', { periodInMinutes: 10 / 60 })
browser.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'tick') {
    runTick()
  }
})

browser.runtime.onInstalled.addListener(() => {
  runTick()
})

syncActiveTab()
