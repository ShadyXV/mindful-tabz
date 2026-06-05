import { useState, useEffect } from 'react'
import { storageEngine } from '../lib/StorageEngine'
import type {
  Site,
  Group,
  ScreenTimeEntry,
  AnalyticsSnapshot,
  HistoryRecord,
  BlockEvent,
  BlockingPauseEvent,
} from '../types'

export interface StorageState {
  sites: Site[]
  groups: Group[]
  screenTime: ScreenTimeEntry[]
  snapshots: AnalyticsSnapshot[]
  history: HistoryRecord[]
  blockEvents: BlockEvent[]
  blockingPauseEvents: BlockingPauseEvent[]
  blockingEnabled: boolean
  sessionCooldownMinutes: number
  isLoaded: boolean
}

export function useStorageState(): StorageState {
  const [state, setState] = useState<StorageState>({
    sites: [],
    groups: [],
    screenTime: [],
    snapshots: [],
    history: [],
    blockEvents: [],
    blockingPauseEvents: [],
    blockingEnabled: true,
    sessionCooldownMinutes: 5,
    isLoaded: false,
  })

  useEffect(() => {
    storageEngine.getFullState().then(data => {
      setState({
        sites: data.sites,
        groups: data.groups,
        screenTime: data.screenTime,
        snapshots: data.analyticsSnapshots,
        history: data.history || [],
        blockEvents: data.blockEvents || [],
        blockingPauseEvents: data.blockingPauseEvents || [],
        blockingEnabled: data.blockingEnabled,
        sessionCooldownMinutes: data.sessionCooldownMinutes,
        isLoaded: true,
      })
    })

    const unsubscribe = storageEngine.subscribe(data => {
      setState(prev => ({
        ...prev,
        sites: data.sites,
        groups: data.groups,
        screenTime: data.screenTime,
        snapshots: data.analyticsSnapshots,
        history: data.history || [],
        blockEvents: data.blockEvents || [],
        blockingPauseEvents: data.blockingPauseEvents || [],
        blockingEnabled: data.blockingEnabled,
        sessionCooldownMinutes: data.sessionCooldownMinutes,
      }))
    })

    return unsubscribe
  }, [])

  return state
}
