import { safeStorage, type App, type SafeStorage } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import { secureKeySchema, type SecureKey } from '@/lib/conveyor/schemas'
import { redactContext } from './log-redact'
import { writeLog, type LogEntry } from './logger'

const SECRETS_FILE_VERSION = 1

const persistedSecretsSchema = z.object({
  version: z.literal(SECRETS_FILE_VERSION),
  entries: z.partialRecord(secureKeySchema, z.string()),
})

type SecureStorageErrorCode = 'ENCRYPTION_UNAVAILABLE' | 'STORAGE_FAILURE'
type LogWriter = (entry: LogEntry) => void
type PersistedEntries = Partial<Record<SecureKey, string>>

export class SecureStorageError extends Error {
  constructor(
    readonly code: SecureStorageErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'SecureStorageError'
  }
}

export class SecureStorage {
  private readonly secretsPath: string

  constructor(
    app: Pick<App, 'getPath'>,
    private readonly encryption: SafeStorage = safeStorage,
    private readonly log: LogWriter = writeLog
  ) {
    this.secretsPath = join(app.getPath('userData'), 'secrets.bin')
  }

  get = async (key: SecureKey): Promise<string | null> => {
    const encryptedValue = this.readEntries()[key]
    if (!encryptedValue) return null

    let decrypted: Awaited<ReturnType<SafeStorage['decryptStringAsync']>>
    try {
      decrypted = await this.encryption.decryptStringAsync(Buffer.from(encryptedValue, 'base64'))
    } catch {
      this.logFailure('Failed to read encrypted value', key, 'decrypt-failed')
      throw new SecureStorageError('STORAGE_FAILURE', 'Unable to read secure storage')
    }

    if (decrypted.shouldReEncrypt) await this.reEncrypt(key, encryptedValue, decrypted.result)
    return decrypted.result
  }

  set = async (key: SecureKey, value: string): Promise<void> => {
    if (!(await this.encryption.isAsyncEncryptionAvailable())) {
      this.logFailure('Secure storage write rejected because encryption is unavailable', key, 'encryption-unavailable')
      throw new SecureStorageError('ENCRYPTION_UNAVAILABLE', 'Secure storage encryption is unavailable')
    }

    try {
      // Encrypt before reading the file so the read-modify-write below stays
      // synchronous and concurrent writes cannot drop each other's entries.
      const encryptedValue = (await this.encryption.encryptStringAsync(value)).toString('base64')
      const entries = this.readEntries()
      entries[key] = encryptedValue
      this.writeEntries(entries)
    } catch (error) {
      if (error instanceof SecureStorageError) throw error

      this.logFailure('Failed to write encrypted value', key, 'store-failed')
      throw new SecureStorageError('STORAGE_FAILURE', 'Unable to write secure storage')
    }
  }

  /**
   * Names of the secure keys currently stored, without decrypting any values.
   * Used by the backup manifest so a backup can record what secure data exists
   * on the device without ever exporting the secrets themselves.
   */
  listPresentKeys = (): SecureKey[] => {
    try {
      return Object.keys(this.readEntries()) as SecureKey[]
    } catch {
      return []
    }
  }

  delete = (key: SecureKey): void => {
    try {
      const entries = this.readEntries()
      delete entries[key]
      this.writeEntries(entries)
    } catch (error) {
      if (error instanceof SecureStorageError) throw error

      this.logFailure('Failed to delete encrypted value', key, 'delete-failed')
      throw new SecureStorageError('STORAGE_FAILURE', 'Unable to update secure storage')
    }
  }

  /**
   * The OS key was rotated or upgraded since this value was written. The value
   * is still readable with the old key, so re-encrypting is best effort.
   */
  private reEncrypt = async (key: SecureKey, previous: string, value: string): Promise<void> => {
    try {
      const encryptedValue = (await this.encryption.encryptStringAsync(value)).toString('base64')
      const entries = this.readEntries()
      // A concurrent set replaced the value while it was being encrypted.
      if (entries[key] !== previous) return
      entries[key] = encryptedValue
      this.writeEntries(entries)
    } catch {
      // Keep the readable value written with the old key.
    }
  }

  private readEntries = (): PersistedEntries => {
    if (!existsSync(this.secretsPath)) return {}

    try {
      const persisted = JSON.parse(readFileSync(this.secretsPath, 'utf8')) as unknown
      return persistedSecretsSchema.parse(persisted).entries
    } catch {
      this.logFailure('Failed to parse secure storage file', undefined, 'invalid-file')
      throw new SecureStorageError('STORAGE_FAILURE', 'Unable to read secure storage')
    }
  }

  private writeEntries = (entries: PersistedEntries): void => {
    mkdirSync(dirname(this.secretsPath), { recursive: true })
    writeFileSync(
      this.secretsPath,
      JSON.stringify({
        version: SECRETS_FILE_VERSION,
        entries,
      }),
      { encoding: 'utf8', mode: 0o600 }
    )
  }

  private logFailure = (message: string, key: SecureKey | undefined, reason: string): void => {
    this.log({
      level: 'warn',
      message,
      context: redactContext({
        ...(key && { key }),
        reason,
      }),
      source: 'main',
    })
  }
}
