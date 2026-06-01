import { useState } from 'react'
import { CheckCircle2, Globe, Plus } from 'lucide-react'
import { formatTime } from '../../utils/time'
import type { BlockEvent, HistoryRecord } from '../../types'

export interface DomainTimeDatum {
  domain: string
  time: number
  isTracked: boolean
}

type DistributionRange = 'today' | 'seven'

interface DailyBarsProps {
  data: DomainTimeDatum[]
  includeUntracked: boolean
  onQuickAdd: (domain: string) => Promise<void>
}

interface DistributionChartProps {
  data: DomainTimeDatum[]
  range: DistributionRange
  onRangeChange: (range: DistributionRange) => void
  includeUntracked: boolean
  onQuickAdd: (domain: string) => Promise<void>
}

interface HourlyBarChartProps {
  history: HistoryRecord[]
  trackedDomains: Set<string>
  includeUntracked: boolean
}

interface WeeklyTrendChartProps {
  history: HistoryRecord[]
  blockEvents: BlockEvent[]
  trackedDomains: Set<string>
  includeUntracked: boolean
}

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

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12A'
  if (hour === 12) return '12P'
  return hour > 12 ? `${hour - 12}P` : `${hour}A`
}

function formatHourRange(hour: number): string {
  const nextHour = (hour + 1) % 24
  const formatHour = (value: number) => {
    const suffix = value >= 12 ? 'PM' : 'AM'
    const display = value === 0 ? 12 : value > 12 ? value - 12 : value
    return `${display} ${suffix}`
  }
  return `${formatHour(hour)} - ${formatHour(nextHour)}`
}

function getNiceTimeMax(maxValue: number, minimum: number): number {
  const value = Math.max(maxValue, minimum)
  if (value <= 10) return Math.ceil(value / 5) * 5
  if (value <= 30) return Math.ceil(value / 10) * 10
  if (value <= 60) return Math.ceil(value / 15) * 15
  if (value <= 180) return Math.ceil(value / 30) * 30
  return Math.ceil(value / 60) * 60
}

function TimeAxis({ maxValue }: { maxValue: number }) {
  const labels = [maxValue, maxValue / 2, 0]

  return (
    <div className="h-52 pb-6 flex flex-col justify-between text-right">
      {labels.map(value => (
        <span key={value} className="text-[10px] text-slate-500 font-black font-mono leading-none">
          {value === 0 ? '0' : formatTime(value)}
        </span>
      ))}
    </div>
  )
}

function formatDayLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'short' })
}

function isVisibleDomain(domain: string, trackedDomains: Set<string>, includeUntracked: boolean): boolean {
  return includeUntracked || trackedDomains.has(domain)
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 bg-slate-900/20 rounded-[2rem] border border-dashed border-slate-800">
      <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-xs">{message}</p>
    </div>
  )
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

export function DailyBars({ data, includeUntracked, onQuickAdd }: DailyBarsProps) {
  const total = data.reduce((sum, item) => sum + item.time, 0)

  if (total === 0) {
    return <EmptyState message={includeUntracked ? 'No activity recorded today' : 'No tracked-site activity today'} />
  }

  return (
    <section className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800/50 space-y-5">
      <div>
        <h3 className="text-xl font-black text-white tracking-tight">Today</h3>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">
          Ranked by time spent
        </p>
      </div>

      <div className="space-y-4">
        {data.map(item => {
          const percent = total > 0 ? (item.time / total) * 100 : 0
          return (
            <div key={item.domain} className="grid gap-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Globe className={`w-5 h-5 shrink-0 ${item.isTracked ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="font-black text-slate-100 truncate">{item.domain}</span>
                  {includeUntracked && item.isTracked && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                      Tracked
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-sm font-black text-white">{formatTime(item.time)}</span>
                  <span className="block text-[10px] text-slate-500 font-bold font-mono">{Math.round(percent)}%</span>
                </div>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.isTracked ? 'bg-indigo-500' : 'bg-slate-500'}`}
                  style={{ width: `${Math.max(2, percent)}%` }}
                />
              </div>
              {includeUntracked && !item.isTracked && (
                <button
                  onClick={() => onQuickAdd(item.domain)}
                  className="justify-self-start text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 hover:bg-indigo-600 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add limit
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function DistributionChart({
  data,
  range,
  onRangeChange,
  includeUntracked,
  onQuickAdd,
}: DistributionChartProps) {
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null)
  const total = data.reduce((sum, item) => sum + item.time, 0)
  const radius = 58
  const strokeWidth = 22
  const circumference = 2 * Math.PI * radius
  let runningOffset = 0
  const pieData = data.map((item, index) => {
    const length = total > 0 ? (item.time / total) * circumference : 0
    const segment = {
      item,
      color: PIE_COLORS[index % PIE_COLORS.length],
      length,
      offset: runningOffset,
    }
    runningOffset += length
    return segment
  })
  const activeItem = hoveredDomain ? data.find(item => item.domain === hoveredDomain) : null

  return (
    <section className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800/50 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">Distribution</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">
            Share of {includeUntracked ? 'shown browsing' : 'tracked-site time'}
          </p>
        </div>
        <select
          value={range}
          onChange={e => onRangeChange(e.target.value as DistributionRange)}
          className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          <option value="today">Today</option>
          <option value="seven">7 days</option>
        </select>
      </div>

      {total === 0 ? (
        <EmptyState message={range === 'today' ? 'No activity today' : 'No activity in the last 7 days'} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-8 items-center">
          <div className="relative w-64 h-64 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160" aria-label="Time distribution pie chart">
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth={strokeWidth}
              />
              {pieData.map(({ item, color, length, offset }) => {
                const isActive = hoveredDomain === item.domain
                return (
                  <circle
                    key={item.domain}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={isActive ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={`${length} ${circumference}`}
                    strokeDashoffset={-offset}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredDomain(item.domain)}
                    onMouseLeave={() => setHoveredDomain(null)}
                    style={{ filter: isActive ? `drop-shadow(0 0 10px ${color}70)` : undefined }}
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 pointer-events-none">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 truncate max-w-36">
                {activeItem ? activeItem.domain : range === 'today' ? 'Today' : '7 days'}
              </p>
              <p className="text-3xl font-black text-white tracking-tighter">
                {formatTime(activeItem ? activeItem.time : total)}
              </p>
              {activeItem && (
                <p className="text-xs text-indigo-400 font-bold font-mono mt-1">
                  {Math.round((activeItem.time / total) * 100)}%
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {data.map((item, index) => {
            const percent = total > 0 ? (item.time / total) * 100 : 0
            const isActive = hoveredDomain === item.domain
            return (
              <div
                key={item.domain}
                className={`bg-slate-950/40 border rounded-2xl p-4 transition-colors ${
                  isActive ? 'border-indigo-500/40' : 'border-slate-800/40'
                }`}
                onMouseEnter={() => setHoveredDomain(item.domain)}
                onMouseLeave={() => setHoveredDomain(null)}
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-sm font-black text-slate-200 truncate">{item.domain}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-mono font-black text-white">{formatTime(item.time)}</span>
                      <span className="ml-3 text-xs font-mono font-bold text-slate-500">{Math.round(percent)}%</span>
                    </div>
                    {item.isTracked ? (
                      <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-400/5 border border-emerald-400/20 px-3 py-2 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Limit set
                      </span>
                    ) : (
                      <button
                        onClick={() => onQuickAdd(item.domain)}
                        className="text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800 hover:bg-indigo-600 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add limit
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.isTracked ? 'bg-indigo-500' : 'bg-slate-500'}`}
                    style={{ width: `${Math.max(2, percent)}%` }}
                  />
                </div>
              </div>
            )
          })}
          </div>
        </div>
      )}
    </section>
  )
}

export function HourlyBarChart({ history, trackedDomains, includeUntracked }: HourlyBarChartProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)
  const todayStr = getLocalDateString()
  const hourMap = Array.from({ length: 24 }, () => 0)

  history.forEach(record => {
    if (
      record.date === todayStr &&
      record.hour >= 0 &&
      record.hour < 24 &&
      isVisibleDomain(record.domain, trackedDomains, includeUntracked)
    ) {
      hourMap[record.hour] += record.timeSpent
    }
  })

  const maxHourTime = getNiceTimeMax(Math.max(...hourMap), 5)
  const total = hourMap.reduce((sum, value) => sum + value, 0)
  const tooltip = hoveredHour === null ? null : {
    range: formatHourRange(hoveredHour),
    value: formatTime(hourMap[hoveredHour]),
  }

  return (
    <section className="bg-slate-900/40 p-8 md:p-10 rounded-[2.5rem] border border-slate-800/50 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">24 hours</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">
            Activity by hour today
          </p>
        </div>
        <div className="h-10 flex items-center">
          {tooltip ? (
            <div className="bg-slate-950 border border-indigo-500/20 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{tooltip.range}</span>
              <span className="text-sm font-black text-indigo-400 font-mono">{tooltip.value}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-bold">{formatTime(total)} total today</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[3.5rem_1fr] gap-3 pt-4">
        <TimeAxis maxValue={maxHourTime} />
        <div className="relative">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none h-52 border-b border-slate-800/50 pb-6">
            <div className="w-full border-t border-slate-800/30" />
            <div className="w-full border-t border-slate-800/30" />
            <div className="w-full border-t border-slate-800/30" />
          </div>
          <div className="flex items-end gap-1.5 h-52 mb-4 px-2 relative z-10">
            {hourMap.map((time, hour) => {
              const heightPercent = (time / maxHourTime) * 100
              const isActive = hoveredHour === hour
              return (
                <button
                  key={hour}
                  type="button"
                  className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded-sm"
                  onMouseEnter={() => setHoveredHour(hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                  onFocus={() => setHoveredHour(hour)}
                  onBlur={() => setHoveredHour(null)}
                  aria-label={`${formatHourRange(hour)}: ${formatTime(time)}`}
                >
                  <span
                    className={`w-full rounded-t-md transition-colors ${
                      isActive ? 'bg-indigo-400' : time > 0 ? 'bg-indigo-500/60' : 'bg-slate-800/25'
                    }`}
                    style={{ height: `${Math.max(3, heightPercent)}%` }}
                  />
                </button>
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-black font-mono px-2">
            {hourMap.map((_, hour) => (
              <div key={hour} className="flex-1 text-center font-bold tracking-tighter">
                {hour % 3 === 0 ? formatHourLabel(hour) : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function WeeklyTrendChart({ history, blockEvents, trackedDomains, includeUntracked }: WeeklyTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const days = getLast7Days()
  const rollup = days.map(date => {
    const time = history
      .filter(record => record.date === date && isVisibleDomain(record.domain, trackedDomains, includeUntracked))
      .reduce((sum, record) => sum + record.timeSpent, 0)
    const blocks = blockEvents
      .filter(event => event.date === date && isVisibleDomain(event.domain, trackedDomains, includeUntracked))
      .reduce((sum, event) => sum + event.count, 0)
    return { date, dayLabel: formatDayLabel(date), time, blocks }
  })

  const maxTime = getNiceTimeMax(Math.max(...rollup.map(day => day.time)), 30)
  const maxBlocks = Math.max(...rollup.map(day => day.blocks), 1)
  const activeItem = hoveredIndex === null ? null : rollup[hoveredIndex]

  return (
    <section className="bg-slate-900/40 p-8 md:p-10 rounded-[2.5rem] border border-slate-800/50 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">7 days</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">
            Time spent with block counts
          </p>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-indigo-500" />
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Time</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-red-500" />
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Blocks</span>
          </div>
        </div>
      </div>

      <div className="h-10 flex items-center">
        {activeItem ? (
          <div className="flex items-center gap-4 bg-slate-950 px-5 py-2.5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-black uppercase tracking-widest">{activeItem.dayLabel}</span>
            <span className="text-indigo-400 text-xs font-bold">
              Time: <strong className="font-mono">{formatTime(activeItem.time)}</strong>
            </span>
            <span className="text-red-400 text-xs font-bold">
              Blocks: <strong className="font-mono">{activeItem.blocks}</strong>
            </span>
          </div>
        ) : (
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Hover or focus a day for details
          </p>
        )}
      </div>

      <div className="grid grid-cols-[3.5rem_1fr] gap-3 pt-4">
        <TimeAxis maxValue={maxTime} />
        <div className="relative">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none h-52 border-b border-slate-800/50 pb-6">
            <div className="w-full border-t border-slate-800/30" />
            <div className="w-full border-t border-slate-800/30" />
            <div className="w-full border-t border-slate-800/30" />
          </div>
          <div className="flex items-end gap-4 md:gap-8 h-52 mb-4 px-4 relative z-10">
            {rollup.map((day, index) => {
              const timePct = (day.time / maxTime) * 100
              const blockPct = (day.blocks / maxBlocks) * 100
              const isActive = hoveredIndex === index
              return (
                <button
                  key={day.date}
                  type="button"
                  className="flex-1 flex flex-col items-center justify-end h-full gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded-lg"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                  aria-label={`${day.dayLabel}: ${formatTime(day.time)}, ${day.blocks} blocks`}
                >
                  <span
                    className={`w-full rounded-t-xl transition-colors ${
                      isActive ? 'bg-indigo-400' : day.time > 0 ? 'bg-indigo-500/70' : 'bg-slate-800/20'
                    }`}
                    style={{ height: `${Math.max(4, timePct)}%` }}
                  />
                  <span className="h-8 w-full flex items-end justify-center">
                    <span
                      className={`w-3 rounded-full transition-colors ${day.blocks > 0 ? 'bg-red-500' : 'bg-slate-800/30'}`}
                      style={{ height: `${Math.max(4, blockPct * 0.32)}px` }}
                    />
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-black font-mono px-4">
            {rollup.map((day, index) => (
              <div
                key={day.date}
                className={`flex-1 text-center font-bold uppercase transition-colors ${
                  hoveredIndex === index ? 'text-indigo-400' : 'text-slate-500'
                }`}
              >
                {day.dayLabel}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-950/40 rounded-2xl border border-slate-800/40 p-4">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">7-day time</p>
          <p className="text-2xl font-black text-white">{formatTime(rollup.reduce((sum, day) => sum + day.time, 0))}</p>
        </div>
        <div className="bg-slate-950/40 rounded-2xl border border-slate-800/40 p-4">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">7-day blocks</p>
          <p className="text-2xl font-black text-white">{rollup.reduce((sum, day) => sum + day.blocks, 0)}</p>
        </div>
      </div>
    </section>
  )
}

export function DailyList({ data, includeUntracked, onQuickAdd }: DailyBarsProps) {
  if (data.length === 0) {
    return <EmptyState message={includeUntracked ? 'No activity detected yet' : 'No tracked sites used yet'} />
  }

  return (
    <section className="space-y-4">
      <h3 className="text-xl font-black text-slate-200 px-2">Daily list</h3>
      <div className="grid grid-cols-1 gap-4">
        {data.map(entry => (
          <div
            key={entry.domain}
            className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-indigo-500/30 hover:bg-slate-900 transition-colors"
          >
            <div className="flex items-center gap-5 min-w-0">
              <div className={`p-4 rounded-2xl ${entry.isTracked ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                <Globe className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-xl text-white mb-1 tracking-tight truncate">{entry.domain}</h4>
                <p className="text-indigo-400 font-mono text-base font-bold">{formatTime(entry.time)}</p>
              </div>
            </div>
            {entry.isTracked ? (
              <div className="flex items-center gap-3 text-emerald-400 font-black bg-emerald-400/5 px-5 py-3 rounded-2xl border border-emerald-400/20 text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                Tracked
              </div>
            ) : (
              <button
                onClick={() => onQuickAdd(entry.domain)}
                className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white px-6 py-3 rounded-2xl font-black transition-colors flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
              >
                <Plus className="w-4 h-4" />
                Add limit
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
