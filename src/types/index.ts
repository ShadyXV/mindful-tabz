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

export interface AnalyticsSnapshot {
  id: string;
  timestamp: number;
  jsHeapMB: number;
  dbUsageKB: number;
}

export interface HistoryRecord {
  date: string;       // "YYYY-MM-DD"
  hour: number;       // 0 to 23
  domain: string;
  timeSpent: number;  // in minutes
}

export interface BlockEvent {
  date: string;       // "YYYY-MM-DD"
  hour: number;       // 0 to 23
  domain: string;
  reason: string;
  count: number;
}

export interface StorageData {
  sites: Site[];
  groups: Group[];
  screenTime: ScreenTimeEntry[];
  analyticsSnapshots: AnalyticsSnapshot[];
  lastResetDate: string;
  history: HistoryRecord[];
  blockEvents: BlockEvent[];
}

export type StorageChangeCallback = (data: StorageData) => void;

export type FocusEffect =
  | { type: 'BLOCK'; domain: string; reason: string }
  | { type: 'NOTIFY'; message: string };
