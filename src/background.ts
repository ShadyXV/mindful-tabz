import browser from './browser/api'
import { focusTracker } from './lib/FocusTracker'
import type { FocusEffect } from './lib/FocusTracker'
import { domainNormalizer } from './lib/DomainNormalizer'
import { storageEngine } from './lib/StorageEngine'
import { getBadgeRemainingMinutes } from './lib/badgePolicy'
import { getMatchingSite } from './lib/domainPolicy'

function formatTime(minutes: number): string {
  if (minutes < 1) return '<1m'
  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  if (h > 0) return `${h}h${m > 0 ? `${m}m` : ''}`
  return `${m}m`
}

async function updateBadge(activeDomain: string | null) {
  if (!activeDomain) {
    await browser.action.setBadgeText({ text: '' })
    return
  }

  const state = await storageEngine.getFullState()
  const site = getMatchingSite(state.sites, activeDomain)

  if (site) {
    const remainingTime = getBadgeRemainingMinutes(site)
    if (remainingTime === null) {
      await browser.action.setBadgeText({ text: '' })
      return
    }

    const color = remainingTime < 2 ? '#EF4444' : '#3B82F6' // Red if < 2 mins, else Blue
    
    await browser.action.setBadgeBackgroundColor({ color })
    await browser.action.setBadgeText({ text: formatTime(remainingTime) })
  } else {
    // Site is not in the block list, do not show any badge
    await browser.action.setBadgeText({ text: '' })
  }
}

interface ActiveTabContext {
  tabId: number | null
  domain: string | null
}

async function syncActiveTab(): Promise<ActiveTabContext> {
  try {
    const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true })
    if (tab) {
      const domain = domainNormalizer.normalize(tab.url)
      focusTracker.setActiveDomain(domain)
      await updateBadge(domain)
      return { tabId: tab.id ?? null, domain }
    } else {
      await updateBadge(null)
      return { tabId: null, domain: null }
    }
  } catch (err) {
    console.error('Failed to sync active tab:', err)
    return { tabId: null, domain: null }
  }
}

async function runTick() {
  await syncActiveTab()
  const effects = await focusTracker.handleTick()
  const activeTab = await syncActiveTab()
  await enforceActiveBlock(activeTab)
  await executeEffects(effects)
}

async function enforceActiveBlock(activeTab?: ActiveTabContext) {
  try {
    const context = activeTab ?? await syncActiveTab()
    const { domain, tabId } = context

    if (!domain) return
    const reason = await storageEngine.getBlockReasonForDomain(domain)
    if (reason && tabId) {
      const didRedirect = await blockTab(tabId, domain, reason)
      await storageEngine.recordBlockEvent(domain, reason, didRedirect ? 1 : 0)
    }
  } catch (err) {
    console.error('Failed to enforce active block:', err)
  }
}

async function executeEffects(effects: FocusEffect[]) {
  for (const effect of effects) {
    switch (effect.type) {
      case 'BLOCK':
        await blockDomain(effect.domain, effect.reason)
        break
      case 'NOTIFY':
        await showNotification(effect.message)
        break
    }
  }
}

async function blockDomain(domain: string, reason: string) {
  const tabs = await browser.tabs.query({ url: [`*://${domain}/*`, `*://*.${domain}/*`] })
  const redirected = await Promise.all(
    tabs.map(async tab => {
      if (!tab.id) return false
      return blockTab(tab.id, domain, reason)
    })
  )
  const redirectedCount = redirected.filter(Boolean).length
  await storageEngine.recordBlockEvent(domain, reason, redirectedCount)
}

async function blockTab(tabId: number, domain: string, reason: string): Promise<boolean> {
  try {
    await browser.tabs.update(tabId, {
      url: browser.runtime.getURL(`blocked.html?site=${domain}&reason=${reason}`),
    })
    return true
  } catch (err) {
    console.error('Failed to block tab:', err)
    return false
  }
}

async function showNotification(message: string) {
  await browser.notifications.create({
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
    const domain = domainNormalizer.normalize(tab.url)
    focusTracker.setActiveDomain(domain)
    await updateBadge(domain)
    await enforceActiveBlock({ tabId: tab.id ?? null, domain })
  } catch (err) {
    console.error(err)
  }
})

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    const domain = domainNormalizer.normalize(tab.url)
    focusTracker.setActiveDomain(domain)
    await updateBadge(domain)
    await enforceActiveBlock({ tabId, domain })
  }
})

browser.windows.onFocusChanged.addListener(async windowId => {
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    focusTracker.setActiveDomain(null)
    await updateBadge(null)
  } else {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (tab) {
        const domain = domainNormalizer.normalize(tab.url)
        focusTracker.setActiveDomain(domain)
        await updateBadge(domain)
        await enforceActiveBlock({ tabId: tab.id ?? null, domain })
      } else {
        await updateBadge(null)
      }
    } catch (err) {
      console.error(err)
    }
  }
})

browser.alarms.create('tick', { periodInMinutes: 10 / 60 })
browser.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === 'tick') {
    await runTick()
  }
})

browser.runtime.onInstalled.addListener(async () => {
  await runTick()
})

browser.runtime.onStartup.addListener(async () => {
  await runTick()
})

browser.runtime.onMessage.addListener((message: unknown) => {
  if (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === 'CHECK_ACTIVE_BLOCK'
  ) {
    return enforceActiveBlock()
  }

  return undefined
})

syncActiveTab()
