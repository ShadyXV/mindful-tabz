import { useState } from 'react'
import { Globe, Edit2, Trash2, Save, X } from 'lucide-react'
import { ProgressBar } from './ProgressBar'
import { formatTime } from '../utils/time'
import type { Site } from '../types'

interface SiteCardProps {
  site: Site
  onUpdate: (domain: string, limit: number, sessionLimit: number) => Promise<void>
  onRemove: (domain: string) => Promise<void>
  variant?: 'popup' | 'dashboard'
}

export function SiteCard({ site, onUpdate, onRemove, variant = 'popup' }: SiteCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editLimit, setEditLimit] = useState(site.limitMinutes.toString())
  const [editSessionLimit, setEditSessionLimit] = useState(site.sessionLimitMinutes.toString())

  const startEdit = () => {
    setEditLimit(site.limitMinutes.toString())
    setEditSessionLimit(site.sessionLimitMinutes.toString())
    setIsEditing(true)
  }

  const handleSave = async () => {
    await onUpdate(site.domain, parseInt(editLimit), parseInt(editSessionLimit))
    setIsEditing(false)
  }

  if (variant === 'dashboard') {
    return (
      <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 group hover:border-indigo-500/40 transition-all duration-500 shadow-xl">
        {isEditing ? (
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 font-black text-4xl text-white tracking-tighter">{site.domain}</div>
            <div className="flex gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Daily Limit</label>
                <input
                  type="number"
                  value={editLimit}
                  onChange={e => setEditLimit(e.target.value)}
                  className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 w-32 text-xl font-black text-indigo-400 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Session</label>
                <input
                  type="number"
                  value={editSessionLimit}
                  onChange={e => setEditSessionLimit(e.target.value)}
                  className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 w-32 text-xl font-black text-emerald-400 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="p-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/20"
              >
                <Save className="w-7 h-7" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-5 bg-slate-800 text-slate-400 rounded-2xl hover:bg-slate-700 transition-all"
              >
                <X className="w-7 h-7" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="flex items-center gap-8">
              <div className="bg-slate-800 p-6 rounded-[2rem] shadow-inner">
                <Globe className="w-10 h-10 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-black text-4xl text-white mb-2 tracking-tighter">{site.domain}</h3>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Active Protection</span>
                </div>
              </div>
            </div>

            <div className="flex flex-1 max-w-2xl gap-12">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Daily Progress</span>
                  <span className="text-indigo-400 font-black text-sm">
                    {formatTime(site.timeSpentToday)} / {site.limitMinutes}m
                  </span>
                </div>
                <ProgressBar value={site.timeSpentToday} max={site.limitMinutes} color="indigo" size="lg" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Session Health</span>
                  <span className="text-emerald-400 font-black text-sm">
                    {formatTime(site.sessionTimeSpent)} / {site.sessionLimitMinutes}m
                  </span>
                </div>
                <ProgressBar value={site.sessionTimeSpent} max={site.sessionLimitMinutes} color="emerald" size="lg" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={startEdit}
                className="p-5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl transition-all group-hover:shadow-md"
              >
                <Edit2 className="w-6 h-6" />
              </button>
              <button
                onClick={() => onRemove(site.domain)}
                className="p-5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 group hover:border-indigo-500/30 transition-all">
      {isEditing ? (
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 font-bold text-xl text-indigo-400">{site.domain}</div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Daily:</span>
              <input
                type="number"
                value={editLimit}
                onChange={e => setEditLimit(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg p-2 w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Session:</span>
              <input
                type="number"
                value={editSessionLimit}
                onChange={e => setEditSessionLimit(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg p-2 w-20"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="p-2 bg-green-600 rounded-lg hover:bg-green-500 transition-colors">
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-slate-800 p-3 rounded-xl">
              <Globe className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-2xl">{site.domain}</h3>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Watchlist Active</span>
            </div>
          </div>

          <div className="flex flex-1 max-w-md gap-8">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Daily Limit</span>
                <span className="text-indigo-400 font-bold">
                  {formatTime(site.timeSpentToday)} / {site.limitMinutes}m
                </span>
              </div>
              <ProgressBar value={site.timeSpentToday} max={site.limitMinutes} color="indigo" size="sm" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Session</span>
                <span className="text-emerald-400 font-bold">
                  {formatTime(site.sessionTimeSpent)} / {site.sessionLimitMinutes}m
                </span>
              </div>
              <ProgressBar value={site.sessionTimeSpent} max={site.sessionLimitMinutes} color="emerald" size="sm" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startEdit}
              className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => onRemove(site.domain)}
              className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
