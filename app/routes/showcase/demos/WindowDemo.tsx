// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { useCallback, useEffect, useState } from 'react'
import { AppWindow } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { useConveyor } from '@/app/hooks/use-conveyor'
import type { ChannelReturn } from '@/lib/conveyor/schemas'

type WindowInfo = ChannelReturn<'window-init'>

export const WindowDemo = () => {
  const windowApi = useConveyor('window')
  const [info, setInfo] = useState<WindowInfo | null>(null)
  const [status, setStatus] = useState('Loading window state...')

  const load = useCallback(async () => {
    const next = await windowApi.windowInit()
    setInfo(next)
    setStatus(`Window is ${next.width}x${next.height} on ${next.platform}.`)
  }, [windowApi])

  useEffect(() => {
    void load()
  }, [load])

  const toggleMaximize = async () => {
    await windowApi.windowMaximizeToggle()
    setStatus('Toggled maximize state.')
  }

  const toggleFullscreen = async () => {
    await windowApi.webToggleFullscreen()
    setStatus('Toggled fullscreen state.')
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-md bg-muted p-2 text-muted-foreground">
          <AppWindow className="size-4" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold">Window controls</h2>
          <p className="text-sm text-muted-foreground">{status}</p>
        </div>
      </div>
      {info && (
        <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-md border border-border p-3">
            <dt className="text-muted-foreground">Minimizable</dt>
            <dd className="font-medium">{info.minimizable ? 'Yes' : 'No'}</dd>
          </div>
          <div className="rounded-md border border-border p-3">
            <dt className="text-muted-foreground">Maximizable</dt>
            <dd className="font-medium">{info.maximizable ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void windowApi.windowMinimize()}>
          Minimize
        </Button>
        <Button variant="outline" onClick={() => void toggleMaximize()}>
          Toggle maximize
        </Button>
        <Button variant="outline" onClick={() => void toggleFullscreen()}>
          Toggle fullscreen
        </Button>
        <Button variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
    </div>
  )
}
