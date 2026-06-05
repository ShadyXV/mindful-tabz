import type { Site } from '../types'

export const DEFAULT_SESSION_COOLDOWN_MINUTES = 5
export const MIN_SESSION_COOLDOWN_MINUTES = 1
export const MAX_SESSION_COOLDOWN_MINUTES = 1440

const ONE_MINUTE_MS = 60 * 1000

type SessionState = Pick<Site, 'sessionLimitMinutes' | 'sessionTimeSpent' | 'sessionBlockedUntil'>

export function normalizeSessionCooldownMinutes(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_SESSION_COOLDOWN_MINUTES

  return Math.min(
    MAX_SESSION_COOLDOWN_MINUTES,
    Math.max(MIN_SESSION_COOLDOWN_MINUTES, Math.floor(value))
  )
}

export function isSessionCoolingDown(site: SessionState, nowMs: number): boolean {
  return site.sessionLimitMinutes > 0 && site.sessionBlockedUntil !== null && site.sessionBlockedUntil > nowMs
}

export function refreshExpiredSessionCooldown(site: SessionState, nowMs: number): boolean {
  if (site.sessionBlockedUntil === null || site.sessionBlockedUntil > nowMs) return false

  site.sessionBlockedUntil = null
  site.sessionTimeSpent = 0
  return true
}

export function startSessionCooldownIfNeeded(
  site: SessionState,
  nowMs: number,
  cooldownMinutes: number
): boolean {
  if (site.sessionLimitMinutes <= 0) return false
  if (site.sessionTimeSpent < site.sessionLimitMinutes) return false
  if (isSessionCoolingDown(site, nowMs)) return false

  site.sessionBlockedUntil = nowMs + normalizeSessionCooldownMinutes(cooldownMinutes) * ONE_MINUTE_MS
  return true
}
