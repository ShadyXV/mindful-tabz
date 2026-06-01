import browser from '../browser/api'
import type {
  Site,
  ScreenTimeEntry,
  Group,
  AnalyticsSnapshot,
  HistoryRecord,
  BlockEvent,
  BlockingPauseEvent,
  StorageData,
  StorageChangeCallback,
} from '../types'

export type {
  Site,
  ScreenTimeEntry,
  Group,
  AnalyticsSnapshot,
  HistoryRecord,
  BlockEvent,
  BlockingPauseEvent,
  StorageData,
  StorageChangeCallback,
}

function getLocalDateString(): string {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const localDate = new Date(d.getTime() - (offset * 60 * 1000))
  return localDate.toISOString().split('T')[0]
}

function getCutoffDateString(): string {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 30)
  const cutoffOffset = cutoffDate.getTimezoneOffset()
  const cutoffLocal = new Date(cutoffDate.getTime() - (cutoffOffset * 60 * 1000))
  return cutoffLocal.toISOString().split('T')[0]
}

function pruneRollingData(data: StorageData): void {
  const cutoffStr = getCutoffDateString()
  data.history = data.history.filter(h => h.date >= cutoffStr)
  data.blockEvents = data.blockEvents.filter(e => e.date >= cutoffStr)
  data.blockingPauseEvents = data.blockingPauseEvents.filter(e => e.date >= cutoffStr)
}

function normalizeSites(sites: Site[]): Site[] {
  return sites.map(site => ({
    ...site,
    blockingEnabled: site.blockingEnabled ?? true,
  }))
}

class StorageEngine {
  private async getData(): Promise<StorageData> {
    const result = await browser.storage.local.get([
      'sites',
      'groups',
      'screenTime',
      'analyticsSnapshots',
      'lastResetDate',
      'history',
      'blockEvents',
      'blockingPauseEvents',
      'blockingEnabled',
    ])
    return {
      sites: normalizeSites((result.sites || []) as Site[]),
      groups: (result.groups || []) as Group[],
      screenTime: (result.screenTime || []) as ScreenTimeEntry[],
      analyticsSnapshots: (result.analyticsSnapshots || []) as AnalyticsSnapshot[],
      lastResetDate: (result.lastResetDate || '') as string,
      history: (result.history || []) as HistoryRecord[],
      blockEvents: (result.blockEvents || []) as BlockEvent[],
      blockingPauseEvents: (result.blockingPauseEvents || []) as BlockingPauseEvent[],
      blockingEnabled: typeof result.blockingEnabled === 'boolean' ? result.blockingEnabled : true,
    }
  }

  private async saveData(data: Partial<StorageData>): Promise<void> {
    await browser.storage.local.set(data)
  }

  async saveAnalyticsSnapshot(snapshot: Omit<AnalyticsSnapshot, 'id'>): Promise<void> {
    const data = await this.getData()
    const newSnapshot = { ...snapshot, id: crypto.randomUUID() }
    const newSnapshots = [...data.analyticsSnapshots, newSnapshot].slice(-100)
    await this.saveData({ analyticsSnapshots: newSnapshots })
  }

  async recordActivity(
    domain: string,
    deltaMinutes: number
  ): Promise<{ shouldBlock: boolean; reason: string | null }> {
    const data = await this.getData()
    let shouldBlock = false
    let reason: string | null = null

    // Update daily screenTime
    let screenEntry = data.screenTime.find(e => e.domain === domain)
    if (!screenEntry) {
      screenEntry = { domain, timeSpentToday: 0 }
      data.screenTime.push(screenEntry)
    }
    screenEntry.timeSpentToday += deltaMinutes

    // Record to rolling hourly history
    const today = getLocalDateString()
    const currentHour = new Date().getHours()
    let historyEntry = data.history.find(h => h.date === today && h.hour === currentHour && h.domain === domain)
    if (!historyEntry) {
      historyEntry = { date: today, hour: currentHour, domain, timeSpent: 0 }
      data.history.push(historyEntry)
    }
    historyEntry.timeSpent += deltaMinutes

    pruneRollingData(data)

    const site = data.sites.find(s => s.domain === domain)
    if (site) {
      site.timeSpentToday += deltaMinutes
      site.sessionTimeSpent += deltaMinutes
    }

    for (const group of data.groups) {
      if (group.sites.includes(domain)) {
        group.timeSpentToday += deltaMinutes
      }
    }

    reason = this.getBlockReasonFromData(data, domain)
    shouldBlock = !!reason

    data.sites.forEach(s => {
      if (s.domain !== domain) {
        s.sessionTimeSpent = 0
      }
    })

    await this.saveData(data)
    return { shouldBlock, reason }
  }

  async recordBlockEvent(domain: string, reason: string, count: number): Promise<void> {
    if (count <= 0) return

    const data = await this.getData()
    const today = getLocalDateString()
    const currentHour = new Date().getHours()
    const event = data.blockEvents.find(
      e => e.date === today && e.hour === currentHour && e.domain === domain && e.reason === reason
    )

    if (event) {
      event.count += count
    } else {
      data.blockEvents.push({ date: today, hour: currentHour, domain, reason, count })
    }

    pruneRollingData(data)
    await this.saveData({
      history: data.history,
      blockEvents: data.blockEvents,
      blockingPauseEvents: data.blockingPauseEvents,
    })
  }

  async getBlockReasonForDomain(domain: string): Promise<string | null> {
    const data = await this.getData()
    return this.getBlockReasonFromData(data, domain)
  }

  async setGlobalBlockingEnabled(enabled: boolean): Promise<void> {
    const data = await this.getData()
    if (data.blockingEnabled === enabled) return

    data.blockingEnabled = enabled
    this.recordBlockingPauseEventInData(data, 'global', null, enabled ? 'resumed' : 'paused')
    pruneRollingData(data)
    await this.saveData({
      blockingEnabled: data.blockingEnabled,
      blockingPauseEvents: data.blockingPauseEvents,
    })
  }

  async setSiteBlockingEnabled(domain: string, enabled: boolean): Promise<void> {
    const data = await this.getData()
    const site = data.sites.find(s => s.domain === domain)
    if (!site || site.blockingEnabled === enabled) return

    site.blockingEnabled = enabled
    this.recordBlockingPauseEventInData(data, 'site', domain, enabled ? 'resumed' : 'paused')
    pruneRollingData(data)
    await this.saveData({
      sites: data.sites,
      blockingPauseEvents: data.blockingPauseEvents,
    })
  }

  async resetIfNewDay(): Promise<boolean> {
    const data = await this.getData()
    const today = getLocalDateString()

    if (data.lastResetDate !== today) {
      data.sites.forEach(s => {
        s.timeSpentToday = 0
        s.sessionTimeSpent = 0
      })
      data.groups.forEach(g => (g.timeSpentToday = 0))
      data.screenTime = []
      data.lastResetDate = today
      await this.saveData(data)
      return true
    }
    return false
  }

  async getFullState(): Promise<StorageData> {
    return this.getData()
  }

  async addSite(domain: string, limit: number, sessionLimit: number): Promise<void> {
    const data = await this.getData()
    if (data.sites.find(s => s.domain === domain)) return

    const history = data.screenTime.find(e => e.domain === domain)
    data.sites.push({
      domain,
      limitMinutes: limit,
      sessionLimitMinutes: sessionLimit,
      timeSpentToday: history ? history.timeSpentToday : 0,
      sessionTimeSpent: 0,
      blockingEnabled: true,
    })
    await this.saveData({ sites: data.sites })
  }

  async updateSite(domain: string, limit: number, sessionLimit: number): Promise<void> {
    const data = await this.getData()
    const site = data.sites.find(s => s.domain === domain)
    if (site) {
      site.limitMinutes = limit
      site.sessionLimitMinutes = sessionLimit
      await this.saveData({ sites: data.sites })
    }
  }

  private getBlockReasonFromData(data: StorageData, domain: string): string | null {
    if (!data.blockingEnabled) return null

    const site = data.sites.find(s => s.domain === domain)
    if (!site || !site.blockingEnabled) return null

    if (site.limitMinutes > 0 && site.timeSpentToday >= site.limitMinutes) {
      return 'daily'
    }

    if (site.sessionLimitMinutes > 0 && site.sessionTimeSpent >= site.sessionLimitMinutes) {
      return 'session'
    }

    const matchingGroup = data.groups.find(
      group => group.sites.includes(domain) && group.limitMinutes > 0 && group.timeSpentToday >= group.limitMinutes
    )
    return matchingGroup ? 'group' : null
  }

  private recordBlockingPauseEventInData(
    data: StorageData,
    scope: 'global' | 'site',
    domain: string | null,
    action: 'paused' | 'resumed'
  ): void {
    const today = getLocalDateString()
    const currentHour = new Date().getHours()
    const event = data.blockingPauseEvents.find(
      e => e.date === today && e.hour === currentHour && e.scope === scope && e.domain === domain && e.action === action
    )

    if (event) {
      event.count += 1
    } else {
      data.blockingPauseEvents.push({ date: today, hour: currentHour, scope, domain, action, count: 1 })
    }
  }

  async removeSite(domain: string): Promise<void> {
    const data = await this.getData()
    const sites = data.sites.filter(s => s.domain !== domain)
    const groups = data.groups.map(g => ({
      ...g,
      sites: g.sites.filter(s => s !== domain),
    }))
    await this.saveData({ sites, groups })
  }

  async createGroup(name: string, limit: number): Promise<void> {
    const data = await this.getData()
    data.groups.push({
      id: crypto.randomUUID(),
      name,
      sites: [],
      limitMinutes: limit,
      timeSpentToday: 0,
    })
    await this.saveData({ groups: data.groups })
  }

  async removeGroup(id: string): Promise<void> {
    const data = await this.getData()
    const groups = data.groups.filter(g => g.id !== id)
    await this.saveData({ groups })
  }

  async toggleSiteInGroup(groupId: string, domain: string): Promise<void> {
    const data = await this.getData()
    const group = data.groups.find(g => g.id === groupId)
    if (group) {
      if (group.sites.includes(domain)) {
        group.sites = group.sites.filter(s => s !== domain)
      } else {
        group.sites.push(domain)
      }
      group.timeSpentToday = data.screenTime
        .filter(e => group.sites.includes(e.domain))
        .reduce((sum, e) => sum + e.timeSpentToday, 0)
      await this.saveData({ groups: data.groups })
    }
  }

  subscribe(callback: StorageChangeCallback): () => void {
    const listener = () => {
      this.getData().then(callback)
    }
    browser.storage.onChanged.addListener(listener)
    return () => browser.storage.onChanged.removeListener(listener)
  }
}

export const storageEngine = new StorageEngine()
