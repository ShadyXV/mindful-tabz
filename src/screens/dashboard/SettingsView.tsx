import { Plus, Settings, Activity, Cpu, Database } from 'lucide-react'
import { storageEngine } from '../../lib/StorageEngine'
import browser from '../../browser/api'
import type { AnalyticsSnapshot } from '../../types'

interface SettingsViewProps {
  snapshots: AnalyticsSnapshot[]
}

export function SettingsView({ snapshots }: SettingsViewProps) {
  const takeSnapshot = async () => {
    try {
      const bytes = await browser.storage.local.getBytesInUse(null)

      interface MemoryInfo { usedJSHeapSize: number }
      const mem = (performance as Performance & { memory?: MemoryInfo }).memory
      const jsHeapMB = mem ? Math.round(mem.usedJSHeapSize / (1024 * 1024) * 100) / 100 : 0

      await storageEngine.saveAnalyticsSnapshot({
        timestamp: Date.now(),
        jsHeapMB,
        dbUsageKB: Math.round(bytes / 1024 * 100) / 100,
      })

      if (!mem) {
        console.warn('performance.memory is not available. JS Heap will report as 0.')
      }
    } catch (err) {
      console.error('Failed to take snapshot:', err)
    }
  }

  const deleteData = async () => {
    if (confirm('Delete all saved sites, groups, and screen time history? This cannot be undone.')) {
      await browser.storage.local.clear()
      window.location.reload()
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <section className="bg-slate-900 p-12 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Settings className="w-64 h-64" />
        </div>
        <h2 className="text-3xl font-black mb-4 text-white tracking-tight">Settings</h2>
        <p className="text-slate-500 font-bold text-lg mb-12 max-w-2xl">
          Set how Mindful Tabz tracks sites and stores your data.
        </p>

        <div className="space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-10 bg-slate-950 rounded-[2.5rem] border border-slate-800 group hover:border-red-500/20 transition-all">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Reset Data</h3>
              <p className="text-slate-500 font-medium">
                Permanently delete saved sites, groups, and screen time history.
              </p>
            </div>
            <button
              onClick={deleteData}
              className="px-10 py-5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-black rounded-2xl transition-all border border-red-500/20 uppercase tracking-widest text-xs"
            >
              Delete All Data
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-10 bg-slate-950 rounded-[2.5rem] border border-slate-800">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Help</h3>
              <p className="text-slate-500 font-medium">Mindful Tabz helps you track site time and block distractions.</p>
            </div>
            <div className="flex gap-4">
              <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black rounded-2xl transition-all uppercase tracking-widest text-xs">
                Documentation
              </button>
              <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-900/20 uppercase tracking-widest text-xs">
                Check Updates
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 p-12 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
          <div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
              <Activity className="text-indigo-400 w-8 h-8" />
              App Performance
            </h2>
            <p className="text-slate-500 font-bold">Check storage use and extension performance.</p>
          </div>
          <button
            onClick={takeSnapshot}
            className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-900/40 transform hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 uppercase tracking-widest text-xs"
          >
            <Plus className="w-4 h-4" />
            Take Snapshot
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 flex items-center gap-8 relative group">
            <div className="bg-indigo-600/10 p-5 rounded-3xl">
              <Cpu className="w-10 h-10 text-indigo-400" />
            </div>
            <div>
              <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-1">Current JS Heap</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">
                {snapshots.length > 0 ? (
                  snapshots[snapshots.length - 1].jsHeapMB > 0 ? (
                    <>
                      {snapshots[snapshots.length - 1].jsHeapMB}{' '}
                      <span className="text-xl text-slate-500 font-bold ml-1">MB</span>
                    </>
                  ) : (
                    <span className="text-slate-600 text-2xl uppercase tracking-widest">N/A</span>
                  )
                ) : (
                  '---'
                )}
              </h3>
              {snapshots.length > 0 && snapshots[snapshots.length - 1].jsHeapMB === 0 && (
                <p className="text-[9px] text-slate-700 font-bold mt-1 uppercase">Browser restricted access</p>
              )}
            </div>
          </div>
          <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-slate-800 flex items-center gap-8">
            <div className="bg-emerald-600/10 p-5 rounded-3xl">
              <Database className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-1">Database Size</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">
                {snapshots.length > 0 ? (
                  <>
                    {snapshots[snapshots.length - 1].dbUsageKB}{' '}
                    <span className="text-xl text-slate-500 font-bold ml-1">KB</span>
                  </>
                ) : (
                  '---'
                )}
              </h3>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-200 px-4">Performance History</h3>
          <div className="bg-slate-950/50 rounded-[2.5rem] border border-slate-800 p-8">
            <div className="flex items-end gap-2 h-48 mb-8 px-4 border-b border-slate-800 pb-2">
              {snapshots.map(s => {
                const maxHeap = Math.max(...snapshots.map(s => s.jsHeapMB), 1)
                const height = (s.jsHeapMB / maxHeap) * 100
                return (
                  <div
                    key={s.id}
                    className="flex-1 bg-indigo-500/40 hover:bg-indigo-500 rounded-t-sm transition-all relative group/bar"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none font-bold">
                      {s.jsHeapMB} MB
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {snapshots
                .slice()
                .reverse()
                .map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 text-xs"
                  >
                    <span className="text-slate-500 font-black">{new Date(s.timestamp).toLocaleTimeString()}</span>
                    <div className="flex gap-8">
                      <span className="text-indigo-400 font-bold">
                        <span className="text-slate-600 mr-2 uppercase tracking-widest text-[8px]">Heap:</span>
                        {s.jsHeapMB} MB
                      </span>
                      <span className="text-emerald-400 font-bold">
                        <span className="text-slate-600 mr-2 uppercase tracking-widest text-[8px]">DB:</span>
                        {s.dbUsageKB} KB
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-10 opacity-30">
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.5em]">
          Mindful Tabz v1.0.0
        </p>
      </footer>
    </div>
  )
}
