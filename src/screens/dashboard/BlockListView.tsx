import { AddSiteForm } from '../../components/AddSiteForm'
import { SiteCard } from '../../components/SiteCard'
import { useSites } from '../../hooks/useSites'
import type { Site } from '../../types'

interface BlockListViewProps {
  sites: Site[]
}

export function BlockListView({ sites }: BlockListViewProps) {
  const { addSite, updateSite, removeSite } = useSites()

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <AddSiteForm
        existingDomains={sites.map(s => s.domain)}
        onAdd={addSite}
        variant="dashboard"
      />
      <div className="grid grid-cols-1 gap-6">
        {sites.map(site => (
          <SiteCard
            key={site.domain}
            site={site}
            onUpdate={updateSite}
            onRemove={removeSite}
            variant="dashboard"
          />
        ))}
      </div>
    </div>
  )
}
