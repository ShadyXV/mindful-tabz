import { useState } from 'react'
import { Shield, BarChart3, Globe, LayoutGrid } from 'lucide-react'
import { useStorageState } from '../../hooks/useStorageState'
import { storageEngine } from '../../lib/StorageEngine'
import { TabNav } from '../../components/TabNav'
import { ScreenTimeView } from './ScreenTimeView'
import { SitesView } from './SitesView'
import { GroupsView } from './GroupsView'

type PopupTab = 'screentime' | 'sites' | 'groups'

const TABS = [
  { id: 'screentime', label: 'Time', icon: BarChart3 },
  { id: 'sites', label: 'Blocked', icon: Globe },
  { id: 'groups', label: 'Groups', icon: LayoutGrid },
] as const

export function PopupRoot() {
  const { sites, groups, screenTime, blockingEnabled } = useStorageState()
  const [activeTab, setActiveTab] = useState<PopupTab>('screentime')

  const quickAdd = async (domain: string) => {
    await storageEngine.addSite(domain, 30, 10)
    setActiveTab('sites')
  }

  return (
    <div className="w-[620px] min-w-[620px] min-h-screen bg-slate-950 text-slate-200 font-sans p-6">
      <div className="w-full">
        <header className="flex flex-col items-start gap-4 mb-6">
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <div className="bg-indigo-600 p-2 rounded-lg shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 whitespace-nowrap">
              Mindful Tabz
            </h1>
          </div>
          <TabNav
            tabs={TABS}
            activeTab={activeTab}
            onChange={id => setActiveTab(id as PopupTab)}
            variant="popup"
          />
        </header>

        {activeTab === 'screentime' && (
          <ScreenTimeView sites={sites} screenTime={screenTime} onQuickAdd={quickAdd} />
        )}
        {activeTab === 'sites' && <SitesView sites={sites} blockingEnabled={blockingEnabled} />}
        {activeTab === 'groups' && <GroupsView sites={sites} groups={groups} />}
      </div>
    </div>
  )
}
