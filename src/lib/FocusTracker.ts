import { storageEngine } from './StorageEngine';
import type { StorageData } from './StorageEngine';

export type FocusEffect = 
  | { type: 'BLOCK'; domain: string; reason: string }
  | { type: 'NOTIFY'; message: string };

class FocusTracker {
  private activeDomain: string | null = null;
  private lastTickTime: number = Date.now();
  private warnedThresholds: Set<string> = new Set(); // To avoid duplicate notifications

  /**
   * Deep Interface: The background script just feeds events into the tracker.
   */
  async handleTick(): Promise<FocusEffect[]> {
    const effects: FocusEffect[] = [];
    const now = Date.now();
    const deltaSeconds = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    // 1. Midnight reset check
    const didReset = await storageEngine.resetIfNewDay();
    if (didReset) {
      this.warnedThresholds.clear();
      return effects;
    }

    if (!this.activeDomain) return effects;

    const deltaMinutes = deltaSeconds / 60;

    // 2. State snapshot before update for threshold detection
    const stateBefore = await storageEngine.getFullState();
    
    // 3. Record activity in storage
    const { shouldBlock, reason } = await storageEngine.recordActivity(this.activeDomain, deltaMinutes);

    // 4. Decision logic for blocking
    if (shouldBlock && reason) {
      effects.push({ type: 'BLOCK', domain: this.activeDomain, reason });
    }

    // 5. Decision logic for warnings (threshold detection)
    const stateAfter = await storageEngine.getFullState();
    const warnings = this.checkWarningThresholds(this.activeDomain, stateBefore, stateAfter);
    effects.push(...warnings);

    return effects;
  }

  setActiveDomain(domain: string | null) {
    if (this.activeDomain !== domain) {
      this.activeDomain = domain;
      this.lastTickTime = Date.now(); // Reset tick anchor on domain change
    }
  }

  private checkWarningThresholds(domain: string, before: StorageData, after: StorageData): FocusEffect[] {
    const effects: FocusEffect[] = [];
    const siteBefore = before.sites.find(s => s.domain === domain);
    const siteAfter = after.sites.find(s => s.domain === domain);

    if (!siteBefore || !siteAfter) return effects;

    const thresholds = [
      { mins: 5, label: '5 minutes left today' },
      { mins: 1, label: '1 minute left today' }
    ];

    // Daily Limit Warnings
    if (siteAfter.limitMinutes > 0) {
      for (const t of thresholds) {
        const remainingBefore = siteBefore.limitMinutes - siteBefore.timeSpentToday;
        const remainingAfter = siteAfter.limitMinutes - siteAfter.timeSpentToday;
        const key = `${domain}-daily-${t.mins}`;

        if (remainingBefore > t.mins && remainingAfter <= t.mins && !this.warnedThresholds.has(key)) {
          effects.push({ type: 'NOTIFY', message: `${t.label} for ${domain}` });
          this.warnedThresholds.add(key);
        }
      }
    }

    // Session Limit Warnings
    if (siteAfter.sessionLimitMinutes > 0) {
        const t = 2; // 2 minute session warning
        const remainingBefore = siteAfter.sessionLimitMinutes - siteBefore.sessionTimeSpent;
        const remainingAfter = siteAfter.sessionLimitMinutes - siteAfter.sessionTimeSpent;
        const key = `${domain}-session-${t}`;

        if (remainingBefore > t && remainingAfter <= t && !this.warnedThresholds.has(key)) {
            effects.push({ type: 'NOTIFY', message: `Session ending in ${t} minutes for ${domain}` });
            this.warnedThresholds.add(key);
        }
    }

    return effects;
  }
}

export const focusTracker = new FocusTracker();
