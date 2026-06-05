import type { Site } from '../types'

export function domainMatchesSite(activeDomain: string, siteDomain: string): boolean {
  return activeDomain === siteDomain || activeDomain.endsWith(`.${siteDomain}`)
}

export function getMatchingSite(sites: Site[], activeDomain: string): Site | null {
  return sites.find(site => domainMatchesSite(activeDomain, site.domain)) ?? null
}
