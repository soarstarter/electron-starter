import type { App } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { z } from 'zod'
import {
  appSettingsSchema,
  appSettingsPatchSchema,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  proxySettingsPatchSchema,
  windowSettingsPatchSchema,
  MAX_RECENT_FILES,
} from '@/lib/conveyor/schemas/app-schema'

export type AppSettings = z.infer<typeof appSettingsSchema>
export type AppSettingsPatch = z.infer<typeof appSettingsPatchSchema>

type ProxySettingsPatch = z.infer<typeof proxySettingsPatchSchema>
type WindowSettingsPatch = z.infer<typeof windowSettingsPatchSchema>

export const CURRENT_SETTINGS_VERSION = 10

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: 'default',
  zoomLevel: 0,
  locale: 'system',
  launchAtLogin: false,
  minimizeToTray: false,
  notifications: true,
  proxy: { mode: 'system' },
  window: {
    menusVisible: true,
  },
  shortcuts: {},
  recentFiles: [],
  onboardingCompleted: false,
  eulaAcceptedVersion: 0,
}

/**
 * Prepend `path` to a most-recently-used list: dedupe (newest wins), drop empty
 * entries, and cap at {@link MAX_RECENT_FILES}. Pure so the ordering/cap rules
 * are unit-testable without touching disk.
 */
export const pushRecentFile = (current: readonly string[], path: string): string[] => {
  const trimmed = path.trim()
  if (!trimmed) return [...current]
  return [trimmed, ...current.filter((entry) => entry !== trimmed)].slice(0, MAX_RECENT_FILES)
}

export const clampZoomLevel = (zoomLevel: number): number => {
  return Math.min(MAX_ZOOM_LEVEL, Math.max(MIN_ZOOM_LEVEL, zoomLevel))
}

const persistedEnvelopeSchema = z.object({
  version: z.number().int().min(1),
  settings: z.record(z.string(), z.unknown()),
})

type RawSettings = Record<string, unknown>

// Each migrator turns the previous version's payload into the next version's
// payload. Add a new entry whenever CURRENT_SETTINGS_VERSION advances.
// Versions 2, 4 and 6 introduced keys this app doesn't use; those steps are
// pass-throughs so the version numbers (and older settings files) stay valid.
// Keys the schema doesn't know are dropped when the result is validated.
const SETTINGS_MIGRATIONS: Record<number, (settings: RawSettings) => RawSettings> = {
  1: (v1) => ({
    theme: 'dark',
    locale: 'system',
    launchAtLogin: false,
    minimizeToTray: false,
    notifications: true,
    proxy: { mode: 'system' },
    window: { menusVisible: true },
    ...v1,
  }),
  2: (v2) => v2,
  3: (v3) => ({
    ...v3,
    shortcuts: {},
  }),
  4: (v4) => v4,
  5: (v5) => ({
    ...v5,
    recentFiles: [],
  }),
  6: (v6) => v6,
  7: (v7) => ({
    ...v7,
    accentColor: 'default',
  }),
  8: (v8) => ({
    ...v8,
    onboardingCompleted: false,
    eulaAcceptedVersion: 0,
  }),
  9: (v9) => ({
    ...v9,
    zoomLevel: 0,
  }),
}

const migrateForward = (raw: { version: number; settings: RawSettings }): RawSettings => {
  let version = raw.version
  let settings = raw.settings
  while (version < CURRENT_SETTINGS_VERSION) {
    const migrator = SETTINGS_MIGRATIONS[version]
    if (!migrator) {
      throw new Error(`No settings migration registered from version ${version}`)
    }
    settings = migrator(settings)
    version += 1
  }
  return settings
}

const mergeProxy = (current: AppSettings['proxy'], patch: ProxySettingsPatch | undefined): AppSettings['proxy'] => {
  if (!patch) return current
  const next: AppSettings['proxy'] = { ...current }
  if (patch.mode !== undefined) next.mode = patch.mode
  if (patch.url === null) {
    delete next.url
  } else if (typeof patch.url === 'string') {
    next.url = patch.url
  }
  return next
}

const mergeWindow = (current: AppSettings['window'], patch: WindowSettingsPatch | undefined): AppSettings['window'] => {
  if (!patch) return current
  return {
    ...current,
    ...(patch.menusVisible !== undefined && { menusVisible: patch.menusVisible }),
  }
}

export class SettingsStore {
  private readonly settingsPath: string
  private settings: AppSettings

  constructor(app: App) {
    this.settingsPath = join(app.getPath('userData'), 'settings.json')
    this.settings = this.loadSettings()
  }

  get = (): AppSettings => {
    return this.settings
  }

  update = (patch: AppSettingsPatch): AppSettings => {
    const next: AppSettings = { ...this.settings }

    if (patch.theme !== undefined) next.theme = patch.theme
    if (patch.accentColor !== undefined) next.accentColor = patch.accentColor
    if (patch.zoomLevel !== undefined) next.zoomLevel = clampZoomLevel(patch.zoomLevel)
    if (patch.locale !== undefined) next.locale = patch.locale
    if (patch.launchAtLogin !== undefined) next.launchAtLogin = patch.launchAtLogin
    if (patch.minimizeToTray !== undefined) next.minimizeToTray = patch.minimizeToTray
    if (patch.notifications !== undefined) next.notifications = patch.notifications

    next.proxy = mergeProxy(this.settings.proxy, patch.proxy)
    next.window = mergeWindow(this.settings.window, patch.window)

    if (patch.shortcuts !== undefined) next.shortcuts = { ...patch.shortcuts }
    if (patch.recentFiles !== undefined) next.recentFiles = [...patch.recentFiles].slice(0, MAX_RECENT_FILES)
    if (patch.onboardingCompleted !== undefined) next.onboardingCompleted = patch.onboardingCompleted
    if (patch.eulaAcceptedVersion !== undefined) next.eulaAcceptedVersion = patch.eulaAcceptedVersion

    if (patch.dataDir === null) {
      delete next.dataDir
    } else if (typeof patch.dataDir === 'string') {
      next.dataDir = patch.dataDir
    }

    this.settings = appSettingsSchema.parse(next)
    this.saveSettings(this.settings)
    return this.settings
  }

  reset = (): AppSettings => {
    this.settings = structuredClone(DEFAULT_SETTINGS)
    this.saveSettings(this.settings)
    return this.settings
  }

  /**
   * Replace the entire settings object (used by the backup-import flow). The
   * caller is expected to pass an already-validated full settings object; we
   * re-validate defensively before persisting.
   */
  restore = (settings: AppSettings): AppSettings => {
    this.settings = appSettingsSchema.parse(settings)
    this.saveSettings(this.settings)
    return this.settings
  }

  /**
   * Record `path` as the most-recently-used file (dedupe + cap) and persist.
   * Called by the file open/save handlers; the renderer reads the resulting
   * `recentFiles` back through `get-settings`.
   */
  addRecentFile = (path: string): AppSettings => {
    const recentFiles = pushRecentFile(this.settings.recentFiles, path)
    this.settings = appSettingsSchema.parse({ ...this.settings, recentFiles })
    this.saveSettings(this.settings)
    return this.settings
  }

  /** Drop a path from the MRU list (e.g. when it no longer exists on disk). */
  removeRecentFile = (path: string): AppSettings => {
    const recentFiles = this.settings.recentFiles.filter((entry) => entry !== path)
    if (recentFiles.length === this.settings.recentFiles.length) return this.settings
    this.settings = appSettingsSchema.parse({ ...this.settings, recentFiles })
    this.saveSettings(this.settings)
    return this.settings
  }

  private loadSettings = (): AppSettings => {
    try {
      if (!existsSync(this.settingsPath)) {
        this.saveSettings(DEFAULT_SETTINGS)
        return DEFAULT_SETTINGS
      }

      const raw = readFileSync(this.settingsPath, 'utf8')
      const parsed = JSON.parse(raw) as unknown

      const envelope = persistedEnvelopeSchema.safeParse(parsed)
      if (envelope.success) {
        if (envelope.data.version > CURRENT_SETTINGS_VERSION) {
          console.warn(
            `Settings file version ${envelope.data.version} is newer than supported (${CURRENT_SETTINGS_VERSION}); resetting to defaults.`
          )
        } else {
          const migrated = migrateForward(envelope.data)
          const validated = appSettingsSchema.safeParse(migrated)
          if (validated.success) {
            if (envelope.data.version < CURRENT_SETTINGS_VERSION) {
              this.saveSettings(validated.data)
            }
            return validated.data
          }
        }
      } else if (parsed && typeof parsed === 'object' && !('version' in parsed)) {
        // Legacy unversioned file (predates the envelope) — treat it as v1.
        const migrated = migrateForward({ version: 1, settings: parsed as RawSettings })
        const validated = appSettingsSchema.safeParse(migrated)
        if (validated.success) {
          this.saveSettings(validated.data)
          return validated.data
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }

    this.saveSettings(DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
  }

  private saveSettings = (settings: AppSettings): void => {
    const directory = dirname(this.settingsPath)
    mkdirSync(directory, { recursive: true })
    writeFileSync(
      this.settingsPath,
      JSON.stringify(
        {
          version: CURRENT_SETTINGS_VERSION,
          settings,
        },
        null,
        2
      ),
      'utf8'
    )
  }
}
