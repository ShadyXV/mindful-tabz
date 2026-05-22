import React, { useState } from 'react'
import { Plus, Globe, Clock } from 'lucide-react'
import { domainNormalizer } from '../lib/DomainNormalizer'

interface AddSiteFormProps {
  existingDomains: string[]
  onAdd: (domain: string, limit: number, sessionLimit: number) => Promise<void>
  variant?: 'popup' | 'dashboard'
}

export function AddSiteForm({ existingDomains, onAdd, variant = 'popup' }: AddSiteFormProps) {
  const [newSite, setNewSite] = useState('')
  const [newSiteLimit, setNewSiteLimit] = useState('30')
  const [newSessionLimit, setNewSessionLimit] = useState('10')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const domain = domainNormalizer.normalize(newSite)
    if (!domain) return
    if (existingDomains.includes(domain)) return
    await onAdd(domain, parseInt(newSiteLimit), parseInt(newSessionLimit))
    setNewSite('')
  }

  if (variant === 'dashboard') {
    return (
      <section className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-4 text-indigo-400 uppercase tracking-tight">
          <div className="bg-indigo-600/20 p-2 rounded-xl">
            <Plus className="w-6 h-6" />
          </div>
          Protect New Domain
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="relative md:col-span-2 lg:col-span-2">
            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-500" />
            <input
              type="text"
              value={newSite}
              onChange={e => setNewSite(e.target.value)}
              placeholder="e.g. twitter.com"
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl py-5 pl-16 pr-6 text-xl font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-700"
            />
          </div>
          <div className="relative">
            <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-500" />
            <input
              type="number"
              value={newSiteLimit}
              onChange={e => setNewSiteLimit(e.target.value)}
              placeholder="Daily"
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl py-5 pl-16 pr-6 text-xl font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">
              DAILY
            </span>
          </div>
          <div className="relative">
            <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-indigo-500" />
            <input
              type="number"
              value={newSessionLimit}
              onChange={e => setNewSessionLimit(e.target.value)}
              placeholder="Session"
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl py-5 pl-16 pr-6 text-xl font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400 uppercase tracking-widest pointer-events-none">
              SESSION
            </span>
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-3xl font-black text-xl transition-all shadow-2xl shadow-indigo-900/40 transform hover:-translate-y-1 active:translate-y-0"
          >
            ACTIVATE
          </button>
        </form>
      </section>
    )
  }

  return (
    <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-400">
        <Plus className="w-5 h-5" />
        Add Site to Block List
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={newSite}
            onChange={e => setNewSite(e.target.value)}
            placeholder="youtube.com"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="number"
            value={newSiteLimit}
            onChange={e => setNewSiteLimit(e.target.value)}
            placeholder="Daily Limit"
            title="Daily Limit (mins)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
          <input
            type="number"
            value={newSessionLimit}
            onChange={e => setNewSessionLimit(e.target.value)}
            placeholder="Session Limit"
            title="Session Limit (mins)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-colors md:col-span-4"
        >
          Add Site to Watchlist
        </button>
      </form>
    </section>
  )
}
