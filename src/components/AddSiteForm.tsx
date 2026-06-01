import React, { useState, useEffect } from 'react'
import { Plus, Globe, Clock, ListOrdered } from 'lucide-react'
import { domainNormalizer } from '../lib/DomainNormalizer'
import browser from '../browser/api'

interface AddSiteFormProps {
  existingDomains: string[]
  onAdd: (domain: string, limit: number, sessionLimit: number) => Promise<void>
  variant?: 'popup' | 'dashboard'
}

type SessionMode = 'duration' | 'count'

export function AddSiteForm({ existingDomains, onAdd, variant = 'popup' }: AddSiteFormProps) {
  const [newSite, setNewSite] = useState('')
  const [newSiteLimit, setNewSiteLimit] = useState('30')
  const [newSessionInput, setNewSessionInput] = useState('10')
  const [sessionMode, setSessionMode] = useState<SessionMode>('duration')

  useEffect(() => {
    async function prefillActiveTab() {
      try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
        if (tab && tab.url) {
          const domain = domainNormalizer.normalize(tab.url)
          if (domain && !existingDomains.includes(domain)) {
            setNewSite(domain)
          }
        }
      } catch (err) {
        console.error('Failed to get active tab:', err)
      }
    }
    prefillActiveTab()
  }, [existingDomains])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const domain = domainNormalizer.normalize(newSite)
    if (!domain) return
    if (existingDomains.includes(domain)) return

    const dailyLimit = parseInt(newSiteLimit)
    let finalSessionLimit = parseInt(newSessionInput)

    if (sessionMode === 'count') {
      const numSessions = parseInt(newSessionInput)
      if (numSessions > 0) {
         finalSessionLimit = Math.max(1, Math.floor(dailyLimit / numSessions))
      }
    }

    await onAdd(domain, dailyLimit, finalSessionLimit)
    setNewSite('')
  }

  const parsedDaily = parseInt(newSiteLimit) || 0;
  const parsedSessionInput = parseInt(newSessionInput) || 0;
  
  let helperText = '';
  if (parsedDaily > 0 && parsedSessionInput > 0) {
    if (sessionMode === 'duration') {
      const numSessions = Math.max(1, Math.floor(parsedDaily / parsedSessionInput));
      helperText = `${numSessions} session${numSessions > 1 ? 's' : ''} of ${parsedSessionInput} mins`;
    } else {
      const minsPerSession = Math.max(1, Math.floor(parsedDaily / parsedSessionInput));
      helperText = `${parsedSessionInput} session${parsedSessionInput > 1 ? 's' : ''} of ${minsPerSession} mins`;
    }
  }

  if (variant === 'dashboard') {
    return (
      <section className="bg-slate-900 p-8 sm:p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-4 text-indigo-400 uppercase tracking-tight">
          <div className="bg-indigo-600/20 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
            <Plus className="w-6 h-6" />
          </div>
          Protect New Domain
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(18rem,2fr)_minmax(10rem,0.85fr)_minmax(12rem,1fr)_minmax(10rem,0.9fr)] lg:items-start"
        >
          <div className="relative">
            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-500" />
            <input
              type="text"
              value={newSite}
              onChange={e => setNewSite(e.target.value)}
              placeholder="e.g. twitter.com"
              className="w-full h-20 bg-slate-950 border-2 border-slate-800 rounded-3xl pl-16 pr-6 text-xl font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-700"
            />
          </div>
          <div className="relative">
            <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-500" />
            <input
              type="number"
              value={newSiteLimit}
              onChange={e => setNewSiteLimit(e.target.value)}
              placeholder="Daily"
              className="w-full h-20 bg-slate-950 border-2 border-slate-800 rounded-3xl pl-16 pr-16 text-xl font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">
              DAILY
            </span>
          </div>
          <div className="relative group flex flex-col gap-2">
            <div className="relative w-full">
              {sessionMode === 'duration' ? (
                 <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-slate-900 hover:bg-indigo-600/20 text-indigo-500 rounded-xl transition-all border border-slate-800 hover:border-indigo-500/50 cursor-pointer shadow-sm" onClick={() => setSessionMode('count')} title="Switch to Number of Sessions">
                   <Clock className="w-6 h-6" />
                 </button>
              ) : (
                 <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-slate-900 hover:bg-indigo-600/20 text-indigo-500 rounded-xl transition-all border border-slate-800 hover:border-indigo-500/50 cursor-pointer shadow-sm" onClick={() => setSessionMode('duration')} title="Switch to Session Duration">
                   <ListOrdered className="w-6 h-6" />
                 </button>
              )}
              <input
                type="number"
                value={newSessionInput}
                onChange={e => setNewSessionInput(e.target.value)}
                placeholder={sessionMode === 'duration' ? "Mins" : "Sessions"}
                className="w-full h-20 bg-slate-950 border-2 border-slate-800 rounded-3xl pl-20 pr-16 text-xl font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
               <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400 uppercase tracking-widest pointer-events-none">
                {sessionMode === 'duration' ? 'MINS' : 'COUNT'}
              </span>
            </div>
            {helperText && (
              <span className="text-sm font-semibold text-slate-400 ml-4 leading-none">
                {helperText}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="h-20 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xl transition-all shadow-2xl shadow-indigo-900/40 transform hover:-translate-y-1 active:translate-y-0"
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
        <div className="relative flex flex-col gap-1.5">
          <div className="relative w-full">
            {sessionMode === 'duration' ? (
               <button type="button" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 hover:bg-slate-800 text-indigo-500 rounded-lg transition-colors cursor-pointer" onClick={() => setSessionMode('count')} title="Switch to Number of Sessions">
                 <Clock className="w-5 h-5" />
               </button>
            ) : (
               <button type="button" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 hover:bg-slate-800 text-indigo-500 rounded-lg transition-colors cursor-pointer" onClick={() => setSessionMode('duration')} title="Switch to Session Duration">
                 <ListOrdered className="w-5 h-5" />
               </button>
            )}
            <input
              type="number"
              value={newSessionInput}
              onChange={e => setNewSessionInput(e.target.value)}
              placeholder={sessionMode === 'duration' ? "Session Mins" : "Sessions"}
              title={sessionMode === 'duration' ? "Session Limit (mins)" : "Number of Sessions"}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          {helperText && (
            <span className="text-xs font-semibold text-slate-400 ml-2">
              {helperText}
            </span>
          )}
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
