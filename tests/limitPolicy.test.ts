import assert from 'node:assert/strict'
import test from 'node:test'
import { isDailyLimitReached } from '../src/lib/limitPolicy.ts'

test('daily limit is reached at the configured limit', () => {
  assert.equal(isDailyLimitReached({ limitMinutes: 30, timeSpentToday: 30 }), true)
})

test('daily limit is not reached below the configured limit', () => {
  assert.equal(isDailyLimitReached({ limitMinutes: 30, timeSpentToday: 29.99 }), false)
})

test('disabled daily limits are never reached', () => {
  assert.equal(isDailyLimitReached({ limitMinutes: 0, timeSpentToday: 120 }), false)
})
