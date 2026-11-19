// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { ExternalLink } from 'lucide-react'
import type { TemplateCapability } from '@/app/showcase/capability-types'

interface PlaceholderDemoProps {
  capability: TemplateCapability
}

export const PlaceholderDemo = ({ capability }: PlaceholderDemoProps) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-muted p-2 text-muted-foreground">
        <ExternalLink className="size-4" aria-hidden />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Source-guided demo</h2>
        <p className="text-sm text-muted-foreground">
          This route is registered from the catalog and ready for a focused live demo. For now, use the status note and
          source files below to inspect the implementation path for <span className="font-medium">{capability.id}</span>
          .
        </p>
      </div>
    </div>
  </div>
)
