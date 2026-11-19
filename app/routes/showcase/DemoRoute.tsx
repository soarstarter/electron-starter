// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { useLocation } from 'react-router'
import { capabilityForRoute } from '@/app/showcase/capability-catalog'
import { NotFoundPage } from '@/app/routes/NotFoundPage'
import { DemoShell } from './DemoShell'
import { BackupDiagnosticsDemo } from './demos/BackupDiagnosticsDemo'
import { DeepLinksDemo } from './demos/DeepLinksDemo'
import { FileEditorDemo } from './demos/FileEditorDemo'
import { NotificationsDemo } from './demos/NotificationsDemo'
import { PlaceholderDemo } from './demos/PlaceholderDemo'
import { SecureStorageDemo } from './demos/SecureStorageDemo'
import { ShortcutsDemo } from './demos/ShortcutsDemo'
import { ThemeI18nDemo } from './demos/ThemeI18nDemo'
import { TrayDemo } from './demos/TrayDemo'
import { WindowDemo } from './demos/WindowDemo'

const demoFor = (id: string, capability: NonNullable<ReturnType<typeof capabilityForRoute>>) => {
  switch (id) {
    case 'window-state':
    case 'titlebar-controls':
      return <WindowDemo />
    case 'theme-accent':
    case 'i18n-switch':
      return <ThemeI18nDemo />
    case 'tray':
      return <TrayDemo />
    case 'notifications':
      return <NotificationsDemo />
    case 'global-shortcuts':
      return <ShortcutsDemo />
    case 'file-dialogs':
      return <FileEditorDemo />
    case 'deep-links':
      return <DeepLinksDemo />
    case 'secure-storage':
      return <SecureStorageDemo />
    case 'settings-persistence':
    case 'backup-restore':
    case 'diagnostics-report':
      return <BackupDiagnosticsDemo />
    default:
      return <PlaceholderDemo capability={capability} />
  }
}

export const DemoRoute = () => {
  const location = useLocation()
  const capability = capabilityForRoute(location.pathname)

  if (!capability) return <NotFoundPage />

  return <DemoShell capability={capability}>{demoFor(capability.id, capability)}</DemoShell>
}
