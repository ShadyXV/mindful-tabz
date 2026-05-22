import { AddSiteForm } from '../../components/AddSiteForm'
import { SiteCard } from '../../components/SiteCard'
import { useSites } from '../../hooks/useSites'
import type { Site } from '../../types'

interface SitesViewProps {
  sites: Site[]
}

export function SitesView({ sites }: SitesViewProps) {
  const { addSite, updateSite, removeSite } = useSites()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            variant="popup"
          />
        ))}
      </section>
    </div>
  )
}
