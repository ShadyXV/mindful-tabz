import React, { useState } from 'react'
import { Clock, LayoutGrid } from 'lucide-react'
import { GroupCard } from '../../components/GroupCard'
import { useGroups } from '../../hooks/useGroups'
import type { Site, Group } from '../../types'

interface GroupsViewProps {
  sites: Site[]
  groups: Group[]
}

export function GroupsView({ sites, groups }: GroupsViewProps) {
  const { createGroup, removeGroup, toggleSiteInGroup } = useGroups()
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupLimit, setNewGroupLimit] = useState('60')

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName) return
    await createGroup(newGroupName, parseInt(newGroupLimit))
    setNewGroupName('')
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <section className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-4 text-indigo-400 uppercase tracking-tight">
          <div className="bg-indigo-600/20 p-2 rounded-xl">
            <LayoutGrid className="w-6 h-6" />
          </div>
          Create Group
        </h2>
        <form onSubmit={handleAddGroup} className="flex flex-col md:flex-row gap-8">
          <input
            type="text"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            placeholder="Group name, e.g. Social Media"
            className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-3xl py-5 px-8 text-xl font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-700"
          />
          <div className="w-full md:w-56 relative">
            <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-slate-500" />
            <input
              type="number"
              value={newGroupLimit}
              onChange={e => setNewGroupLimit(e.target.value)}
              placeholder="Mins"
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl py-5 pl-16 pr-6 text-xl font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-3xl font-black text-xl transition-all shadow-2xl shadow-indigo-900/40"
          >
            Create Group
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 gap-10">
        {groups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            allSites={sites}
            onRemove={removeGroup}
            onToggleSite={toggleSiteInGroup}
            variant="dashboard"
          />
        ))}
      </div>
    </div>
  )
}
