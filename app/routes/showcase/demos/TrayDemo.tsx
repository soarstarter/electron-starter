// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { useEffect, useState } from 'react'
import { PanelTop } from 'lucide-react'
import { Switch } from '@/app/components/ui/switch'
import { useConveyor } from '@/app/hooks/use-conveyor'
import type { ChannelReturn } from '@/lib/conveyor/schemas'

type AppSettings = ChannelReturn<'get-settings'>

export const TrayDemo = () => {
  const app = useConveyor('app')
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    app
      .getSettings()
      .then(setSettings)
      .catch((error) => console.error('Failed to load tray settings:', error))
  }, [app])

  const updateMinimizeToTray = async (minimizeToTray: boolean) => {
    setSettings(await app.setSettings({ minimizeToTray }))
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-muted p-2 text-muted-foreground">
          <PanelTop className="size-4" aria-hidden />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-base font-semibold">Tray behavior</h2>
            <p className="text-sm text-muted-foreground">
              Toggle the setting that decides whether closing the main window hides it to the tray.
            </p>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
            <span className="text-sm font-medium">Minimize to tray</span>
            <Switch
              checked={settings?.minimizeToTray ?? false}
              onCheckedChange={(checked) => void updateMinimizeToTray(checked)}
              disabled={!settings}
              aria-label="Minimize to tray"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
