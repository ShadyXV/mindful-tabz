import { ArrowRight, CheckCircle2, Clock3, Globe, Plus } from 'lucide-react'
import browser from '../../browser/api'
import { ProgressBar } from '../../components/ProgressBar'
import { useSites } from '../../hooks/useSites'
import { getMatchingSite } from '../../lib/domainPolicy'
import { isDailyLimitReached } from '../../lib/limitPolicy'
import { formatTime } from '../../utils/time'
import type { Site, ScreenTimeEntry } from '../../types'

interface ScreenTimeViewProps {
  sites: Site[]
  screenTime: ScreenTimeEntry[]
  activeDomain: string | null
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
  const pieData = data.reduce<{
    offset: number
    segments: { entry: DomainTime; color: string; length: number; offset: number }[]
  }>(
    (acc, entry, index) => {
      const length = (entry.time / total) * circumference
      return {
        offset: acc.offset + length,
        segments: [
          ...acc.segments,
          {
            entry,
            color: PIE_COLORS[index % PIE_COLORS.length],
            length,
            offset: acc.offset,
          },
        ],
      }
    },
    { offset: 0, segments: [] }
  ).segments

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
            {pieData.map(segment => (
              <circle
                key={segment.entry.domain}
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segment.length} ${circumference}`}
                strokeDashoffset={-segment.offset}
              />
            ))}
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

async function checkActiveBlock() {
  try {
    await browser.runtime.sendMessage({ type: 'CHECK_ACTIVE_BLOCK' })
  } catch {
    // Background may be asleep in development; the next tick will still enforce.
  }
}

function CurrentSiteLimitCard({
  site,
  onToggleBlocking,
}: {
  site: Site
  onToggleBlocking: (domain: string, enabled: boolean) => Promise<void>
}) {
  const dailyLimitReached = isDailyLimitReached(site)

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 mb-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="bg-slate-800 p-3 rounded-xl shrink-0">
            <Globe className="w-7 h-7 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current site</p>
            <h3 className="font-bold text-2xl text-white truncate">{site.domain}</h3>
          </div>
        </div>

        <label className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer select-none">
          <span className={`text-[10px] font-black uppercase tracking-wider ${site.blockingEnabled ? 'text-indigo-400' : 'text-slate-500'}`}>
            {site.blockingEnabled ? 'Block' : 'Paused'}
          </span>
          <input
            type="checkbox"
            checked={site.blockingEnabled}
            onChange={event => onToggleBlocking(site.domain, event.target.checked)}
            className="sr-only"
          />
          <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${site.blockingEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}>
            <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${site.blockingEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </span>
        </label>
      </div>

      {dailyLimitReached && (
        <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-red-300">Daily limit reached</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
          <div className="flex justify-between text-xs gap-3">
            <span className="text-slate-400 font-medium">Daily Limit</span>
            <span className="text-indigo-400 font-bold whitespace-nowrap">
              {formatTime(site.timeSpentToday)} / {site.limitMinutes}m
            </span>
          </div>
          <ProgressBar value={site.timeSpentToday} max={site.limitMinutes} color="indigo" size="sm" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs gap-3">
            <span className="text-slate-400 font-medium">Session</span>
            <span className={`font-bold whitespace-nowrap ${dailyLimitReached ? 'text-slate-500' : 'text-emerald-400'}`}>
              {dailyLimitReached ? 'Unavailable' : `${formatTime(site.sessionTimeSpent)} / ${site.sessionLimitMinutes}m`}
            </span>
          </div>
          <ProgressBar
            value={dailyLimitReached ? 0 : site.sessionTimeSpent}
            max={site.sessionLimitMinutes}
            color="emerald"
            size="sm"
          />
        </div>
      </div>
    </section>
  )
}

export function ScreenTimeView({ sites, screenTime, activeDomain, onQuickAdd }: ScreenTimeViewProps) {
  const { setSiteBlockingEnabled } = useSites()
  const domainTimes = buildDomainTimes(screenTime, sites)
  const trackedTimes = domainTimes.filter(entry => entry.isTracked)
  const totalTime = domainTimes.reduce((sum, entry) => sum + entry.time, 0)
  const trackedTime = trackedTimes.reduce((sum, entry) => sum + entry.time, 0)
  const untrackedTime = totalTime - trackedTime
  const currentSite = activeDomain ? getMatchingSite(sites, activeDomain) : null

  const toggleCurrentSiteBlocking = async (domain: string, enabled: boolean) => {
    await setSiteBlockingEnabled(domain, enabled)
    if (enabled) await checkActiveBlock()
  }

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

      {currentSite && (
        <CurrentSiteLimitCard site={currentSite} onToggleBlocking={toggleCurrentSiteBlocking} />
      )}

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
