import type { Site } from '../types'
import { isDailyLimitReached } from './limitPolicy.ts'
import { isSessionCoolingDown } from './sessionPolicy.ts'

export function getBadgeRemainingMinutes(site: Site, nowMs: number = Date.now()): number | null {
  if (isDailyLimitReached(site)) {
    return 0
  }

  if (site.sessionLimitMinutes > 0) {
    if (isSessionCoolingDown(site, nowMs)) return 0
    return Math.max(0, site.sessionLimitMinutes - site.sessionTimeSpent)
  }

  if (site.limitMinutes > 0) {
    return Math.max(0, site.limitMinutes - site.timeSpentToday)
  }

  return null
}
