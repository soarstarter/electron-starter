// Pure helpers for the settings backup feature (Tier 3 step 15). Kept free of
// Electron/fs so the build + validate logic is unit-testable; the handler does
// the dialogs and file IO around these.
//
// Security: a backup carries the user's **settings** (preferences only — the
// settings file holds no secrets) plus a manifest of which secure-storage keys
// exist on the device. It deliberately NEVER includes the decrypted secure
// values (tokens and other secrets): those are device-bound via safeStorage and
// exporting them in plaintext would defeat the OS encryption. Restoring secure
// data means re-entering it on the target device.

import { z } from 'zod'
import { appSettingsSchema } from '@/lib/conveyor/schemas/app-schema'
import { secureKeySchema, type SecureKey } from '@/lib/conveyor/schemas'

export const BACKUP_FORMAT_VERSION = 1

export const backupFileSchema = z.object({
  kind: z.literal('settings-backup'),
  formatVersion: z.number().int().positive(),
  appId: z.string(),
  appVersion: z.string(),
  exportedAt: z.string(),
  settingsVersion: z.number().int().positive(),
  // Unknown settings keys are stripped by the object schema, so a backup from a
  // build with extra settings still imports.
  settings: appSettingsSchema,
  /**
   * Names only — which secure keys exist on the source device. Never values.
   * Names this build doesn't know are dropped rather than failing the import.
   */
  secureKeysPresent: z
    .array(z.string())
    .transform((keys) => keys.filter((key): key is SecureKey => secureKeySchema.safeParse(key).success)),
})

export type BackupFile = z.infer<typeof backupFileSchema>

interface BuildBackupInput {
  appId: string
  appVersion: string
  settingsVersion: number
  settings: z.infer<typeof appSettingsSchema>
  secureKeysPresent: SecureKey[]
  now?: Date
}

export const buildBackup = (input: BuildBackupInput): BackupFile => ({
  kind: 'settings-backup',
  formatVersion: BACKUP_FORMAT_VERSION,
  appId: input.appId,
  appVersion: input.appVersion,
  exportedAt: (input.now ?? new Date()).toISOString(),
  settingsVersion: input.settingsVersion,
  settings: appSettingsSchema.parse(input.settings),
  secureKeysPresent: input.secureKeysPresent,
})

/**
 * Validate raw parsed JSON as a backup file. Throws (via Zod) when the shape or
 * the embedded settings don't match the current schema, so the import handler
 * can surface a clean error instead of restoring garbage.
 */
export const parseBackup = (raw: unknown): BackupFile => backupFileSchema.parse(raw)
