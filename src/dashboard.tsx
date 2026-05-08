import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { Plus, Trash2, Clock, Shield, Globe, LayoutGrid, CheckCircle2, Edit2, X, Save, BarChart3, Settings } from 'lucide-react'
import { storageEngine } from './lib/StorageEngine'
import { domainNormalizer } from './lib/DomainNormalizer'
import type { Site, Group, ScreenTimeEntry } from './lib/StorageEngine'

function Dashboard() {
  const [sites, setSites] = useState<Site[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [screenTime, setScreenTime] = useState<ScreenTimeEntry[]>([])
  const [activeTab, setActiveTab] = useState<'screentime' | 'sites' | 'groups' | 'settings'>('screentime')
  
  // Form States
  const [newSite, setNewSite] = useState('')
  const [newSiteLimit, setNewSiteLimit] = useState('30')
  const [newSessionLimit, setNewSessionLimit] = useState('10')
  const [editingDomain, setEditingDomain] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ limit: '30', sessionLimit: '10' })

  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupLimit, setNewGroupLimit] = useState('60')

  useEffect(() => {
    storageEngine.getFullState().then(state => {
      setSites(state.sites)
      setGroups(state.groups)
      setScreenTime(state.screenTime)
    })

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
    if (mins >= 60) {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return `${h}h ${m}m`
    }
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  const sortedScreenTime = [...screenTime].sort((a, b) => b.timeSpentToday - a.timeSpentToday)
  const totalScreenTime = screenTime.reduce((acc, curr) => acc + curr.timeSpentToday, 0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto p-10">
        <header className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-600 p-4 rounded-3xl shadow-2xl shadow-indigo-900/40 transform -rotate-3">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-slate-500 tracking-tight">
                Block-Ext
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1 px-1">Control Center</p>
            </div>
          </div>
          
          <nav className="flex bg-slate-900/50 p-2 rounded-3xl border border-slate-800/50 backdrop-blur-xl shadow-2xl">
            {[
              { id: 'screentime', icon: BarChart3, label: 'Stats' },
              { id: 'sites', icon: Globe, label: 'Block List' },
              { id: 'groups', icon: LayoutGrid, label: 'Groups' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-8 py-4 rounded-2xl transition-all flex items-center gap-3 font-black text-sm uppercase tracking-wider ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="min-h-[600px]">
          {activeTab === 'screentime' && (
             <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                       <BarChart3 className="w-48 h-48" />
                    </div>
                    <div>
                       <p className="text-indigo-100 font-black uppercase tracking-[0.2em] text-sm mb-4">Daily Consumption</p>
                       <h2 className="text-7xl font-black text-white tracking-tighter">
                         {formatTime(totalScreenTime)}
                       </h2>
                    </div>
                    <div className="mt-8 flex items-center gap-3 text-indigo-100/80 font-bold">
                       <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                       Real-time monitoring active
                    </div>
                 </div>

                 <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-xl flex flex-col justify-center text-center">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4">Sites Monitored</p>
                    <div className="text-6xl font-black text-white mb-2">{sites.length}</div>
                    <p className="text-slate-400 font-medium">Active rules in place</p>
                 </div>
               </div>

               <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-200 px-4">Daily Breakdown</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {sortedScreenTime.length > 0 ? sortedScreenTime.map(entry => {
                      const isMonitored = sites.find(s => s.domain === entry.domain);
                      return (
                        <div key={entry.domain} className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800/50 flex items-center justify-between group hover:border-indigo-500/30 hover:bg-slate-900 transition-all duration-300">
                          <div className="flex items-center gap-8">
                            <div className={`p-5 rounded-2xl shadow-lg ${isMonitored ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                              <Globe className="w-8 h-8" />
                            </div>
                            <div>
                              <h4 className="font-black text-2xl text-white mb-1 tracking-tight">{entry.domain}</h4>
                              <p className="text-indigo-400 font-mono text-lg font-bold">{formatTime(entry.timeSpentToday)}</p>
                            </div>
                          </div>
                          
                          {isMonitored ? (
                            <div className="flex items-center gap-3 text-emerald-400 font-black bg-emerald-400/5 px-6 py-3 rounded-2xl border border-emerald-400/20">
                              <CheckCircle2 className="w-5 h-5" />
                              TRACKED
                            </div>
                          ) : (
                            <button 
                              onClick={() => quickAdd(entry.domain)}
                              className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl hover:shadow-indigo-600/20 flex items-center gap-2 uppercase tracking-wider text-xs"
                            >
                              Add to Block List
                            </button>
                          )}
                        </div>
                      );
                    }) : (
                      <div className="text-center py-20 bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800">
                         <p className="text-slate-600 font-bold uppercase tracking-[0.2em]">No activity detected yet</p>
                      </div>
                    )}
                  </div>
               </div>
             </div>
          )}

          {activeTab === 'sites' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <section className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
                <h2 className="text-2xl font-black mb-8 flex items-center gap-4 text-indigo-400 uppercase tracking-tight">
                  <div className="bg-indigo-600/20 p-2 rounded-xl"><Plus className="w-6 h-6" /></div>
                  Protect New Domain
                </h2>
                <form onSubmit={addSite} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
                  <div className="relative md:col-span-2 lg:col-span-2">
                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-500" />
                    <input 
                      type="text" 
                      value={newSite}
                      onChange={(e) => setNewSite(e.target.value)}
                      placeholder="e.g. twitter.com"
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl py-5 pl-16 pr-6 text-xl font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-700"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-500" />
                    <input 
                      type="number" 
                      value={newSiteLimit}
                      onChange={(e) => setNewSiteLimit(e.target.value)}
                      placeholder="Daily"
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl py-5 pl-16 pr-6 text-xl font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest pointer-events-none">DAILY</span>
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-indigo-500" />
                    <input 
                      type="number" 
                      value={newSessionLimit}
                      onChange={(e) => setNewSessionLimit(e.target.value)}
                      placeholder="Session"
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl py-5 pl-16 pr-6 text-xl font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400 uppercase tracking-widest pointer-events-none">SESSION</span>
                  </div>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-3xl font-black text-xl transition-all shadow-2xl shadow-indigo-900/40 transform hover:-translate-y-1 active:translate-y-0">
                    ACTIVATE
                  </button>
                </form>
              </section>

              <div className="grid grid-cols-1 gap-6">
                {sites.map(site => (
                  <div key={site.domain} className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 group hover:border-indigo-500/40 transition-all duration-500 shadow-xl">
                    {editingDomain === site.domain ? (
                      <div className="flex flex-col lg:flex-row gap-8 items-center">
                        <div className="flex-1 font-black text-4xl text-white tracking-tighter">{site.domain}</div>
                        <div className="flex gap-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Daily Limit</label>
                            <input 
                              type="number" 
                              value={editForm.limit}
                              onChange={(e) => setEditForm({...editForm, limit: e.target.value})}
                              className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 w-32 text-xl font-black text-indigo-400 focus:border-indigo-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Session</label>
                            <input 
                              type="number" 
                              value={editForm.sessionLimit}
                              onChange={(e) => setEditForm({...editForm, sessionLimit: e.target.value})}
                              className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 w-32 text-xl font-black text-emerald-400 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <button onClick={saveEdit} className="p-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/20">
                            <Save className="w-7 h-7" />
                          </button>
                          <button onClick={() => setEditingDomain(null)} className="p-5 bg-slate-800 text-slate-400 rounded-2xl hover:bg-slate-700 transition-all">
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
                               <span className="text-indigo-400 font-black text-sm">{formatTime(site.timeSpentToday)} / {site.limitMinutes}m</span>
                             </div>
                             <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner">
                               <div 
                                 className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                                 style={{ width: `${Math.min(100, (site.timeSpentToday / site.limitMinutes) * 100)}%` }}
                               />
                             </div>
                          </div>

                          <div className="flex-1 space-y-4">
                             <div className="flex justify-between items-end">
                               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Session Health</span>
                               <span className="text-emerald-400 font-black text-sm">{formatTime(site.sessionTimeSpent)} / {site.sessionLimitMinutes}m</span>
                             </div>
                             <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner">
                               <div 
                                 className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                                 style={{ width: `${Math.min(100, (site.sessionTimeSpent / site.sessionLimitMinutes) * 100)}%` }}
                               />
                             </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => startEditing(site)}
                            className="p-5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl transition-all group-hover:shadow-md"
                          >
                            <Edit2 className="w-6 h-6" />
                          </button>
                          <button 
                            onClick={() => removeSite(site.domain)}
                            className="p-5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <section className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
                <h2 className="text-2xl font-black mb-8 flex items-center gap-4 text-indigo-400 uppercase tracking-tight">
                  <div className="bg-indigo-600/20 p-2 rounded-xl"><LayoutGrid className="w-6 h-6" /></div>
                  Create Resource Cluster
                </h2>
                <form onSubmit={addGroup} className="flex flex-col md:flex-row gap-8">
                  <input 
                    type="text" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Group Label (e.g. Social Media)"
                    className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-3xl py-5 px-8 text-xl font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-700"
                  />
                  <div className="w-full md:w-56 relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-500" />
                    <input 
                      type="number" 
                      value={newGroupLimit}
                      onChange={(e) => setNewGroupLimit(e.target.value)}
                      placeholder="Mins"
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl py-5 pl-16 pr-6 text-xl font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-3xl font-black text-xl transition-all shadow-2xl shadow-indigo-900/40">
                    CREATE
                  </button>
                </form>
              </section>

              <div className="grid grid-cols-1 gap-10">
                {groups.map(group => (
                  <div key={group.id} className="bg-slate-900 rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl group/card">
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
                        onClick={() => removeGroup(group.id)}
                        className="p-5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
                      >
                        <Trash2 className="w-7 h-7" />
                      </button>
                    </div>
                    <div className="p-10 bg-slate-950/30">
                      <h4 className="text-[10px] font-black text-slate-600 mb-6 uppercase tracking-[0.3em] ml-2">Assign Domains to cluster</h4>
                      <div className="flex flex-wrap gap-4">
                        {sites.length > 0 ? sites.map(site => {
                          const isSelected = group.sites.includes(site.domain);
                          return (
                            <button
                              key={site.domain}
                              onClick={() => toggleSiteInGroup(group.id, site.domain)}
                              className={`px-8 py-4 rounded-2xl text-sm font-black transition-all flex items-center gap-3 border-2 shadow-lg ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-900/20'
                                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                              }`}
                            >
                              {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                              {site.domain}
                            </button>
                          );
                        }) : (
                           <p className="text-slate-700 font-bold italic text-sm ml-2">Add some sites to your block list first to organize them into groups.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <section className="bg-slate-900 p-12 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-5">
                    <Settings className="w-64 h-64" />
                 </div>
                 <h2 className="text-3xl font-black mb-4 text-white tracking-tight">Configuration</h2>
                 <p className="text-slate-500 font-bold text-lg mb-12 max-w-2xl">Tailor Block-Ext to your specific productivity workflows and data management preferences.</p>
                 
                 <div className="space-y-8">
                   <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-10 bg-slate-950 rounded-[2.5rem] border border-slate-800 group hover:border-red-500/20 transition-all">
                     <div className="mb-6 md:mb-0">
                       <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Data Integrity</h3>
                       <p className="text-slate-500 font-medium">Permanently purge all site definitions, group clusters, and historical screen time metrics.</p>
                     </div>
                     <button 
                        onClick={() => {
                          if(confirm('DANGER: This action is irreversible. Are you sure you want to purge all application data?')) {
                            chrome.storage.local.clear(() => {
                               window.location.reload();
                            });
                          }
                        }}
                        className="px-10 py-5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white font-black rounded-2xl transition-all border border-red-500/20 uppercase tracking-widest text-xs"
                      >
                        Purge All Data
                     </button>
                   </div>

                   <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-10 bg-slate-950 rounded-[2.5rem] border border-slate-800">
                     <div className="mb-6 md:mb-0">
                       <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Support & Development</h3>
                       <p className="text-slate-500 font-medium">Block-Ext is an open-source tool built for digital well-being.</p>
                     </div>
                     <div className="flex gap-4">
                        <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black rounded-2xl transition-all uppercase tracking-widest text-xs">
                           Documentation
                        </button>
                        <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-900/20 uppercase tracking-widest text-xs">
                           Check Updates
                        </button>
                     </div>
                   </div>
                 </div>
              </section>
              
              <footer className="text-center py-10 opacity-30">
                 <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.5em]">Block-Ext Active Protection Engine v1.0.0</p>
              </footer>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>,
)
