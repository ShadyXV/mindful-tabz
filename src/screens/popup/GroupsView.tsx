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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-400">
          <LayoutGrid className="w-5 h-5" />
          Create New Group
        </h2>
        <form onSubmit={handleAddGroup} className="flex gap-4">
          <input
            type="text"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            placeholder="Group Name (e.g. Social Media)"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
          <div className="w-40 relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="number"
              value={newGroupLimit}
              onChange={e => setNewGroupLimit(e.target.value)}
              placeholder="Mins"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl font-bold transition-colors"
          >
            Create
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 gap-6">
        {groups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            allSites={sites}
            onRemove={removeGroup}
            onToggleSite={toggleSiteInGroup}
            variant="popup"
          />
        ))}
      </div>
    </div>
  )
}
