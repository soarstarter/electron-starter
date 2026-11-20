import { describe, expect, it } from 'vitest'
import { validateArgs, validateEventPayload, validateReturn } from './index'

describe('Conveyor schema validation', () => {
  it('validates request and response data', () => {
    expect(validateArgs('set-settings', [{ theme: 'light' }])).toEqual([{ theme: 'light' }])

    const fullSettings = {
      theme: 'dark',
      accentColor: 'default',
      zoomLevel: 0,
      locale: 'system',
      launchAtLogin: false,
      minimizeToTray: false,
      notifications: true,
      proxy: { mode: 'system' },
      window: { menusVisible: true },
      shortcuts: {},
      recentFiles: [],
      onboardingCompleted: false,
      eulaAcceptedVersion: 0,
    }
    expect(validateReturn('get-settings', fullSettings)).toEqual(fullSettings)
  })

  it('rejects malformed request and response data', () => {
    expect(() => validateArgs('set-settings', [{ theme: 'purple' }])).toThrow()
    expect(() => validateArgs('set-settings', [{ proxy: { mode: 'banana' } }])).toThrow()
    expect(() => validateArgs('set-settings', [{ zoomLevel: 4 }])).toThrow()
    expect(() => validateReturn('get-settings', { theme: 'dark' })).toThrow()
  })

  it('validates named app-intent event payloads at the boundary', () => {
    expect(validateEventPayload('app-intent', { type: 'navigate', route: '/settings' })).toEqual({
      type: 'navigate',
      route: '/settings',
    })
    expect(() => validateEventPayload('app-intent', { type: 'navigate', route: '/account' })).toThrow()
    expect(() => validateEventPayload('app-intent', { type: 'navigate', route: 'https://example.com' })).toThrow()
  })

  it('accepts bounded log entries and rejects oversized payloads', () => {
    expect(validateArgs('app-log', [{ level: 'error', message: 'boom', context: { route: '/file' } }])).toEqual([
      { level: 'error', message: 'boom', context: { route: '/file' } },
    ])
    expect(() => validateArgs('app-log', [{ level: 'panic', message: 'boom' }])).toThrow()
    expect(() => validateArgs('app-log', [{ level: 'error', message: 'x'.repeat(2001) }])).toThrow()
    expect(() =>
      validateArgs('app-log', [{ level: 'error', message: 'boom', context: { value: 'x'.repeat(501) } }])
    ).toThrow()
  })

  it('accepts only enumerated secure storage keys and typed results', () => {
    expect(validateArgs('secure-set', ['access-token', 'secret-value'])).toEqual(['access-token', 'secret-value'])
    expect(() => validateArgs('secure-get', ['arbitrary-key'])).toThrow()
    expect(() => validateArgs('secure-get', ['unknown-session'])).toThrow()

    expect(validateReturn('secure-get', { ok: true, value: null })).toEqual({ ok: true, value: null })
    expect(
      validateReturn('secure-set', {
        ok: false,
        error: { code: 'ENCRYPTION_UNAVAILABLE', message: 'Secure storage encryption is unavailable' },
      })
    ).toEqual({
      ok: false,
      error: { code: 'ENCRYPTION_UNAVAILABLE', message: 'Secure storage encryption is unavailable' },
    })
  })

  it('validates diagnostics and logs channels', () => {
    const diagnostics = {
      app: { name: 'Electron Starter', version: '1.0.0', commitSha: 'abc1234', buildTime: '2026-06-14T00:00:00.000Z' },
      versions: { electron: '40.1.0', chromium: '130.0', node: '22.0.0', v8: '13.0' },
      os: { platform: 'darwin', release: '25.5.0', arch: 'arm64' },
      logPath: '/Users/test/Library/Logs/Electron Starter/main.log',
    }
    expect(validateReturn('app-get-diagnostics', diagnostics)).toEqual(diagnostics)
    expect(() => validateReturn('app-get-diagnostics', { app: { name: 'Electron Starter' } })).toThrow()

    expect(validateArgs('logs-get-path', [])).toEqual([])
    expect(validateReturn('logs-get-path', '/tmp/electron-starter/main.log')).toBe('/tmp/electron-starter/main.log')
    expect(validateReturn('logs-open-folder', '')).toBe('')
  })
})
