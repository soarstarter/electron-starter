import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PanelLeft, Search } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { cn } from '@/lib/utils'
import { useShortcuts } from '@/app/hooks/use-shortcut'
import { useWindowContext } from '@/app/components/window'

const formatAcceleratorForDisplay = (accelerator: string): string =>
  accelerator
    .replace(/Cmd/gi, '⌘')
    .replace(/Ctrl/gi, 'Ctrl')
    .replace(/Alt/gi, 'Alt')
    .replace(/Shift/gi, '⇧')
    .split('+')
    .map((part) => part.trim())
    .join('+')

interface AppHeaderProps {
  onToggleSidebar: () => void
  onOpenCommandPalette: () => void
}

export const AppHeader = ({ onToggleSidebar, onOpenCommandPalette }: AppHeaderProps) => {
  const { t } = useTranslation('common')
  const shortcuts = useShortcuts()
  const { window: winInfo } = useWindowContext()
  const platform = winInfo?.platform

  const paletteAccelerator = useMemo(() => {
    const accel = shortcuts?.find((s) => s.id === 'palette.open')?.accelerator
    return accel ? formatAcceleratorForDisplay(accel) : undefined
  }, [shortcuts])

  // Inset the left side of the header on macOS so it does not overlap the
  // system traffic-light controls. Windows uses titleBarOverlay on the right
  // side, which is handled by the right-side spacer below.
  const isMac = platform === 'darwin'
  const isWindows = platform === 'win32'

  return (
    <header
      className={cn(
        'app-titlebar-drag relative flex h-10 shrink-0 items-center gap-2 border-b border-border bg-card/40',
        'pr-2'
      )}
    >
      <div className={cn('flex items-center', isMac ? 'pl-[78px]' : 'pl-2')}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={t('header.toggleSidebar')}
          className="no-drag"
        >
          <PanelLeft className="size-4" />
        </Button>
      </div>

      <div className="flex-1" />

      <Button
        variant="outline"
        size="sm"
        onClick={onOpenCommandPalette}
        aria-label={t('header.commandPalette')}
        className="no-drag h-7 gap-2 text-xs text-muted-foreground"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">{t('header.commandPalette')}</span>
        {paletteAccelerator && (
          <kbd className="ml-2 hidden rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] sm:inline">
            {paletteAccelerator}
          </kbd>
        )}
      </Button>

      {isWindows && <div aria-hidden className="w-[138px]" />}
    </header>
  )
}
