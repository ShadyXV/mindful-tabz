import { storageEngine } from '../lib/StorageEngine'

export function useGroups() {
  return {
    createGroup: (name: string, limit: number) => storageEngine.createGroup(name, limit),
    removeGroup: (id: string) => storageEngine.removeGroup(id),
    toggleSiteInGroup: (groupId: string, domain: string) =>
      storageEngine.toggleSiteInGroup(groupId, domain),
  }
}
