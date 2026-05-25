import { useState } from 'react'
import { formatTime } from '../../utils/time'
import type { Site, HistoryRecord, ScreenTimeEntry } from '../../types'

interface ChartProps {
  sites: Site[]
  history: HistoryRecord[]
}

interface DonutChartProps {
  sites: Site[]
  screenTime: ScreenTimeEntry[]
}

function getLocalDateString(d: Date = new Date()): string {
  const offset = d.getTimezoneOffset()
  const localDate = new Date(d.getTime() - (offset * 60 * 1000))
  return localDate.toISOString().split('T')[0]
}

const PALETTE = [
  '#6366F1', // indigo
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#8B5CF6', // violet
  '#3B82F6', // blue
  '#F43F5E', // rose
]

// -------------------------------------------------------------
// 1. DonutChart Component (Screen Time Distribution)
// -------------------------------------------------------------
export function DonutChart({ sites, screenTime }: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Map today's screentime per domain directly from screenTime (the absolute real-time source of truth)
  const chartData = screenTime
    .map(entry => ({
      domain: entry.domain,
      time: entry.timeSpentToday,
      isMonitored: !!sites.find(s => s.domain === entry.domain),
    }))
    .filter(item => item.time > 0)
    .sort((a, b) => b.time - a.time)

  const totalTime = chartData.reduce((sum, item) => sum + item.time, 0)

  // Donut calculations
  const radius = 60
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius

  if (totalTime === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50 h-96">
        <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">No activity recorded today</p>
      </div>
    )
  }

  const activeItem = hoveredIndex !== null ? chartData[hoveredIndex] : null

  return (
    <div className="bg-slate-900/40 p-8 md:p-10 rounded-[2.5rem] border border-slate-800/50 flex flex-col md:flex-row items-center gap-10 hover:border-indigo-500/20 transition-all duration-300">
      {/* SVG Donut */}
      <div className="relative w-64 h-64 flex items-center justify-center flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          {chartData.map((item, index) => {
            const percent = item.time / totalTime
            const strokeLength = percent * circumference
            const previousPercent = chartData.slice(0, index).reduce((sum, d) => sum + (d.time / totalTime), 0)
            const strokeOffset = circumference - (percent * circumference) - (previousPercent * circumference)

            const color = PALETTE[index % PALETTE.length]
            const isHovered = hoveredIndex === index

            return (
              <circle
                key={item.domain}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  filter: isHovered ? `drop-shadow(0 0 8px ${color}80)` : 'none',
                }}
              />
            )
          })}
        </svg>

        {/* Center Text (Absolute Overlay) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
          {activeItem ? (
            <>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate max-w-[140px] mb-1">
                {activeItem.domain}
              </p>
              <h4 className="text-3xl font-black text-white tracking-tighter">
                {formatTime(activeItem.time)}
              </h4>
              <p className="text-xs text-indigo-400 font-bold font-mono mt-1">
                {Math.round((activeItem.time / totalTime) * 100)}%
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1">Total Active</p>
              <h4 className="text-4xl font-black text-white tracking-tighter">
                {formatTime(totalTime)}
              </h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                {chartData.length} domains
              </p>
            </>
          )}
        </div>
      </div>

      {/* Legend List */}
      <div className="flex-1 w-full space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {chartData.map((item, index) => {
          const color = PALETTE[index % PALETTE.length]
          const isHovered = hoveredIndex === index

          return (
            <div
              key={item.domain}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isHovered
                  ? 'bg-slate-900 border-indigo-500/30'
                  : 'bg-slate-950/40 border-transparent hover:bg-slate-900/60'
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-bold text-sm text-slate-300 truncate tracking-tight">
                  {item.domain}
                </span>
                {item.isMonitored && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md flex-shrink-0">
                    Tracked
                  </span>
                )}
              </div>
              <div className="text-right flex-shrink-0 pl-3">
                <span className="font-mono text-sm font-bold text-white">
                  {formatTime(item.time)}
                </span>
                <span className="block text-[10px] text-slate-500 font-bold font-mono">
                  {Math.round((item.time / totalTime) * 100)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// 2. HourlyBarChart Component (24-Hour Activity Tracker)
// -------------------------------------------------------------
export function HourlyBarChart({ history }: ChartProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)
  const todayStr = getLocalDateString()

  // Filter history for today
  const todayHistory = history.filter(h => h.date === todayStr)

  // Aggregate timeSpent by hour (0 to 23)
  const hourMap = Array(24).fill(0)
  todayHistory.forEach(h => {
    if (h.hour >= 0 && h.hour < 24) {
      hourMap[h.hour] += h.timeSpent
    }
  })

  const maxHourTime = Math.max(...hourMap, 5) // at least 5 mins scale

  const formatHourLabel = (h: number): string => {
    if (h === 0) return '12A'
    if (h === 12) return '12P'
    return h > 12 ? `${h - 12}P` : `${h}A`
  }

  const getActiveTooltipText = () => {
    if (hoveredHour === null) return null
    const val = hourMap[hoveredHour]
    const nextHour = (hoveredHour + 1) % 24
    const formatHourRange = (hr: number) => {
      const suffix = hr >= 12 ? 'PM' : 'AM'
      const displayHr = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr
      return `${displayHr} ${suffix}`
    }
    return {
      range: `${formatHourRange(hoveredHour)} - ${formatHourRange(nextHour)}`,
      value: formatTime(val),
    }
  }

  const tooltip = getActiveTooltipText()

  return (
    <div className="bg-slate-900/40 p-8 md:p-10 rounded-[2.5rem] border border-slate-800/50 hover:border-indigo-500/20 transition-all duration-300 relative group">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-xl font-black text-white tracking-tight">24-Hour Breakdown</h4>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">Screen time density by hour</p>
        </div>

        {/* Hover Floating Tooltip */}
        <div className={`transition-all duration-200 ${tooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          {tooltip && (
            <div className="bg-slate-950 border border-indigo-500/20 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{tooltip.range}:</span>
              <span className="text-sm font-black text-indigo-400 font-mono">{tooltip.value}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid container */}
      <div className="relative pt-6">
        {/* Horizontal scale grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none h-48 border-b border-slate-800/50 pb-6">
          <div className="w-full border-t border-slate-800/30" />
          <div className="w-full border-t border-slate-800/30" />
          <div className="w-full border-t border-slate-800/30" />
        </div>

        {/* Chart columns */}
        <div className="flex items-end gap-1 md:gap-2 h-48 mb-4 px-2 relative z-10">
          {hourMap.map((time, hour) => {
            const heightPercent = (time / maxHourTime) * 100
            const isActive = hoveredHour === hour

            return (
              <div
                key={hour}
                className="flex-1 flex flex-col items-center justify-end h-full group/bar cursor-pointer"
                onMouseEnter={() => setHoveredHour(hour)}
                onMouseLeave={() => setHoveredHour(null)}
              >
                {/* Visual Bar fill */}
                <div
                  className={`w-full rounded-t-[4px] transition-all duration-300 relative ${
                    isActive
                      ? 'bg-gradient-to-t from-indigo-600 to-violet-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                      : time > 0
                      ? 'bg-indigo-500/40 hover:bg-indigo-500/80'
                      : 'bg-slate-800/20'
                  }`}
                  style={{ height: `${Math.max(4, heightPercent)}%` }}
                />
              </div>
            )
          })}
        </div>

        {/* X-Axis labels */}
        <div className="flex justify-between text-[10px] text-slate-500 font-black font-mono px-2">
          {Array(24)
            .fill(0)
            .map((_, h) => {
              // Only render labels for every 4th hour to avoid crowding
              const shouldShowLabel = h % 4 === 0
              return (
                <div key={h} className="flex-1 text-center font-bold tracking-tighter">
                  {shouldShowLabel ? formatHourLabel(h) : ''}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// 3. WeeklyTrendChart Component (7-Day Monitored vs. Other Stacked)
// -------------------------------------------------------------
export function WeeklyTrendChart({ sites, history }: ChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Generate date labels for the last 7 days
  const last7Days = Array(7)
    .fill(0)
    .map((_, idx) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - idx))
      return getLocalDateString(d)
    })

  // Map of date string -> { monitoredTime, otherTime }
  const dailyRollup: Record<string, { monitored: number; other: number }> = {}
  last7Days.forEach(date => {
    dailyRollup[date] = { monitored: 0, other: 0 }
  })

  // Populate map from history
  history.forEach(h => {
    if (dailyRollup[h.date] !== undefined) {
      const isMonitored = !!sites.find(s => s.domain === h.domain)
      if (isMonitored) {
        dailyRollup[h.date].monitored += h.timeSpent
      } else {
        dailyRollup[h.date].other += h.timeSpent
      }
    }
  })

  const rollupList = last7Days.map(date => {
    const data = dailyRollup[date]
    const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
    const formattedDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return {
      date,
      dayLabel,
      formattedDate,
      monitored: data.monitored,
      other: data.other,
      total: data.monitored + data.other,
    }
  })

  const maxDayTime = Math.max(...rollupList.map(d => d.total), 30) // Minimum scale 30 mins

  const activeItem = hoveredIndex !== null ? rollupList[hoveredIndex] : null

  return (
    <div className="bg-slate-900/40 p-8 md:p-10 rounded-[2.5rem] border border-slate-800/50 hover:border-indigo-500/20 transition-all duration-300 relative group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h4 className="text-xl font-black text-white tracking-tight">Weekly Trend</h4>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">Comparison: tracked vs general browsing</p>
        </div>

        {/* Legend */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-indigo-500 shadow-md shadow-indigo-500/20" />
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Tracked Sites</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500 shadow-md shadow-emerald-500/20" />
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">General Sites</span>
          </div>
        </div>
      </div>

      {/* Floating Tooltip details */}
      <div className="mb-6 h-10 flex items-center justify-start">
        {activeItem ? (
          <div className="flex items-center gap-4 bg-slate-950 px-5 py-2.5 rounded-2xl border border-slate-800 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-xs text-slate-400 font-black uppercase tracking-widest">
              {activeItem.formattedDate} ({activeItem.dayLabel})
            </span>
            <div className="w-px h-4 bg-slate-800" />
            <div className="flex gap-4 text-xs font-bold">
              <span className="text-indigo-400">
                Tracked: <strong className="font-mono">{formatTime(activeItem.monitored)}</strong>
              </span>
              <span className="text-emerald-400">
                General: <strong className="font-mono">{formatTime(activeItem.other)}</strong>
              </span>
              <span className="text-slate-200">
                Total: <strong className="font-mono">{formatTime(activeItem.total)}</strong>
              </span>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Hover over a day column for details
          </p>
        )}
      </div>

      {/* Grid container */}
      <div className="relative pt-4">
        {/* Horizontal scale grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none h-48 border-b border-slate-800/50 pb-6">
          <div className="w-full border-t border-slate-800/30" />
          <div className="w-full border-t border-slate-800/30" />
          <div className="w-full border-t border-slate-800/30" />
        </div>

        {/* Weekly Trend bars */}
        <div className="flex items-end gap-4 md:gap-8 h-48 mb-4 px-4 relative z-10">
          {rollupList.map((dayData, idx) => {
            const totalPct = (dayData.total / maxDayTime) * 100
            const monitoredPct = dayData.total > 0 ? (dayData.monitored / dayData.total) * 100 : 0
            const otherPct = dayData.total > 0 ? (dayData.other / dayData.total) * 100 : 0
            const isHovered = hoveredIndex === idx

            return (
              <div
                key={dayData.date}
                className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group/bar"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Stacked Pillar visual container */}
                <div
                  className="w-full flex flex-col justify-end overflow-hidden rounded-t-xl transition-all duration-300"
                  style={{
                    height: `${Math.max(4, totalPct)}%`,
                    filter: isHovered ? 'brightness(1.15) drop-shadow(0 0 10px rgba(99,102,241,0.25))' : 'none',
                  }}
                >
                  {/* Tracked section (Top segment) */}
                  {dayData.monitored > 0 && (
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 relative transition-all"
                      style={{ height: `${monitoredPct}%` }}
                    />
                  )}

                  {/* General section (Bottom segment) */}
                  {dayData.other > 0 && (
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-500 relative transition-all"
                      style={{ height: `${otherPct}%` }}
                    />
                  )}
                  
                  {/* Empty fallback bar color if zero */}
                  {dayData.total === 0 && (
                    <div className="w-full h-full bg-slate-800/10" />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* X-Axis labels */}
        <div className="flex justify-between text-[11px] text-slate-500 font-black font-mono px-4">
          {rollupList.map((dayData, idx) => (
            <div
              key={dayData.date}
              className={`flex-1 text-center font-bold uppercase transition-colors duration-200 ${
                hoveredIndex === idx ? 'text-indigo-400' : 'text-slate-500'
              }`}
            >
              {dayData.dayLabel}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
