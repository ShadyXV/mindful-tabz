import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_SESSION_COOLDOWN_MINUTES,
  isSessionCoolingDown,
  normalizeSessionCooldownMinutes,
  refreshExpiredSessionCooldown,
  startSessionCooldownIfNeeded,
} from '../src/lib/sessionPolicy.ts'
import type { Site } from '../src/types'

function makeSite(overrides: Partial<Site> = {}): Site {
  return {
    domain: 'example.com',
    limitMinutes: 60,
    sessionLimitMinutes: 10,
    timeSpentToday: 0,
    sessionTimeSpent: 0,
    sessionBlockedUntil: null,
    blockingEnabled: true,
    ...overrides,
  }
}

test('starts a session cooldown as soon as the session limit is reached', () => {
  const site = makeSite({ sessionTimeSpent: 10 })
  const now = 1_000

  const didStart = startSessionCooldownIfNeeded(site, now, 5)

  assert.equal(didStart, true)
  assert.equal(site.sessionBlockedUntil, 301_000)
  assert.equal(isSessionCoolingDown(site, now + 1), true)
})

test('keeps a completed session blocked until the cooldown expires', () => {
  const site = makeSite({ sessionTimeSpent: 10, sessionBlockedUntil: 301_000 })

  assert.equal(refreshExpiredSessionCooldown(site, 300_999), false)
  assert.equal(isSessionCoolingDown(site, 300_999), true)

  assert.equal(refreshExpiredSessionCooldown(site, 301_000), true)
  assert.equal(site.sessionTimeSpent, 0)
  assert.equal(site.sessionBlockedUntil, null)
  assert.equal(isSessionCoolingDown(site, 301_000), false)
})

test('normalizes invalid cooldown settings to the default', () => {
  assert.equal(normalizeSessionCooldownMinutes(Number.NaN), DEFAULT_SESSION_COOLDOWN_MINUTES)
  assert.equal(normalizeSessionCooldownMinutes(0), 1)
  assert.equal(normalizeSessionCooldownMinutes(5.8), 5)
})
