import assert from 'node:assert/strict'
import test from 'node:test'
import { getBadgeRemainingMinutes } from '../src/lib/badgePolicy.ts'
import type { Site } from '../src/types'

function makeSite(overrides: Partial<Site> = {}): Site {
  return {
    domain: 'example.com',
    limitMinutes: 30,
    sessionLimitMinutes: 10,
    timeSpentToday: 0,
    sessionTimeSpent: 0,
    sessionBlockedUntil: null,
    blockingEnabled: true,
    ...overrides,
  }
}

test('uses session remaining time when a site has a session limit', () => {
  const site = makeSite({
    limitMinutes: 30,
    sessionLimitMinutes: 10,
    timeSpentToday: 29.5,
    sessionTimeSpent: 6.5,
  })

  assert.equal(getBadgeRemainingMinutes(site), 3.5)
})

test('ignores disabled daily limits when session limit is active', () => {
  const site = makeSite({
    limitMinutes: 0,
    sessionLimitMinutes: 10,
    timeSpentToday: 42,
    sessionTimeSpent: 6.5,
  })

  assert.equal(getBadgeRemainingMinutes(site), 3.5)
})

test('falls back to daily remaining time when no session limit exists', () => {
  const site = makeSite({
    limitMinutes: 30,
    sessionLimitMinutes: 0,
    timeSpentToday: 12,
    sessionTimeSpent: 0,
  })

  assert.equal(getBadgeRemainingMinutes(site), 18)
})

test('returns zero when the daily limit is already reached', () => {
  const site = makeSite({
    limitMinutes: 30,
    sessionLimitMinutes: 10,
    timeSpentToday: 30,
    sessionTimeSpent: 4,
  })

  assert.equal(getBadgeRemainingMinutes(site), 0)
})

test('returns zero during a session cooldown', () => {
  const site = makeSite({
    sessionTimeSpent: 10,
    sessionBlockedUntil: 10_000,
  })

  assert.equal(getBadgeRemainingMinutes(site, 5_000), 0)
})

test('hides the badge when the site has no positive limits', () => {
  const site = makeSite({
    limitMinutes: 0,
    sessionLimitMinutes: 0,
  })

  assert.equal(getBadgeRemainingMinutes(site), null)
})
