import assert from 'node:assert/strict'
import test from 'node:test'
import { canEnforceSiteBlocking } from '../src/lib/blockingPolicy.ts'

test('allows enforcement only when global and site blocking are both enabled', () => {
  assert.equal(canEnforceSiteBlocking(true, { blockingEnabled: true }), true)
})

test('prevents enforcement while global blocking is paused', () => {
  assert.equal(canEnforceSiteBlocking(false, { blockingEnabled: true }), false)
})

test('prevents enforcement while site blocking is paused', () => {
  assert.equal(canEnforceSiteBlocking(true, { blockingEnabled: false }), false)
})

test('prevents enforcement when the domain is not a blocked site', () => {
  assert.equal(canEnforceSiteBlocking(true, null), false)
})
