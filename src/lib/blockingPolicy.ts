import type { Site } from '../types'

export function canEnforceSiteBlocking(globalBlockingEnabled: boolean, site: Pick<Site, 'blockingEnabled'> | null): boolean {
  return globalBlockingEnabled && site !== null && site.blockingEnabled
}
