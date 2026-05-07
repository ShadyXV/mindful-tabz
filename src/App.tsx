import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Clock, Shield, Globe, LayoutGrid, CheckCircle2 } from 'lucide-react'

interface Site {
  domain: string;
  limitMinutes: number;
  timeSpentToday: number;
}

interface Group {
  id: string;
  name: string;
  sites: string[];
  limitMinutes: number;
  timeSpentToday: number;
}

function App() {
  const [sites, setSites] = useState<Site[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [newSite, setNewSite] = useState('')
  const [newSiteLimit, setNewSiteLimit] = useState('30')
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupLimit, setNewGroupLimit] = useState('60')
  const [activeTab, setActiveTab] = useState<'sites' | 'groups'>('sites')

  useEffect(() => {
    chrome.storage.local.get(['sites', 'groups'], (result) => {
      if (result.sites) setSites(result.sites as Site[])
      if (result.groups) setGroups(result.groups as Group[])
    })

    // Listen for storage changes to update UI in real-time
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.sites && changes.sites.newValue) setSites(changes.sites.newValue as Site[])
      if (changes.groups && changes.groups.newValue) setGroups(changes.groups.newValue as Group[])
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  const saveSites = (newSites: Site[]) => {
    setSites(newSites)
    chrome.storage.local.set({ sites: newSites })
  }

  const saveGroups = (newGroups: Group[]) => {
    setGroups(newGroups)
    chrome.storage.local.set({ groups: newGroups })
  }

  const addSite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSite) return
    const domain = newSite.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
    if (sites.find(s => s.domain === domain)) return
    
    const updated = [...sites, { domain, limitMinutes: parseInt(newSiteLimit), timeSpentToday: 0 }]
    saveSites(updated)
    setNewSite('')
  }

  const removeSite = (domain: string) => {
    saveSites(sites.filter(s => s.domain !== domain))
  }

  const addGroup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName) return
    const updated = [...groups, { 
      id: crypto.randomUUID(), 
      name: newGroupName, 
      sites: [], 
      limitMinutes: parseInt(newGroupLimit), 
      timeSpentToday: 0 
    }]
    saveGroups(updated)
    setNewGroupName('')
  }

  const removeGroup = (id: string) => {
    saveGroups(groups.filter(g => g.id !== id))
  }

  const toggleSiteInGroup = (groupId: string, domain: string) => {
    const updated = groups.map(g => {
      if (g.id === groupId) {
        const sites = g.sites.includes(domain) 
          ? g.sites.filter(s => s !== domain) 
          : [...g.sites, domain]
        return { ...g, sites }
      }
      return g
    })
    saveGroups(updated)
  }

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes)
    const secs = Math.floor((minutes - mins) * 60)
    return `${mins}m ${secs}s`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
      <div className="max-w-4xl mx-auto">
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
              onClick={() => setActiveTab('sites')}
              className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'sites' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Individual Sites
            </button>
            <button 
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'groups' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Groups
            </button>
          </div>
        </header>

        {activeTab === 'sites' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Add Site to Block List
              </h2>
              <form onSubmit={addSite} className="flex gap-4">
                <div className="flex-1 relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    value={newSite}
                    onChange={(e) => setNewSite(e.target.value)}
                    placeholder="youtube.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <div className="w-32 relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="number" 
                    value={newSiteLimit}
                    onChange={(e) => setNewSiteLimit(e.target.value)}
                    placeholder="Mins"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-xl font-bold transition-colors">
                  Add Site
                </button>
              </form>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sites.map(site => (
                <div key={site.domain} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-800 p-3 rounded-xl">
                      <Globe className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{site.domain}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(site.timeSpentToday)} / {site.limitMinutes}m</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-12 w-12 rounded-full border-4 border-slate-800 relative flex items-center justify-center">
                       <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18" cy="18" r="16"
                            fill="none"
                            className="stroke-slate-800"
                            strokeWidth="4"
                          />
                          <circle
                            cx="18" cy="18" r="16"
                            fill="none"
                            className="stroke-indigo-500"
                            strokeWidth="4"
                            strokeDasharray={`${Math.min(100, (site.timeSpentToday / site.limitMinutes) * 100)} 100`}
                          />
                       </svg>
                       <span className="text-[10px] font-bold">{Math.round((site.timeSpentToday / site.limitMinutes) * 100)}%</span>
                    </div>
                    <button 
                      onClick={() => removeSite(site.domain)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {sites.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">
                  No sites in block list yet. Focus on your goals!
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-indigo-400" />
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
                <div className="w-32 relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="number" 
                    value={newGroupLimit}
                    onChange={(e) => setNewGroupLimit(e.target.value)}
                    placeholder="Mins"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-xl font-bold transition-colors">
                  Create
                </button>
              </form>
            </section>

            <div className="grid grid-cols-1 gap-6">
              {groups.map(group => (
                <div key={group.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{group.name}</h3>
                      <p className="text-slate-500 text-sm">Limit: {group.limitMinutes}m | Spent: {formatTime(group.timeSpentToday)}</p>
                    </div>
                    <button 
                      onClick={() => removeGroup(group.id)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 bg-slate-950/50">
                    <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Included Sites</h4>
                    <div className="flex flex-wrap gap-2">
                      {sites.map(site => (
                        <button
                          key={site.domain}
                          onClick={() => toggleSiteInGroup(group.id, site.domain)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                            group.sites.includes(site.domain)
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                              : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {group.sites.includes(site.domain) ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          {site.domain}
                        </button>
                      ))}
                      {sites.length === 0 && <p className="text-slate-600 text-sm italic">Add sites to individual list first to include them in groups.</p>}
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
