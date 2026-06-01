import { AddSiteForm } from '../../components/AddSiteForm'
import { SiteCard } from '../../components/SiteCard'
import { useSites } from '../../hooks/useSites'
import browser from '../../browser/api'
import type { Site } from '../../types'

interface SitesViewProps {
  sites: Site[]
  blockingEnabled: boolean
}

async function checkActiveBlock() {
  try {
    await browser.runtime.sendMessage({ type: 'CHECK_ACTIVE_BLOCK' })
  } catch {
    // Background may be asleep in development; the next tick will still enforce.
  }
}

export function SitesView({ sites, blockingEnabled }: SitesViewProps) {
  const { addSite, updateSite, removeSite, setGlobalBlockingEnabled, setSiteBlockingEnabled } = useSites()

  const toggleGlobalBlocking = async (enabled: boolean) => {
    await setGlobalBlockingEnabled(enabled)
    if (enabled) await checkActiveBlock()
  }

  const toggleSiteBlocking = async (domain: string, enabled: boolean) => {
    await setSiteBlockingEnabled(domain, enabled)
    if (enabled) await checkActiveBlock()
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between gap-5">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-white tracking-tight">Blocking</h2>
          <p className="text-slate-500 font-semibold mt-1 text-sm truncate">
            {blockingEnabled ? 'Sites still track time and block at their limits.' : 'Time tracking stays on, but all blocking is paused.'}
          </p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none shrink-0">
          <span className={`text-xs font-black uppercase tracking-wider ${blockingEnabled ? 'text-indigo-400' : 'text-slate-500'}`}>
            {blockingEnabled ? 'On' : 'Paused'}
          </span>
          <input
            type="checkbox"
            checked={blockingEnabled}
            onChange={event => toggleGlobalBlocking(event.target.checked)}
            className="sr-only"
          />
          <span
            className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
              blockingEnabled ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-6 h-6 bg-white rounded-full transition-transform ${
                blockingEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </span>
        </label>
      </section>

      <AddSiteForm
        existingDomains={sites.map(s => s.domain)}
        onAdd={addSite}
        variant="popup"
      />
      <section className="grid grid-cols-1 gap-4">
        {sites.map(site => (
          <SiteCard
            key={site.domain}
            site={site}
            onUpdate={updateSite}
            onRemove={removeSite}
            onToggleBlocking={toggleSiteBlocking}
            variant="popup"
          />
        ))}
      </section>
    </div>
  )
}
