import { useState } from 'react'
import { Shield, ExternalLink, BarChart3, Globe, LayoutGrid } from 'lucide-react'
import { useStorageState } from '../../hooks/useStorageState'
import { storageEngine } from '../../lib/StorageEngine'
import { TabNav } from '../../components/TabNav'
import { ScreenTimeView } from './ScreenTimeView'
import { SitesView } from './SitesView'
import { GroupsView } from './GroupsView'
import browser from '../../browser/api'

type PopupTab = 'screentime' | 'sites' | 'groups'

const TABS = [
  { id: 'screentime', label: 'Screen Time', icon: BarChart3 },
  { id: 'sites', label: 'Manage Sites', icon: Globe },
  { id: 'groups', label: 'Groups', icon: LayoutGrid },
] as const

export function PopupRoot() {
  const { sites, groups, screenTime } = useStorageState()
  const [activeTab, setActiveTab] = useState<PopupTab>('sites')

  const openDashboard = () => {
    if (browser.runtime.openOptionsPage) {
      browser.runtime.openOptionsPage()
    } else {
      window.open(browser.runtime.getURL('dashboard.html'))
    }
  }

  const quickAdd = async (domain: string) => {
    await storageEngine.addSite(domain, 30, 10)
    setActiveTab('sites')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={openDashboard}>
            <div className="bg-indigo-600 p-2 rounded-lg group-hover:bg-indigo-500 transition-colors">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 group-hover:from-white group-hover:to-white transition-all">
              Mindful Tabz
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={openDashboard}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-all flex items-center gap-2 text-sm font-bold"
              title="Open Full Dashboard"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <TabNav
              tabs={TABS}
              activeTab={activeTab}
              onChange={id => setActiveTab(id as PopupTab)}
              variant="popup"
            />
          </div>
        </header>

        {activeTab === 'screentime' && (
          <ScreenTimeView sites={sites} screenTime={screenTime} onQuickAdd={quickAdd} />
        )}
        {activeTab === 'sites' && <SitesView sites={sites} />}
        {activeTab === 'groups' && <GroupsView sites={sites} groups={groups} />}
      </div>
    </div>
  )
}
