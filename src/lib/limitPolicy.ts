import type { Site } from '../types'

export function isDailyLimitReached(site: Pick<Site, 'limitMinutes' | 'timeSpentToday'>): boolean {
  return site.limitMinutes > 0 && site.timeSpentToday >= site.limitMinutes
}
