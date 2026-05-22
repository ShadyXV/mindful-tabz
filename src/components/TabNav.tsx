import type React from 'react'

export interface TabItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface TabNavProps {
  tabs: readonly TabItem[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'popup' | 'dashboard'
}

export function TabNav({ tabs, activeTab, onChange, variant = 'popup' }: TabNavProps) {
  if (variant === 'dashboard') {
    return (
      <nav className="flex bg-slate-900/50 p-2 rounded-3xl border border-slate-800/50 backdrop-blur-xl shadow-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-8 py-4 rounded-2xl transition-all flex items-center gap-3 font-black text-sm uppercase tracking-wider ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </nav>
    )
  }

  return (
    <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === tab.id
              ? 'bg-slate-800 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  )
}
