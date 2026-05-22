import { useState } from 'react'
import { Shield, BarChart3, Globe, LayoutGrid, Settings } from 'lucide-react'
import { useStorageState } from '../../hooks/useStorageState'
import { storageEngine } from '../../lib/StorageEngine'
import { TabNav } from '../../components/TabNav'
import { StatsView } from './StatsView'
import { BlockListView } from './BlockListView'
import { GroupsView } from './GroupsView'
import { SettingsView } from './SettingsView'

type DashboardTab = 'screentime' | 'sites' | 'groups' | 'settings'

const TABS = [
  { id: 'screentime', label: 'Stats', icon: BarChart3 },
  { id: 'sites', label: 'Block List', icon: Globe },
  { id: 'groups', label: 'Groups', icon: LayoutGrid },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

export function DashboardRoot() {
  const { sites, groups, screenTime, snapshots } = useStorageState()
  const [activeTab, setActiveTab] = useState<DashboardTab>('screentime')

  const quickAdd = async (domain: string) => {
    await storageEngine.addSite(domain, 30, 10)
    setActiveTab('sites')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto p-10">
        <header className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-600 p-4 rounded-3xl shadow-2xl shadow-indigo-900/40 transform -rotate-3">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-slate-500 tracking-tight">
                Mindful Tabz
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1 px-1">Control Center</p>
            </div>
          </div>
          <TabNav
            tabs={TABS}
            activeTab={activeTab}
            onChange={id => setActiveTab(id as DashboardTab)}
            variant="dashboard"
          />
        </header>

        <main className="min-h-[600px]">
          {activeTab === 'screentime' && (
            <StatsView sites={sites} screenTime={screenTime} onQuickAdd={quickAdd} />
          )}
          {activeTab === 'sites' && <BlockListView sites={sites} />}
          {activeTab === 'groups' && <GroupsView sites={sites} groups={groups} />}
          {activeTab === 'settings' && <SettingsView snapshots={snapshots} />}
        </main>
      </div>
    </div>
  )
}
