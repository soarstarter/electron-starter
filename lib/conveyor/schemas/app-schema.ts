import { z } from 'zod'
import { secureKeySchema } from './secure-schema'

export const themeSettingSchema = z.enum(['light', 'dark', 'system'])
export const MIN_ZOOM_LEVEL = -3
export const MAX_ZOOM_LEVEL = 3
export const zoomLevelSchema = z.number().min(MIN_ZOOM_LEVEL).max(MAX_ZOOM_LEVEL)

// Accent colors layered on top of light/dark. `default` keeps the brand
// primary; the rest override --primary/--ring (see app/styles/globals.css).
export const ACCENT_COLORS = ['default', 'blue', 'violet', 'green', 'rose', 'amber'] as const
export const accentColorSchema = z.enum(ACCENT_COLORS)

export const localeSettingSchema = z.enum(['system', 'en', 'zh'])
export const supportedLanguageSchema = z.enum(['en', 'zh'])
export const proxyModeSchema = z.enum(['system', 'none', 'custom'])

export const proxySettingsSchema = z.object({
  mode: proxyModeSchema,
  url: z.string().url().optional(),
})

export const proxySettingsPatchSchema = z.object({
  mode: proxyModeSchema.optional(),
  url: z.string().url().nullable().optional(),
})

export const windowSettingsSchema = z.object({
  menusVisible: z.boolean(),
})

export const windowSettingsPatchSchema = z.object({
  menusVisible: z.boolean().optional(),
})

const shortcutIdSchema = z.string().min(1).max(64)
const acceleratorSchema = z.string().min(1).max(128)

export const shortcutOverridesSchema = z.record(shortcutIdSchema, acceleratorSchema)

// Most-recently-used file paths, newest first. Capped so the persisted list
// can't grow unbounded; the SettingsStore enforces the same cap when pushing.
export const MAX_RECENT_FILES = 10
export const recentFilesSchema = z.array(z.string().min(1)).max(MAX_RECENT_FILES)

export const appSettingsSchema = z.object({
  theme: themeSettingSchema,
  accentColor: accentColorSchema,
  zoomLevel: zoomLevelSchema,
  locale: localeSettingSchema,
  launchAtLogin: z.boolean(),
  minimizeToTray: z.boolean(),
  notifications: z.boolean(),
  proxy: proxySettingsSchema,
  window: windowSettingsSchema,
  shortcuts: shortcutOverridesSchema,
  recentFiles: recentFilesSchema,
  onboardingCompleted: z.boolean(),
  eulaAcceptedVersion: z.number().int().min(0),
  dataDir: z.string().min(1).optional(),
})

export const appSettingsPatchSchema = z.object({
  theme: themeSettingSchema.optional(),
  accentColor: accentColorSchema.optional(),
  zoomLevel: zoomLevelSchema.optional(),
  locale: localeSettingSchema.optional(),
  launchAtLogin: z.boolean().optional(),
  minimizeToTray: z.boolean().optional(),
  notifications: z.boolean().optional(),
  proxy: proxySettingsPatchSchema.optional(),
  window: windowSettingsPatchSchema.optional(),
  shortcuts: shortcutOverridesSchema.optional(),
  recentFiles: recentFilesSchema.optional(),
  onboardingCompleted: z.boolean().optional(),
  eulaAcceptedVersion: z.number().int().min(0).optional(),
  dataDir: z.string().min(1).nullable().optional(),
})

const MAX_LOG_MESSAGE_LEN = 2000
const MAX_LOG_CONTEXT_KEYS = 8
const MAX_LOG_CONTEXT_VALUE_LEN = 500

export const logEntrySchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug']),
  message: z.string().min(1).max(MAX_LOG_MESSAGE_LEN),
  context: z
    .record(z.string(), z.union([z.string().max(MAX_LOG_CONTEXT_VALUE_LEN), z.number(), z.boolean()]))
    .refine((value) => Object.keys(value).length <= MAX_LOG_CONTEXT_KEYS, {
      message: `log context has more than ${MAX_LOG_CONTEXT_KEYS} keys`,
    })
    .optional(),
})

export type LogEntryPayload = z.infer<typeof logEntrySchema>

// Build-and-runtime metadata surfaced on the About page and copied into bug
// reports. The full blob is routed through `redactSensitive` in main before it
// crosses IPC, so it must never contain sessions, tokens, or signed URLs.
export const diagnosticsSchema = z.object({
  app: z.object({
    name: z.string(),
    version: z.string(),
    commitSha: z.string(),
    buildTime: z.string(),
  }),
  versions: z.object({
    electron: z.string(),
    chromium: z.string(),
    node: z.string(),
    v8: z.string(),
  }),
  os: z.object({
    platform: z.string(),
    release: z.string(),
    arch: z.string(),
  }),
  logPath: z.string(),
})

export type Diagnostics = z.infer<typeof diagnosticsSchema>

// Result of exporting a settings backup to a user-chosen file.
export const dataExportResultSchema = z.object({
  canceled: z.boolean(),
  path: z.string().nullable(),
})

// Result of importing a settings backup. On success the restored settings are
// returned so the renderer can refresh, along with the names (never values) of
// the secure keys the backup recorded as present on its source device.
export const dataImportResultSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('canceled') }),
  z.object({
    status: z.literal('ok'),
    settings: appSettingsSchema,
    secureKeysPresent: z.array(secureKeySchema),
  }),
  z.object({ status: z.literal('error'), message: z.string() }),
])

export const appIpcSchema = {
  version: {
    args: z.tuple([]),
    return: z.string(),
  },
  'get-settings': {
    args: z.tuple([]),
    return: appSettingsSchema,
  },
  'set-settings': {
    args: z.tuple([appSettingsPatchSchema]),
    return: appSettingsSchema,
  },
  'reset-settings': {
    args: z.tuple([]),
    return: appSettingsSchema,
  },
  'app-intents-ready': {
    args: z.tuple([]),
    return: z.void(),
  },
  'app-log': {
    args: z.tuple([logEntrySchema]),
    return: z.void(),
  },
  'app-show-logs': {
    args: z.tuple([]),
    return: z.void(),
  },
  'app-get-diagnostics': {
    args: z.tuple([]),
    return: diagnosticsSchema,
  },
  'app-get-locale': {
    args: z.tuple([]),
    return: z.string(),
  },
  'app-set-locale': {
    args: z.tuple([supportedLanguageSchema]),
    return: z.void(),
  },
  'app-export-data': {
    args: z.tuple([]),
    return: dataExportResultSchema,
  },
  'app-import-data': {
    args: z.tuple([]),
    return: dataImportResultSchema,
  },
}
