import { useMemo, useState } from 'react'
import { BarChart3, Calendar, Clock3, List, PieChart, ShieldCheck } from 'lucide-react'
import { formatTime } from '../../utils/time'
import type { BlockEvent, HistoryRecord, ScreenTimeEntry, Site } from '../../types'
import {
  DailyBars,
  DailyList,
  DistributionChart,
  HourlyBarChart,
  WeeklyTrendChart,
  type DomainTimeDatum,
} from './StatsVisuals'

interface StatsViewProps {
  sites: Site[]
  screenTime: ScreenTimeEntry[]
  history: HistoryRecord[]
  blockEvents: BlockEvent[]
  onQuickAdd: (domain: string) => Promise<void>
}

type SubTab = 'today' | 'distribution' | 'hourly' | 'weekly'
type DistributionRange = 'today' | 'seven'

const SUB_TABS = [
  { id: 'today', label: 'Today', icon: List },
  { id: 'distribution', label: 'Distribution', icon: PieChart },
  { id: 'hourly', label: '24 hours', icon: Clock3 },
  { id: 'weekly', label: '7 days', icon: Calendar },
] as const

function getLocalDateString(d: Date = new Date()): string {
  const offset = d.getTimezoneOffset()
  const localDate = new Date(d.getTime() - (offset * 60 * 1000))
  return localDate.toISOString().split('T')[0]
}

function getLast7Days(): string[] {
  return Array(7)
    .fill(0)
    .map((_, idx) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - idx))
      return getLocalDateString(d)
    })
}

function sortDomainData(data: DomainTimeDatum[]): DomainTimeDatum[] {
  return data.filter(item => item.time > 0).sort((a, b) => b.time - a.time)
}

function buildTodayData(
  screenTime: ScreenTimeEntry[],
  trackedDomains: Set<string>,
  includeUntracked: boolean
): DomainTimeDatum[] {
  return sortDomainData(
    screenTime
      .filter(entry => includeUntracked || trackedDomains.has(entry.domain))
      .map(entry => ({
        domain: entry.domain,
        time: entry.timeSpentToday,
        isTracked: trackedDomains.has(entry.domain),
      }))
  )
}

function buildSevenDayData(
  history: HistoryRecord[],
  trackedDomains: Set<string>,
  includeUntracked: boolean
): DomainTimeDatum[] {
  const days = new Set(getLast7Days())
  const totals = new Map<string, number>()

  history.forEach(record => {
    if (!days.has(record.date)) return
    if (!includeUntracked && !trackedDomains.has(record.domain)) return
    totals.set(record.domain, (totals.get(record.domain) || 0) + record.timeSpent)
  })

  return sortDomainData(
    Array.from(totals.entries()).map(([domain, time]) => ({
      domain,
      time,
      isTracked: trackedDomains.has(domain),
    }))
  )
}

export function StatsView({ sites, screenTime, history, blockEvents, onQuickAdd }: StatsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('today')
  const [includeUntracked, setIncludeUntracked] = useState(false)
  const [distributionRange, setDistributionRange] = useState<DistributionRange>('today')

  const trackedDomains = useMemo(() => new Set(sites.map(site => site.domain)), [sites])
  const todayStr = getLocalDateString()
  const todayData = useMemo(
    () => buildTodayData(screenTime, trackedDomains, includeUntracked),
    [screenTime, trackedDomains, includeUntracked]
  )
  const sevenDayData = useMemo(
    () => buildSevenDayData(history, trackedDomains, includeUntracked),
    [history, trackedDomains, includeUntracked]
  )

  const trackedTimeToday = screenTime
    .filter(entry => trackedDomains.has(entry.domain))
    .reduce((sum, entry) => sum + entry.timeSpentToday, 0)
  const untrackedTimeToday = screenTime
    .filter(entry => !trackedDomains.has(entry.domain))
    .reduce((sum, entry) => sum + entry.timeSpentToday, 0)
  const blocksToday = blockEvents
    .filter(event => event.date === todayStr && trackedDomains.has(event.domain))
    .reduce((sum, event) => sum + event.count, 0)
  const sitesWithLimits = sites.filter(site => site.limitMinutes > 0 || site.sessionLimitMinutes > 0).length
  const distributionData = distributionRange === 'today' ? todayData : sevenDayData

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs mb-3">Stats</p>
          <h2 className="text-4xl font-black text-white tracking-tight">Tracked-site activity</h2>
          <p className="text-slate-500 font-semibold mt-2 max-w-2xl">
            See where your limited sites are taking time, and how often Mindful Tabz stepped in.
          </p>
        </div>
        <label className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeUntracked}
            onChange={event => setIncludeUntracked(event.target.checked)}
            className="w-4 h-4 accent-indigo-500"
          />
          <span className="text-sm font-black text-slate-300">Include untracked sites</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-950/30">
          <div className="flex items-center justify-between gap-4 mb-8">
            <p className="text-indigo-100 font-black uppercase tracking-[0.2em] text-xs">Time today</p>
            <BarChart3 className="w-8 h-8 text-indigo-100/70" />
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-indigo-100/70 font-black uppercase tracking-widest text-[10px] mb-1">Tracked sites</p>
              <h3 className="text-5xl font-black text-white tracking-tighter">{formatTime(trackedTimeToday)}</h3>
            </div>
            <div className="pt-4 border-t border-indigo-400/20 flex items-end justify-between gap-4">
              <div>
                <p className="text-indigo-100/70 font-black uppercase tracking-widest text-[10px] mb-1">Untracked sites</p>
                <p className="text-2xl font-black text-indigo-50 tracking-tight">{formatTime(untrackedTimeToday)}</p>
              </div>
              <p className="text-right text-[10px] font-bold uppercase tracking-wider text-indigo-100/60 max-w-28">
                Card always shows both
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-8">
            <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">Blocks today</p>
            <ShieldCheck className="w-8 h-8 text-red-400/80" />
          </div>
          <h3 className="text-5xl font-black text-white tracking-tighter">{blocksToday}</h3>
          <p className="text-slate-500 font-semibold mt-4 text-sm">
            Limit hits redirected today
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-8">
            <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">Sites with limits</p>
            <List className="w-8 h-8 text-indigo-400/80" />
          </div>
          <h3 className="text-5xl font-black text-white tracking-tighter">{sitesWithLimits}</h3>
          <p className="text-slate-500 font-semibold mt-4 text-sm">
            Active site rules
          </p>
        </div>
      </div>

      <div className="flex bg-slate-900/40 p-2 rounded-2xl border border-slate-800/40 max-w-2xl mx-auto overflow-x-auto">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as SubTab)}
            className={`flex-1 min-w-28 py-3 px-3 rounded-xl transition-colors flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-wider ${
              activeSubTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {activeSubTab === 'today' && (
          <>
            <DailyBars data={todayData} includeUntracked={includeUntracked} onQuickAdd={onQuickAdd} />
            <DailyList data={todayData} includeUntracked={includeUntracked} onQuickAdd={onQuickAdd} />
          </>
        )}

        {activeSubTab === 'distribution' && (
          <DistributionChart
            data={distributionData}
            range={distributionRange}
            onRangeChange={setDistributionRange}
            includeUntracked={includeUntracked}
            onQuickAdd={onQuickAdd}
          />
        )}

        {activeSubTab === 'hourly' && (
          <HourlyBarChart history={history} trackedDomains={trackedDomains} includeUntracked={includeUntracked} />
        )}

        {activeSubTab === 'weekly' && (
          <WeeklyTrendChart
            history={history}
            blockEvents={blockEvents}
            trackedDomains={trackedDomains}
            includeUntracked={includeUntracked}
          />
        )}
      </div>
    </div>
  )
}
