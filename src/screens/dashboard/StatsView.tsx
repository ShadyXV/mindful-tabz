import { BarChart3, Globe, CheckCircle2 } from 'lucide-react'
import { formatTime } from '../../utils/time'
import type { Site, ScreenTimeEntry } from '../../types'

interface StatsViewProps {
  sites: Site[]
  screenTime: ScreenTimeEntry[]
  onQuickAdd: (domain: string) => Promise<void>
}

export function StatsView({ sites, screenTime, onQuickAdd }: StatsViewProps) {
  const sortedScreenTime = [...screenTime].sort((a, b) => b.timeSpentToday - a.timeSpentToday)
  const totalScreenTime = screenTime.reduce((acc, curr) => acc + curr.timeSpentToday, 0)

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <BarChart3 className="w-48 h-48" />
          </div>
          <div>
            <p className="text-indigo-100 font-black uppercase tracking-[0.2em] text-sm mb-4">Daily Consumption</p>
            <h2 className="text-7xl font-black text-white tracking-tighter">{formatTime(totalScreenTime)}</h2>
          </div>
          <div className="mt-8 flex items-center gap-3 text-indigo-100/80 font-bold">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            Real-time monitoring active
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-xl flex flex-col justify-center text-center">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4">Sites Monitored</p>
          <div className="text-6xl font-black text-white mb-2">{sites.length}</div>
          <p className="text-slate-400 font-medium">Active rules in place</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-black text-slate-200 px-4">Daily Breakdown</h3>
        <div className="grid grid-cols-1 gap-4">
          {sortedScreenTime.length > 0 ? (
            sortedScreenTime.map(entry => {
              const isMonitored = sites.find(s => s.domain === entry.domain)
              return (
                <div
                  key={entry.domain}
                  className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800/50 flex items-center justify-between group hover:border-indigo-500/30 hover:bg-slate-900 transition-all duration-300"
                >
                  <div className="flex items-center gap-8">
                    <div
                      className={`p-5 rounded-2xl shadow-lg ${
                        isMonitored ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Globe className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-black text-2xl text-white mb-1 tracking-tight">{entry.domain}</h4>
                      <p className="text-indigo-400 font-mono text-lg font-bold">{formatTime(entry.timeSpentToday)}</p>
                    </div>
                  </div>
                  {isMonitored ? (
                    <div className="flex items-center gap-3 text-emerald-400 font-black bg-emerald-400/5 px-6 py-3 rounded-2xl border border-emerald-400/20">
                      <CheckCircle2 className="w-5 h-5" />
                      TRACKED
                    </div>
                  ) : (
                    <button
                      onClick={() => onQuickAdd(entry.domain)}
                      className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl hover:shadow-indigo-600/20 flex items-center gap-2 uppercase tracking-wider text-xs"
                    >
                      Add to Block List
                    </button>
                  )}
                </div>
              )
            })
          ) : (
            <div className="text-center py-20 bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
              <p className="text-slate-600 font-bold uppercase tracking-[0.2em]">No activity detected yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
