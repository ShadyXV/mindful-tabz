import { storageEngine } from '../lib/StorageEngine'

export function useSites() {
  return {
    addSite: (domain: string, limit: number, sessionLimit: number) =>
      storageEngine.addSite(domain, limit, sessionLimit),
    updateSite: (domain: string, limit: number, sessionLimit: number) =>
      storageEngine.updateSite(domain, limit, sessionLimit),
    removeSite: (domain: string) => storageEngine.removeSite(domain),
    setGlobalBlockingEnabled: (enabled: boolean) =>
      storageEngine.setGlobalBlockingEnabled(enabled),
    setSiteBlockingEnabled: (domain: string, enabled: boolean) =>
      storageEngine.setSiteBlockingEnabled(domain, enabled),
  }
}
