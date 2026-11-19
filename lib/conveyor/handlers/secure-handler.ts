import { handle } from '@/lib/main/shared'
import { SecureStorage, SecureStorageError } from '@/lib/main/secure-storage'

const secureFailure = (error: unknown) => {
  if (error instanceof SecureStorageError) {
    return {
      ok: false as const,
      error: {
        code: error.code,
        message: error.message,
      },
    }
  }

  return {
    ok: false as const,
    error: {
      code: 'STORAGE_FAILURE' as const,
      message: 'Secure storage operation failed',
    },
  }
}

export const registerSecureHandlers = (secureStorage: SecureStorage) => {
  handle('secure-get', async (_event, key) => {
    try {
      return { ok: true, value: await secureStorage.get(key) }
    } catch (error) {
      return secureFailure(error)
    }
  })

  handle('secure-set', async (_event, key, value) => {
    try {
      await secureStorage.set(key, value)
      return { ok: true }
    } catch (error) {
      return secureFailure(error)
    }
  })

  handle('secure-delete', (_event, key) => {
    try {
      secureStorage.delete(key)
      return { ok: true }
    } catch (error) {
      return secureFailure(error)
    }
  })
}
