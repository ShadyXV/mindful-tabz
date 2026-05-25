import browser from '../browser/api'
import type {
  Site,
  ScreenTimeEntry,
  Group,
  AnalyticsSnapshot,
  HistoryRecord,
  StorageData,
  StorageChangeCallback,
} from '../types'

export type {
  Site,
  ScreenTimeEntry,
  Group,
  AnalyticsSnapshot,
  HistoryRecord,
  StorageData,
  StorageChangeCallback,
}

function getLocalDateString(): string {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const localDate = new Date(d.getTime() - (offset * 60 * 1000))
  return localDate.toISOString().split('T')[0]
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
    ])
    return {
      sites: (result.sites || []) as Site[],
      groups: (result.groups || []) as Group[],
      screenTime: (result.screenTime || []) as ScreenTimeEntry[],
      analyticsSnapshots: (result.analyticsSnapshots || []) as AnalyticsSnapshot[],
      lastResetDate: (result.lastResetDate || '') as string,
      history: (result.history || []) as HistoryRecord[],
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

    // Prune history to last 30 days
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30)
    const cutoffOffset = cutoffDate.getTimezoneOffset()
    const cutoffLocal = new Date(cutoffDate.getTime() - (cutoffOffset * 60 * 1000))
    const cutoffStr = cutoffLocal.toISOString().split('T')[0]
    data.history = data.history.filter(h => h.date >= cutoffStr)

    const site = data.sites.find(s => s.domain === domain)
    if (site) {
      site.timeSpentToday += deltaMinutes
      site.sessionTimeSpent += deltaMinutes

      if (site.limitMinutes > 0 && site.timeSpentToday >= site.limitMinutes) {
        shouldBlock = true
        reason = 'daily'
      } else if (site.sessionLimitMinutes > 0 && site.sessionTimeSpent >= site.sessionLimitMinutes) {
        shouldBlock = true
        reason = 'session'
      }
    }

    for (const group of data.groups) {
      if (group.sites.includes(domain)) {
        group.timeSpentToday += deltaMinutes
        if (!shouldBlock && group.limitMinutes > 0 && group.timeSpentToday >= group.limitMinutes) {
          shouldBlock = true
          reason = 'group'
        }
      }
    }

    data.sites.forEach(s => {
      if (s.domain !== domain) {
        s.sessionTimeSpent = 0
      }
    })

    await this.saveData(data)
    return { shouldBlock, reason }
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
