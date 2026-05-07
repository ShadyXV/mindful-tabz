
export interface Site {
  domain: string;
  limitMinutes: number;
  sessionLimitMinutes: number;
  timeSpentToday: number;
  sessionTimeSpent: number;
}

export interface ScreenTimeEntry {
  domain: string;
  timeSpentToday: number;
}

export interface Group {
  id: string;
  name: string;
  sites: string[];
  limitMinutes: number;
  timeSpentToday: number;
}

export interface StorageData {
  sites: Site[];
  groups: Group[];
  screenTime: ScreenTimeEntry[];
  lastResetDate: string;
}

export type StorageChangeCallback = (data: StorageData) => void;

class StorageEngine {
  private async getData(): Promise<StorageData> {
    const result = await chrome.storage.local.get(['sites', 'groups', 'screenTime', 'lastResetDate']);
    return {
      sites: (result.sites || []) as Site[],
      groups: (result.groups || []) as Group[],
      screenTime: (result.screenTime || []) as ScreenTimeEntry[],
      lastResetDate: (result.lastResetDate || '') as string
    };
  }

  private async saveData(data: Partial<StorageData>): Promise<void> {
    await chrome.storage.local.set(data);
  }

  /**
   * Deep Interface: One method to rule all activity recording.
   * Handles watchlist, groups, and general screen time history.
   */
  async recordActivity(domain: string, deltaMinutes: number): Promise<{ shouldBlock: boolean; reason: string | null }> {
    const data = await this.getData();
    let shouldBlock = false;
    let reason: string | null = null;

    // 1. Update general screen time history
    let screenEntry = data.screenTime.find(e => e.domain === domain);
    if (!screenEntry) {
      screenEntry = { domain, timeSpentToday: 0 };
      data.screenTime.push(screenEntry);
    }
    screenEntry.timeSpentToday += deltaMinutes;

    // 2. Update specific site watchlist
    const site = data.sites.find(s => s.domain === domain);
    if (site) {
      site.timeSpentToday += deltaMinutes;
      site.sessionTimeSpent += deltaMinutes;

      // Check blocking rules
      if (site.limitMinutes > 0 && site.timeSpentToday >= site.limitMinutes) {
        shouldBlock = true;
        reason = 'daily';
      } else if (site.sessionLimitMinutes > 0 && site.sessionTimeSpent >= site.sessionLimitMinutes) {
        shouldBlock = true;
        reason = 'session';
      }
    }

    // 3. Update groups
    for (const group of data.groups) {
      if (group.sites.includes(domain)) {
        group.timeSpentToday += deltaMinutes;
        if (!shouldBlock && group.limitMinutes > 0 && group.timeSpentToday >= group.limitMinutes) {
          shouldBlock = true;
          reason = 'group';
        }
      }
    }

    // 4. Reset other sites' sessions
    data.sites.forEach(s => {
      if (s.domain !== domain) {
        s.sessionTimeSpent = 0;
      }
    });

    await this.saveData(data);
    return { shouldBlock, reason };
  }

  async resetIfNewDay(): Promise<boolean> {
    const data = await this.getData();
    const today = new Date().toISOString().split('T')[0];

    if (data.lastResetDate !== today) {
      data.sites.forEach(s => {
        s.timeSpentToday = 0;
        s.sessionTimeSpent = 0;
      });
      data.groups.forEach(g => g.timeSpentToday = 0);
      data.screenTime = [];
      data.lastResetDate = today;
      await this.saveData(data);
      return true;
    }
    return false;
  }

  async getFullState(): Promise<StorageData> {
    return this.getData();
  }

  async addSite(domain: string, limit: number, sessionLimit: number): Promise<void> {
    const data = await this.getData();
    if (data.sites.find(s => s.domain === domain)) return;
    
    // Check if we already have screen time data for this site to populate initial today's time
    const history = data.screenTime.find(e => e.domain === domain);

    data.sites.push({
      domain,
      limitMinutes: limit,
      sessionLimitMinutes: sessionLimit,
      timeSpentToday: history ? history.timeSpentToday : 0,
      sessionTimeSpent: 0
    });
    await this.saveData({ sites: data.sites });
  }

  async updateSite(domain: string, limit: number, sessionLimit: number): Promise<void> {
    const data = await this.getData();
    const site = data.sites.find(s => s.domain === domain);
    if (site) {
      site.limitMinutes = limit;
      site.sessionLimitMinutes = sessionLimit;
      await this.saveData({ sites: data.sites });
    }
  }

  async removeSite(domain: string): Promise<void> {
    const data = await this.getData();
    const sites = data.sites.filter(s => s.domain !== domain);
    // Also remove from groups
    const groups = data.groups.map(g => ({
      ...g,
      sites: g.sites.filter(s => s !== domain)
    }));
    await this.saveData({ sites, groups });
  }

  async createGroup(name: string, limit: number): Promise<void> {
    const data = await this.getData();
    data.groups.push({
      id: crypto.randomUUID(),
      name,
      sites: [],
      limitMinutes: limit,
      timeSpentToday: 0
    });
    await this.saveData({ groups: data.groups });
  }

  async removeGroup(id: string): Promise<void> {
    const data = await this.getData();
    const groups = data.groups.filter(g => g.id !== id);
    await this.saveData({ groups });
  }

  async toggleSiteInGroup(groupId: string, domain: string): Promise<void> {
    const data = await this.getData();
    const group = data.groups.find(g => g.id === groupId);
    if (group) {
      if (group.sites.includes(domain)) {
        group.sites = group.sites.filter(s => s !== domain);
      } else {
        group.sites.push(domain);
      }
      // Re-calculate group time based on current history of included sites
      group.timeSpentToday = data.screenTime
        .filter(e => group.sites.includes(e.domain))
        .reduce((sum, e) => sum + e.timeSpentToday, 0);
        
      await this.saveData({ groups: data.groups });
    }
  }

  subscribe(callback: StorageChangeCallback): () => void {
    const listener = () => {
      this.getData().then(callback);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
}

export const storageEngine = new StorageEngine();
