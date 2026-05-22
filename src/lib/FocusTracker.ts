import { storageEngine } from './StorageEngine'
import type { StorageData, FocusEffect } from '../types'

export type { FocusEffect }

class FocusTracker {
  private activeDomain: string | null = null
  private lastTickTime: number = Date.now()
  private warnedThresholds: Set<string> = new Set()

  async handleTick(): Promise<FocusEffect[]> {
    const effects: FocusEffect[] = []
    const now = Date.now()
    const deltaSeconds = (now - this.lastTickTime) / 1000
    this.lastTickTime = now

    const didReset = await storageEngine.resetIfNewDay()
    if (didReset) {
      this.warnedThresholds.clear()
      return effects
    }

    if (!this.activeDomain) return effects

    const deltaMinutes = deltaSeconds / 60

    const stateBefore = await storageEngine.getFullState()
    const { shouldBlock, reason } = await storageEngine.recordActivity(this.activeDomain, deltaMinutes)

    if (shouldBlock && reason) {
      effects.push({ type: 'BLOCK', domain: this.activeDomain, reason })
    }

    const stateAfter = await storageEngine.getFullState()
    const warnings = this.checkWarningThresholds(this.activeDomain, stateBefore, stateAfter)
    effects.push(...warnings)

    return effects
  }

  setActiveDomain(domain: string | null) {
    if (this.activeDomain !== domain) {
      this.activeDomain = domain
      this.lastTickTime = Date.now()
    }
  }

  private checkWarningThresholds(domain: string, before: StorageData, after: StorageData): FocusEffect[] {
    const effects: FocusEffect[] = []
    const siteBefore = before.sites.find(s => s.domain === domain)
    const siteAfter = after.sites.find(s => s.domain === domain)

    if (!siteBefore || !siteAfter) return effects

    const thresholds = [
      { mins: 5, label: '5 minutes left today' },
      { mins: 1, label: '1 minute left today' },
    ]

    if (siteAfter.limitMinutes > 0) {
      for (const t of thresholds) {
        const remainingBefore = siteBefore.limitMinutes - siteBefore.timeSpentToday
        const remainingAfter = siteAfter.limitMinutes - siteAfter.timeSpentToday
        const key = `${domain}-daily-${t.mins}`

        if (remainingBefore > t.mins && remainingAfter <= t.mins && !this.warnedThresholds.has(key)) {
          effects.push({ type: 'NOTIFY', message: `${t.label} for ${domain}` })
          this.warnedThresholds.add(key)
        }
      }
    }

    if (siteAfter.sessionLimitMinutes > 0) {
      const t = 2
      const remainingBefore = siteAfter.sessionLimitMinutes - siteBefore.sessionTimeSpent
      const remainingAfter = siteAfter.sessionLimitMinutes - siteAfter.sessionTimeSpent
      const key = `${domain}-session-${t}`

      if (remainingBefore > t && remainingAfter <= t && !this.warnedThresholds.has(key)) {
        effects.push({ type: 'NOTIFY', message: `Session ending in ${t} minutes for ${domain}` })
        this.warnedThresholds.add(key)
      }
    }

    return effects
  }
}

export const focusTracker = new FocusTracker()
