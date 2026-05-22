import { Clock, CheckCircle2, Plus, Trash2, BarChart3 } from 'lucide-react'
import { formatTime } from '../utils/time'
import type { Site, Group } from '../types'

interface GroupCardProps {
  group: Group
  allSites: Site[]
  onRemove: (id: string) => Promise<void>
  onToggleSite: (groupId: string, domain: string) => Promise<void>
  variant?: 'popup' | 'dashboard'
}

export function GroupCard({ group, allSites, onRemove, onToggleSite, variant = 'popup' }: GroupCardProps) {
  if (variant === 'dashboard') {
    return (
      <div className="bg-slate-900 rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl group/card">
        <div className="p-10 border-b border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-900/50">
          <div>
            <h3 className="text-4xl font-black text-white mb-3 tracking-tighter">{group.name}</h3>
            <div className="flex items-center gap-8 mt-2">
              <span className="text-slate-500 text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                <Clock className="w-5 h-5" />
                Quota: {group.limitMinutes}m
              </span>
              <span className="text-indigo-400 text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                <BarChart3 className="w-5 h-5" />
                Consumed: {formatTime(group.timeSpentToday)}
              </span>
            </div>
          </div>
          <button
            onClick={() => onRemove(group.id)}
            className="p-5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
          >
            <Trash2 className="w-7 h-7" />
          </button>
        </div>
        <div className="p-10 bg-slate-950/30">
          <h4 className="text-[10px] font-black text-slate-600 mb-6 uppercase tracking-[0.3em] ml-2">
            Assign Domains to cluster
          </h4>
          <div className="flex flex-wrap gap-4">
            {allSites.length > 0 ? (
              allSites.map(site => {
                const isSelected = group.sites.includes(site.domain)
                return (
                  <button
                    key={site.domain}
                    onClick={() => onToggleSite(group.id, site.domain)}
                    className={`px-8 py-4 rounded-2xl text-sm font-black transition-all flex items-center gap-3 border-2 shadow-lg ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-900/20'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {site.domain}
                  </button>
                )
              })
            ) : (
              <p className="text-slate-700 font-bold italic text-sm ml-2">
                Add some sites to your block list first to organize them into groups.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">{group.name}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-slate-400 text-sm flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Limit: {group.limitMinutes}m
            </span>
            <span className="text-indigo-400 text-sm font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Spent: {formatTime(group.timeSpentToday)}
            </span>
          </div>
        </div>
        <button
          onClick={() => onRemove(group.id)}
          className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 bg-slate-950/50">
        <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">
          Select Sites to Include in {group.name}
        </h4>
        <div className="flex flex-wrap gap-2">
          {allSites.map(site => (
            <button
              key={site.domain}
              onClick={() => onToggleSite(group.id, site.domain)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 border ${
                group.sites.includes(site.domain)
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {group.sites.includes(site.domain) ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {site.domain}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
