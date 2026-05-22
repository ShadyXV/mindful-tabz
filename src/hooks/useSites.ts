import { storageEngine } from '../lib/StorageEngine'

export function useSites() {
  return {
    addSite: (domain: string, limit: number, sessionLimit: number) =>
      storageEngine.addSite(domain, limit, sessionLimit),
    updateSite: (domain: string, limit: number, sessionLimit: number) =>
      storageEngine.updateSite(domain, limit, sessionLimit),
    removeSite: (domain: string) => storageEngine.removeSite(domain),
  }
}
