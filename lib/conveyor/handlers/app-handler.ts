import { dialog, shell, type App } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'
import { getRequestingWindow, handle } from '@/lib/main/shared'
import { CURRENT_SETTINGS_VERSION, type SettingsStore } from '@/lib/main/settings'
import type { SecureStorage } from '@/lib/main/secure-storage'
import type { AppIntentService } from '@/lib/main/app-intents'
import type { TrayService } from '@/lib/main/tray'
import { getLogFilePath, writeLog } from '@/lib/main/logger'
import { redactContext } from '@/lib/main/log-redact'
import { getDiagnostics } from '@/lib/main/diagnostics'
import { setMainLanguage } from '@/lib/main/i18n'
import { buildBackup, parseBackup } from '@/lib/main/backup'
import { keepKnownRecentFiles } from '@/lib/main/recent-file-access'
import { APP_ID, PRODUCT_SLUG } from '@/shared/constants'

interface AppHandlerDeps {
  onLocaleChanged?: () => void
}

export const registerAppHandlers = (
  app: App,
  settingsStore: SettingsStore,
  secureStorage: SecureStorage,
  appIntentService: AppIntentService,
  trayService: TrayService,
  deps: AppHandlerDeps = {}
) => {
  // App operations
  handle('version', () => app.getVersion())
  handle('get-settings', () => settingsStore.get())
  handle('set-settings', (_event, patch) => {
    const next = settingsStore.update(
      patch.recentFiles === undefined
        ? patch
        : { ...patch, recentFiles: keepKnownRecentFiles(patch.recentFiles, settingsStore.get().recentFiles) }
    )
    trayService.applySettings()
    return next
  })
  handle('reset-settings', () => {
    const next = settingsStore.reset()
    trayService.applySettings()
    return next
  })
  handle('app-intents-ready', (event) => appIntentService.rendererIsReady(getRequestingWindow(event)))

  handle('app-log', (_event, entry) => {
    writeLog({
      level: entry.level,
      message: entry.message,
      context: redactContext(entry.context),
      source: 'renderer',
    })
  })

  handle('app-show-logs', () => {
    shell.showItemInFolder(getLogFilePath())
  })

  handle('app-get-diagnostics', () => getDiagnostics(app))

  handle('app-get-locale', () => app.getLocale())

  handle('app-set-locale', async (_event, locale) => {
    await setMainLanguage(locale)
    deps.onLocaleChanged?.()
  })

  // Export the user's settings (plus a no-secrets manifest of which secure keys
  // exist) to a JSON file the user picks.
  handle('app-export-data', async (event) => {
    const today = new Date().toISOString().slice(0, 10)
    const selected = await dialog.showSaveDialog(getRequestingWindow(event), {
      title: 'Export Backup',
      defaultPath: `${PRODUCT_SLUG}-backup-${today}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })

    if (selected.canceled || !selected.filePath) {
      return { canceled: true, path: null }
    }

    const backup = buildBackup({
      appId: APP_ID,
      appVersion: app.getVersion(),
      settingsVersion: CURRENT_SETTINGS_VERSION,
      settings: settingsStore.get(),
      secureKeysPresent: secureStorage.listPresentKeys(),
    })

    await writeFile(selected.filePath, JSON.stringify(backup, null, 2), 'utf8')
    return { canceled: false, path: selected.filePath }
  })

  // Restore settings from a backup file. Secure secrets are intentionally NOT
  // imported (they are device-bound); the user re-enters them on the new device.
  handle('app-import-data', async (event) => {
    const selected = await dialog.showOpenDialog(getRequestingWindow(event), {
      title: 'Import Backup',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })

    if (selected.canceled || selected.filePaths.length === 0) {
      return { status: 'canceled' as const }
    }

    try {
      const raw = JSON.parse(await readFile(selected.filePaths[0], 'utf8')) as unknown
      const backup = parseBackup(raw)
      const settings = settingsStore.restore(backup.settings)
      trayService.applySettings()
      return { status: 'ok' as const, settings, secureKeysPresent: backup.secureKeysPresent }
    } catch (error) {
      writeLog({
        level: 'warn',
        message: 'Failed to import settings backup',
        context: redactContext({ reason: error instanceof Error ? error.message : 'invalid backup file' }),
        source: 'main',
      })
      return { status: 'error' as const, message: 'The selected file is not a valid backup.' }
    }
  })
}
