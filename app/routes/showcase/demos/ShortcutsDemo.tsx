// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { useCallback, useEffect, useState } from 'react'
import { Keyboard } from 'lucide-react'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { useConveyor } from '@/app/hooks/use-conveyor'
import type { ResolvedShortcut } from '@/lib/conveyor/schemas'

export const ShortcutsDemo = () => {
  const shortcuts = useConveyor('shortcut')
  const [items, setItems] = useState<ResolvedShortcut[]>([])
  const [status, setStatus] = useState('Loading shortcuts...')

  const load = useCallback(async () => {
    const next = await shortcuts.list()
    setItems(next)
    setStatus(next.length === 0 ? 'No shortcuts are registered.' : `${next.length} shortcuts registered.`)
  }, [shortcuts])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Keyboard className="size-4" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold">Registered shortcuts</h2>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium">{item.description}</h3>
                <p className="text-xs text-muted-foreground">{item.id}</p>
              </div>
              <Badge variant="outline">{item.scope}</Badge>
            </div>
            <p className="mt-3 font-mono text-sm">{item.accelerator}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
