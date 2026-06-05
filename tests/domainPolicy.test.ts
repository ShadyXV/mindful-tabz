import assert from 'node:assert/strict'
import test from 'node:test'
import { domainMatchesSite, getMatchingSite } from '../src/lib/domainPolicy.ts'
import type { Site } from '../src/types'

function makeSite(domain: string): Site {
  return {
    domain,
    limitMinutes: 15,
    sessionLimitMinutes: 5,
    timeSpentToday: 0,
    sessionTimeSpent: 0,
    sessionBlockedUntil: null,
    blockingEnabled: true,
  }
}

test('matches an exact configured domain', () => {
  assert.equal(domainMatchesSite('example.com', 'example.com'), true)
})

test('matches subdomains of a configured domain', () => {
  assert.equal(domainMatchesSite('app.example.com', 'example.com'), true)
})

test('does not match domain suffix lookalikes', () => {
  assert.equal(domainMatchesSite('badexample.com', 'example.com'), false)
})

test('finds the configured site for a subdomain', () => {
  const site = getMatchingSite([makeSite('example.com')], 'app.example.com')

  assert.equal(site?.domain, 'example.com')
})
