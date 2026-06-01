import { useState, useEffect } from 'react'
import { storageEngine } from '../lib/StorageEngine'
import type { Site, Group, ScreenTimeEntry, AnalyticsSnapshot, HistoryRecord, BlockEvent } from '../types'

export interface StorageState {
  sites: Site[]
  groups: Group[]
  screenTime: ScreenTimeEntry[]
  snapshots: AnalyticsSnapshot[]
  history: HistoryRecord[]
  blockEvents: BlockEvent[]
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
      }))
    })

    return unsubscribe
  }, [])

  return state
}
