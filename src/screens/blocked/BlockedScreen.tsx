import React from 'react'
import { storageEngine } from '../../lib/StorageEngine'
import { formatTime } from '../../utils/time'
import type { ScreenTimeEntry } from '../../types'

export function BlockedScreen() {
  const [site] = React.useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('site') || 'this website'
  })
  const [reason] = React.useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('reason') || 'daily'
  })
  const [stats, setStats] = React.useState<ScreenTimeEntry[]>([])

  React.useEffect(() => {
    storageEngine.getFullState().then(data => {
      setStats(data.screenTime.sort((a, b) => b.timeSpentToday - a.timeSpentToday))
    })
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 font-sans">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="mb-4">
          <p className="italic text-slate-500 text-lg">
            "Discipline is choosing between what you want now and what you want most."
          </p>
        </div>

        <div className="bg-red-500/10 p-8 rounded-full inline-block border border-red-500/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
            {reason === 'session' ? 'Session Over' : "Time's Up!"}
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            You've reached your {reason === 'session' ? 'session' : 'daily'} limit for <br />
            <span className="text-red-400 font-bold text-xl">{site}</span>.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
          <p className="text-slate-500 text-sm">
            {reason === 'session'
              ? "You've used up your continuous session time. Switch to a different domain or take a short break to reset your session timer."
              : 'This site is blocked until midnight. Go do something productive or take a well-deserved rest!'}
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 text-left">
            Today's Screen Time
          </h2>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {stats.length > 0 ? (
              stats.map(entry => (
                <div key={entry.domain} className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 truncate max-w-[200px]">{entry.domain}</span>
                  <span className="text-slate-500 font-mono">{formatTime(entry.timeSpentToday)}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-600 text-xs text-left italic">No stats recorded yet today.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.close()}
            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-lg transition-all shadow-xl shadow-red-900/20 active:scale-95"
          >
            Close Tab
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full py-3 text-slate-500 hover:text-slate-300 font-bold transition-colors"
          >
            Go Back
          </button>
        </div>

        <div className="pt-4 flex items-center justify-center gap-2 text-slate-600">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest">Mindful Tabz limit reached</span>
        </div>
      </div>
    </div>
  )
}
