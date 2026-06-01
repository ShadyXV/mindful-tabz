import { ArrowRight, CheckCircle2, Clock3, Globe, Plus } from 'lucide-react'
import { formatTime } from '../../utils/time'
import type { Site, ScreenTimeEntry } from '../../types'

interface ScreenTimeViewProps {
  sites: Site[]
  screenTime: ScreenTimeEntry[]
  onQuickAdd: (domain: string) => Promise<void>
}

interface DomainTime {
  domain: string
  time: number
  isTracked: boolean
}

const PIE_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#8b5cf6',
  '#f43f5e',
  '#3b82f6',
]

function buildDomainTimes(screenTime: ScreenTimeEntry[], sites: Site[]): DomainTime[] {
  const trackedDomains = new Set(sites.map(site => site.domain))

  return screenTime
    .map(entry => ({
      domain: entry.domain,
      time: entry.timeSpentToday,
      isTracked: trackedDomains.has(entry.domain),
    }))
    .filter(entry => entry.time > 0)
    .sort((a, b) => b.time - a.time)
}

function TrackedPie({ data }: { data: DomainTime[] }) {
  const total = data.reduce((sum, entry) => sum + entry.time, 0)
  const radius = 54
  const strokeWidth = 20
  const circumference = 2 * Math.PI * radius
  let offset = 0

  if (total === 0) {
    return (
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3">Tracked sites</h3>
        <div className="py-6 text-center border border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-600 font-bold text-xs uppercase tracking-wider">No tracked-site time yet</p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Tracked sites</h3>
          <p className="text-slate-500 text-xs font-semibold mt-1">Share of limited-site time</p>
        </div>
        <p className="text-indigo-400 font-black font-mono">{formatTime(total)}</p>
      </div>

      <div className="grid grid-cols-[7rem_1fr] gap-4 items-center">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 150 150" aria-label="Tracked site time pie chart">
            <circle cx="75" cy="75" r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
            {data.map((entry, index) => {
              const length = (entry.time / total) * circumference
              const currentOffset = offset
              offset += length

              return (
                <circle
                  key={entry.domain}
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="none"
                  stroke={PIE_COLORS[index % PIE_COLORS.length]}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${length} ${circumference}`}
                  strokeDashoffset={-currentOffset}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <span className="text-xl font-black text-white tracking-tighter">{formatTime(total)}</span>
          </div>
        </div>

        <div className="space-y-2 min-w-0">
          {data.slice(0, 5).map((entry, index) => {
            const percent = Math.round((entry.time / total) * 100)
            return (
              <div key={entry.domain} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                />
                <span className="text-xs font-bold text-slate-300 truncate">{entry.domain}</span>
                <span className="text-xs font-mono font-bold text-slate-500">{percent}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function ScreenTimeView({ sites, screenTime, onQuickAdd }: ScreenTimeViewProps) {
  const domainTimes = buildDomainTimes(screenTime, sites)
  const trackedTimes = domainTimes.filter(entry => entry.isTracked)
  const totalTime = domainTimes.reduce((sum, entry) => sum + entry.time, 0)
  const trackedTime = trackedTimes.reduce((sum, entry) => sum + entry.time, 0)
  const untrackedTime = totalTime - trackedTime

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-indigo-600 border border-indigo-500/30 p-4 rounded-2xl shadow-xl shadow-indigo-950/20">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-indigo-100/80 font-black uppercase tracking-[0.2em] text-xs mb-2">Today</p>
            <h2 className="text-3xl font-black text-white tracking-tighter">{formatTime(totalTime)}</h2>
          </div>
          <div className="bg-indigo-400/20 p-2.5 rounded-2xl">
            <Clock3 className="w-6 h-6 text-indigo-50" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-950/25 rounded-2xl p-3">
            <p className="text-indigo-100/70 text-[9px] font-black uppercase tracking-widest mb-1">Tracked</p>
            <p className="text-xl font-black text-white">{formatTime(trackedTime)}</p>
          </div>
          <div className="bg-indigo-950/25 rounded-2xl p-3">
            <p className="text-indigo-100/70 text-[9px] font-black uppercase tracking-widest mb-1">Untracked</p>
            <p className="text-xl font-black text-white">{formatTime(untrackedTime)}</p>
          </div>
        </div>
      </section>

      <TrackedPie data={trackedTimes} />

      <section className="grid grid-cols-1 gap-3">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Websites visited</h3>
        {domainTimes.length > 0 ? (
          domainTimes.map(entry => (
            <div
              key={entry.domain}
              className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`p-2.5 rounded-xl ${entry.isTracked ? 'bg-indigo-600/20' : 'bg-slate-800'}`}>
                  <Globe className={`w-5 h-5 ${entry.isTracked ? 'text-indigo-400' : 'text-slate-400'}`} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-base text-white truncate">{entry.domain}</h4>
                  <p className="text-indigo-400 font-mono text-sm">{formatTime(entry.time)} spent</p>
                </div>
              </div>
              {entry.isTracked ? (
                <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Limit set
                </div>
              ) : (
                <button
                  onClick={() => onQuickAdd(entry.domain)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                >
                  <Plus className="w-4 h-4" />
                  Add limit
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
            <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-xs">No websites recorded today</p>
          </div>
        )}
      </section>
    </div>
  )
}
