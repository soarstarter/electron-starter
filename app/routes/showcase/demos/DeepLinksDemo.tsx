// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { useEffect, useState } from 'react'
import { Link } from 'lucide-react'
import { Badge } from '@/app/components/ui/badge'
import { useConveyor } from '@/app/hooks/use-conveyor'
import type { AppIntent } from '@/lib/conveyor/schemas'

const EXAMPLES = ['electron-starter://showcase', 'electron-starter://showcase/file', '--route=/settings']

export const DeepLinksDemo = () => {
  const app = useConveyor('app')
  const [intents, setIntents] = useState<AppIntent[]>([])

  useEffect(() => {
    const unsubscribe = app.onAppIntent((intent) => {
      setIntents((current) => [intent, ...current].slice(0, 5))
    })

    return unsubscribe
  }, [app])

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Link className="size-4" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold">Intent inputs</h2>
            <p className="text-sm text-muted-foreground">
              Packaged builds register the protocol; development can still parse route flags in startup argv.
            </p>
          </div>
        </div>
        <div className="grid gap-2">
          {EXAMPLES.map((example) => (
            <code key={example} className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
              {example}
            </code>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Live intent log</h2>
          <Badge variant="outline">{intents.length}</Badge>
        </div>
        {intents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No app intents observed in this renderer session yet.</p>
        ) : (
          <ul className="space-y-2">
            {intents.map((intent, index) => (
              <li key={`${intent.route}-${index}`} className="rounded-md border border-border p-3 text-sm">
                <span className="text-muted-foreground">{intent.type}</span>
                <span className="ml-2 font-mono">{intent.route}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
