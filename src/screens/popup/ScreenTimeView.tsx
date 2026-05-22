import { Globe, CheckCircle2, ArrowRight } from 'lucide-react'
import { formatTime } from '../../utils/time'
import type { Site, ScreenTimeEntry } from '../../types'

interface ScreenTimeViewProps {
  sites: Site[]
  screenTime: ScreenTimeEntry[]
  onQuickAdd: (domain: string) => Promise<void>
}

export function ScreenTimeView({ sites, screenTime, onQuickAdd }: ScreenTimeViewProps) {
  const sortedScreenTime = [...screenTime].sort((a, b) => b.timeSpentToday - a.timeSpentToday)
  const totalScreenTime = screenTime.reduce((acc, curr) => acc + curr.timeSpentToday, 0)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-3xl flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-white">Total Screen Time</h2>
          <p className="text-indigo-400 font-bold mt-1 uppercase tracking-widest text-sm">Active Today</p>
        </div>
        <div className="text-5xl font-black text-indigo-400">{formatTime(totalScreenTime)}</div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-2">Websites Visited Today</h3>
        {sortedScreenTime.map(entry => (
          <div
            key={entry.domain}
            className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-slate-800 p-3 rounded-xl">
                <Globe className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h4 className="font-bold text-lg">{entry.domain}</h4>
                <p className="text-indigo-400 font-mono text-sm">{formatTime(entry.timeSpentToday)} spent</p>
              </div>
            </div>
            {sites.find(s => s.domain === entry.domain) ? (
              <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
                Monitored
              </div>
            ) : (
              <button
                onClick={() => onQuickAdd(entry.domain)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20"
              >
                Quick Add to Block List
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
