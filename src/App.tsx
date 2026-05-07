import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Clock, Shield, Globe, LayoutGrid, CheckCircle2, Edit2, X, Save, BarChart3, ArrowRight } from 'lucide-react'
import { storageEngine } from './lib/StorageEngine'
import { domainNormalizer } from './lib/DomainNormalizer'
import type { Site, Group, ScreenTimeEntry } from './lib/StorageEngine'

function App() {
  const [sites, setSites] = useState<Site[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [screenTime, setScreenTime] = useState<ScreenTimeEntry[]>([])
  const [activeTab, setActiveTab] = useState<'sites' | 'groups' | 'screentime'>('sites')
  
  // Form States
  const [newSite, setNewSite] = useState('')
  const [newSiteLimit, setNewSiteLimit] = useState('30')
  const [newSessionLimit, setNewSessionLimit] = useState('10')
  const [editingDomain, setEditingDomain] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ limit: '30', sessionLimit: '10' })

  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupLimit, setNewGroupLimit] = useState('60')

  useEffect(() => {
    // 1. Initial Load
    storageEngine.getFullState().then(state => {
      setSites(state.sites)
      setGroups(state.groups)
      setScreenTime(state.screenTime)
    })

    // 2. Leverage: Subscription hides chrome.storage details
    const unsubscribe = storageEngine.subscribe(state => {
      setSites(state.sites)
      setGroups(state.groups)
      setScreenTime(state.screenTime)
    })
    
    return unsubscribe
  }, [])

  const addSite = async (e: React.FormEvent) => {
    e.preventDefault()
    const domain = domainNormalizer.normalize(newSite)
    if (!domain) return
    if (sites.find(s => s.domain === domain)) return
    
    await storageEngine.addSite(domain, parseInt(newSiteLimit), parseInt(newSessionLimit))
    setNewSite('')
  }

  const quickAdd = async (domain: string) => {
    await storageEngine.addSite(domain, 30, 10)
    setActiveTab('sites')
  }

  const removeSite = async (domain: string) => {
    await storageEngine.removeSite(domain)
  }

  const startEditing = (site: Site) => {
    setEditingDomain(site.domain)
    setEditForm({ 
      limit: site.limitMinutes.toString(), 
      sessionLimit: site.sessionLimitMinutes.toString() 
    })
  }

  const saveEdit = async () => {
    if (!editingDomain) return
    await storageEngine.updateSite(editingDomain, parseInt(editForm.limit), parseInt(editForm.sessionLimit))
    setEditingDomain(null)
  }

  const addGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName) return
    await storageEngine.createGroup(newGroupName, parseInt(newGroupLimit))
    setNewGroupName('')
  }

  const removeGroup = async (id: string) => {
    await storageEngine.removeGroup(id)
  }

  const toggleSiteInGroup = async (groupId: string, domain: string) => {
    await storageEngine.toggleSiteInGroup(groupId, domain)
  }

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes)
    const secs = Math.floor((minutes - mins) * 60)
    return `${mins}m ${secs}s`
  }

  const sortedScreenTime = [...screenTime].sort((a, b) => b.timeSpentToday - a.timeSpentToday)
  const totalScreenTime = screenTime.reduce((acc, curr) => acc + curr.timeSpentToday, 0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Block-Ext
            </h1>
          </div>
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setActiveTab('screentime')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === 'screentime' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <BarChart3 className="w-4 h-4" />
              Screen Time
            </button>
            <button 
              onClick={() => setActiveTab('sites')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === 'sites' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Globe className="w-4 h-4" />
              Manage Sites
            </button>
            <button 
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === 'groups' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              Groups
            </button>
          </div>
        </header>

        {activeTab === 'screentime' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-3xl flex items-center justify-between">
                <div>
                   <h2 className="text-4xl font-black text-white">Total Screen Time</h2>
                   <p className="text-indigo-400 font-bold mt-1 uppercase tracking-widest text-sm">Active Today</p>
                </div>
                <div className="text-5xl font-black text-indigo-400">
                  {formatTime(totalScreenTime)}
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-2">Websites Visited Today</h3>
                {sortedScreenTime.map(entry => (
                  <div key={entry.domain} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-800 p-3 rounded-xl">
                        <Globe className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{entry.domain}</h4>
                        <p className="text-indigo-400 font-mono text-sm">{formatTime(entry.timeSpentToday)} spent</p>
                      </div>
                    </div>
                    
                    {sites.find(s => s.domain === entry.domain) ? (
                      <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                        Monitored
                      </div>
                    ) : (
                      <button 
                        onClick={() => quickAdd(entry.domain)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20"
                      >
                        Quick Add to Block List
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
             </div>
           </div>
        )}

        {activeTab === 'sites' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-400">
                <Plus className="w-5 h-5" />
                Add Site to Block List
              </h2>
              <form onSubmit={addSite} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    value={newSite}
                    onChange={(e) => setNewSite(e.target.value)}
                    placeholder="youtube.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="number" 
                    value={newSiteLimit}
                    onChange={(e) => setNewSiteLimit(e.target.value)}
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
                    onChange={(e) => setNewSessionLimit(e.target.value)}
                    placeholder="Session Limit"
                    title="Session Limit (mins)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-colors md:col-span-4">
                  Add Site to Watchlist
                </button>
              </form>
            </section>

            <section className="grid grid-cols-1 gap-4">
              {sites.map(site => (
                <div key={site.domain} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 group hover:border-indigo-500/30 transition-all">
                  {editingDomain === site.domain ? (
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex-1 font-bold text-xl text-indigo-400">{site.domain}</div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Daily:</span>
                          <input 
                            type="number" 
                            value={editForm.limit}
                            onChange={(e) => setEditForm({...editForm, limit: e.target.value})}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-2 w-20"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Session:</span>
                          <input 
                            type="number" 
                            value={editForm.sessionLimit}
                            onChange={(e) => setEditForm({...editForm, sessionLimit: e.target.value})}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-2 w-20"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="p-2 bg-green-600 rounded-lg hover:bg-green-500 transition-colors">
                          <Save className="w-5 h-5" />
                        </button>
                        <button onClick={() => setEditingDomain(null)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
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
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Watchlist Active</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-1 max-w-md gap-8">
                        <div className="flex-1 space-y-2">
                           <div className="flex justify-between text-xs">
                             <span className="text-slate-400 font-medium">Daily Limit</span>
                             <span className="text-indigo-400 font-bold">{formatTime(site.timeSpentToday)} / {site.limitMinutes}m</span>
                           </div>
                           <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-indigo-500 transition-all duration-1000" 
                               style={{ width: `${Math.min(100, (site.timeSpentToday / site.limitMinutes) * 100)}%` }}
                             />
                           </div>
                        </div>

                        <div className="flex-1 space-y-2">
                           <div className="flex justify-between text-xs">
                             <span className="text-slate-400 font-medium">Session</span>
                             <span className="text-emerald-400 font-bold">{formatTime(site.sessionTimeSpent)} / {site.sessionLimitMinutes}m</span>
                           </div>
                           <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-emerald-500 transition-all duration-1000" 
                               style={{ width: `${Math.min(100, (site.sessionTimeSpent / site.sessionLimitMinutes) * 100)}%` }}
                             />
                           </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => startEditing(site)}
                          className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => removeSite(site.domain)}
                          className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-400">
                <LayoutGrid className="w-5 h-5" />
                Create New Group
              </h2>
              <form onSubmit={addGroup} className="flex gap-4">
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group Name (e.g. Social Media)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                <div className="w-40 relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="number" 
                    value={newGroupLimit}
                    onChange={(e) => setNewGroupLimit(e.target.value)}
                    placeholder="Mins"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl font-bold transition-colors">
                  Create
                </button>
              </form>
            </section>

            <div className="grid grid-cols-1 gap-6">
              {groups.map(group => (
                <div key={group.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
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
                      onClick={() => removeGroup(group.id)}
                      className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 bg-slate-950/50">
                    <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Select Sites to Include in {group.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      {sites.map(site => (
                        <button
                          key={site.domain}
                          onClick={() => toggleSiteInGroup(group.id, site.domain)}
                          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 border ${
                            group.sites.includes(site.domain)
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {group.sites.includes(site.domain) ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          {site.domain}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
