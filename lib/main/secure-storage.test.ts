import type { App, SafeStorage } from 'electron'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LogEntry } from './logger'
import { SecureStorage, SecureStorageError } from './secure-storage'

vi.mock('electron', () => ({
  safeStorage: {},
}))

const directories: string[] = []

const createUserDataDirectory = () => {
  const directory = mkdtempSync(join(tmpdir(), 'electron-starter-secure-storage-'))
  directories.push(directory)
  return directory
}

const createApp = (directory: string) =>
  ({
    getPath: vi.fn(() => directory),
  }) as unknown as Pick<App, 'getPath'>

const createEncryption = (encryptionAvailable = true, shouldReEncrypt = false) =>
  ({
    isAsyncEncryptionAvailable: vi.fn(async () => encryptionAvailable),
    encryptStringAsync: vi.fn(async (plainText: string) => Buffer.from([...plainText].reverse().join(''))),
    decryptStringAsync: vi.fn(async (encrypted: Buffer) => ({
      shouldReEncrypt,
      result: [...encrypted.toString()].reverse().join(''),
    })),
    getSelectedStorageBackend: vi.fn(() => 'unknown' as const),
    setUsePlainTextEncryption: vi.fn(),
  }) as unknown as SafeStorage

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('SecureStorage', () => {
  it('persists encrypted values in secrets.bin and decrypts them on read', async () => {
    const directory = createUserDataDirectory()
    const encryption = createEncryption()
    const store = new SecureStorage(createApp(directory), encryption)
    const secret = 'sk-live-original-value'

    await store.set('access-token', secret)

    const persisted = readFileSync(join(directory, 'secrets.bin'), 'utf8')
    expect(persisted).not.toContain(secret)
    await expect(store.get('access-token')).resolves.toBe(secret)
    expect(encryption.encryptStringAsync).toHaveBeenCalledWith(secret)
  })

  it('re-encrypts a value when the OS key has been rotated', async () => {
    const directory = createUserDataDirectory()
    const encryption = createEncryption(true, true)
    const store = new SecureStorage(createApp(directory), encryption)

    await store.set('access-token', 'rotated-value')
    vi.mocked(encryption.encryptStringAsync).mockClear()

    await expect(store.get('access-token')).resolves.toBe('rotated-value')
    expect(encryption.encryptStringAsync).toHaveBeenCalledWith('rotated-value')
  })

  it('does not let a re-encrypt overwrite a value set while it was encrypting', async () => {
    const directory = createUserDataDirectory()
    const encryption = createEncryption(true, true)
    const store = new SecureStorage(createApp(directory), encryption)
    await store.set('access-token', 'old-value')
    let releaseReEncrypt: (() => void) | undefined
    vi.mocked(encryption.encryptStringAsync).mockImplementationOnce(
      (plainText: string) =>
        new Promise((resolve) => {
          releaseReEncrypt = () => resolve(Buffer.from([...plainText].reverse().join('')))
        })
    )

    const read = store.get('access-token')
    await vi.waitFor(() => expect(releaseReEncrypt).toBeDefined())
    await store.set('access-token', 'new-value')
    releaseReEncrypt!()

    await expect(read).resolves.toBe('old-value')
    vi.mocked(encryption.decryptStringAsync).mockImplementation(async (encrypted: Buffer) => ({
      shouldReEncrypt: false,
      result: [...encrypted.toString()].reverse().join(''),
    }))
    await expect(store.get('access-token')).resolves.toBe('new-value')
  })

  it('lists present keys without decrypting any values', async () => {
    const directory = createUserDataDirectory()
    const encryption = createEncryption()
    const store = new SecureStorage(createApp(directory), encryption)

    expect(store.listPresentKeys()).toEqual([])

    await store.set('access-token', 'a')
    await store.set('demo-secret', 'b')

    expect(store.listPresentKeys().sort()).toEqual(['access-token', 'demo-secret'])
    // Listing must not decrypt.
    expect(encryption.decryptStringAsync).not.toHaveBeenCalled()
  })

  it('deletes stored secrets without requiring encryption to be available', async () => {
    const directory = createUserDataDirectory()
    const encryption = createEncryption()
    const store = new SecureStorage(createApp(directory), encryption)

    await store.set('refresh-token', 'refresh-value')
    vi.mocked(encryption.isAsyncEncryptionAvailable).mockResolvedValue(false)
    store.delete('refresh-token')

    await expect(store.get('refresh-token')).resolves.toBeNull()
  })

  it('rejects writes with a typed error when encryption is unavailable and never logs the payload', async () => {
    const directory = createUserDataDirectory()
    const entries: LogEntry[] = []
    const log = vi.fn((entry: LogEntry) => entries.push(entry))
    const store = new SecureStorage(createApp(directory), createEncryption(false), log)
    const secret = 'must-never-appear-in-logs'

    await expect(store.set('access-token', secret)).rejects.toThrowError(
      expect.objectContaining<Partial<SecureStorageError>>({ code: 'ENCRYPTION_UNAVAILABLE' })
    )
    expect(log).toHaveBeenCalledOnce()
    expect(entries[0]).toMatchObject({
      level: 'warn',
      context: { key: 'access-token', reason: 'encryption-unavailable' },
    })
    expect(JSON.stringify(entries)).not.toContain(secret)
  })

  it('does not log raw secret data when the encryption implementation throws it in an error', async () => {
    const directory = createUserDataDirectory()
    const entries: LogEntry[] = []
    const encryption = createEncryption()
    const secret = 'sensitive-encryption-input'
    vi.mocked(encryption.encryptStringAsync).mockRejectedValue(new Error(`cannot encrypt ${secret}`))

    const store = new SecureStorage(createApp(directory), encryption, (entry) => entries.push(entry))

    await expect(store.set('access-token', secret)).rejects.toThrowError(
      expect.objectContaining<Partial<SecureStorageError>>({ code: 'STORAGE_FAILURE' })
    )
    expect(entries[0]?.context).toEqual({ key: 'access-token', reason: 'store-failed' })
    expect(JSON.stringify(entries)).not.toContain(secret)
  })
})
