import { Suspense, useState } from 'react'
import { Outlet } from 'react-router'
import { Toaster } from '@/app/components/ui/sonner'
import { RouteFallback } from '@/app/components/layout/RouteFallback'
import { OfflineBanner } from '@/app/components/layout/OfflineBanner'
import { CommandPalette } from '@/app/components/command-palette/CommandPalette'
import { useCommandPaletteStore } from '@/app/components/command-palette/command-palette-store'
import { useShortcut } from '@/app/hooks/use-shortcut'
import { AppHeader } from './AppHeader'
import { Sidebar } from './Sidebar'

export const AppShell = () => {
  const [collapsed, setCollapsed] = useState(false)
  const toggleCommandPalette = useCommandPaletteStore((s) => s.toggle)
  const openCommandPalette = useCommandPaletteStore((s) => s.setOpen)

  // The reserved `CmdOrCtrl+K` accelerator toggles the palette (pressing it
  // again while open closes it).
  useShortcut('palette.open', (event) => {
    event.preventDefault()
    toggleCommandPalette()
  })

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <AppHeader
        onToggleSidebar={() => setCollapsed((value) => !value)}
        onOpenCommandPalette={() => openCommandPalette(true)}
      />

      <div data-testid="app-banner-slot" id="app-banner-slot">
        <OfflineBanner />
      </div>

      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={collapsed} />
        <main className="flex-1 overflow-auto p-4">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <CommandPalette />
      <Toaster />
    </div>
  )
}
