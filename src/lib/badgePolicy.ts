import type { Site } from '../types'
import { isSessionCoolingDown } from './sessionPolicy.ts'

export function getBadgeRemainingMinutes(site: Site, nowMs: number = Date.now()): number | null {
  if (site.limitMinutes > 0 && site.timeSpentToday >= site.limitMinutes) {
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
