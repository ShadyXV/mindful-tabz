import { useState, useEffect } from 'react'
import { storageEngine } from '../lib/StorageEngine'
import type { Site, Group, ScreenTimeEntry, AnalyticsSnapshot } from '../types'

export interface StorageState {
  sites: Site[]
  groups: Group[]
  screenTime: ScreenTimeEntry[]
  snapshots: AnalyticsSnapshot[]
  isLoaded: boolean
}

export function useStorageState(): StorageState {
  const [state, setState] = useState<StorageState>({
    sites: [],
    groups: [],
    screenTime: [],
    snapshots: [],
    isLoaded: false,
  })

  useEffect(() => {
    storageEngine.getFullState().then(data => {
      setState({
        sites: data.sites,
        groups: data.groups,
        screenTime: data.screenTime,
        snapshots: data.analyticsSnapshots,
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
      }))
    })

    return unsubscribe
  }, [])

  return state
}
