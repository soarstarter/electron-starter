// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { COMPONENT_CATALOG, COMPONENT_GROUPS, componentsIn } from './component-catalog'

const GROUP_LABELS: Record<(typeof COMPONENT_GROUPS)[number], string> = {
  controls: 'Controls',
  inputs: 'Inputs',
  overlays: 'Overlays',
  feedback: 'Feedback',
  layout: 'Layout',
}

export const ComponentsPage = () => (
  <section className="mx-auto flex max-w-6xl flex-col gap-8">
    <div>
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/showcase">
          <ArrowLeft className="size-4" aria-hidden />
          Back to Showcase
        </Link>
      </Button>
    </div>

    <header className="space-y-2 border-b border-border pb-5">
      <Badge variant="outline">{COMPONENT_CATALOG.length} entries</Badge>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Components</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          A live gallery of the reusable UI primitives and application composites available in this template.
        </p>
      </div>
    </header>

    {COMPONENT_GROUPS.map((group) => {
      const entries = componentsIn(group)
      return (
        <section key={group} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{GROUP_LABELS[group]}</h2>
            <Badge variant="secondary">{entries.length}</Badge>
          </div>
          <div className="grid gap-4">
            {entries.map((entry) => {
              const Preview = entry.render
              return (
                <article key={entry.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">{entry.title}</h3>
                      <p className="max-w-2xl text-xs text-muted-foreground">{entry.summary}</p>
                    </div>
                    <code className="w-fit rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {entry.importPath}
                    </code>
                  </div>
                  <div className="rounded-md border border-border/70 bg-background p-4">
                    <Preview />
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )
    })}
  </section>
)
