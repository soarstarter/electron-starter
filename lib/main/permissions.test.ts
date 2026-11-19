import { describe, expect, it, vi } from 'vitest'
import { ALLOWED_RENDERER_PERMISSIONS, isRendererPermissionAllowed, registerPermissionHandlers } from './permissions'

vi.mock('electron', () => ({
  session: {
    defaultSession: {
      setPermissionCheckHandler: vi.fn(),
      setPermissionRequestHandler: vi.fn(),
    },
  },
}))

describe('isRendererPermissionAllowed', () => {
  it('starts with an empty allowlist', () => {
    expect(ALLOWED_RENDERER_PERMISSIONS).toEqual([])
  })

  it.each(['camera', 'clipboard-read', 'geolocation', 'media', 'microphone', 'notifications', 'openExternal'])(
    'denies %s permission by default',
    (permission) => {
      expect(isRendererPermissionAllowed(permission)).toBe(false)
    }
  )
})

describe('registerPermissionHandlers', () => {
  it('registers deny-by-default request and check handlers', () => {
    const setPermissionCheckHandler = vi.fn()
    const setPermissionRequestHandler = vi.fn()

    registerPermissionHandlers({
      setPermissionCheckHandler,
      setPermissionRequestHandler,
    } as never)

    expect(setPermissionRequestHandler).toHaveBeenCalledOnce()
    expect(setPermissionCheckHandler).toHaveBeenCalledOnce()

    const requestHandler = setPermissionRequestHandler.mock.calls[0]?.[0]
    const checkHandler = setPermissionCheckHandler.mock.calls[0]?.[0]
    const callback = vi.fn()

    requestHandler(undefined, 'media', callback, {})

    expect(callback).toHaveBeenCalledWith(false)
    expect(checkHandler(undefined, 'geolocation', 'https://example.com', {})).toBe(false)
  })
})
