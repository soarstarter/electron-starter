import { describe, expect, it } from 'vitest'
import { BACKUP_FORMAT_VERSION, buildBackup, parseBackup } from './backup'
import type { AppSettings } from './settings'

const SETTINGS: AppSettings = {
  theme: 'light',
  accentColor: 'blue',
  zoomLevel: 1,
  locale: 'en',
  launchAtLogin: false,
  minimizeToTray: false,
  notifications: true,
  proxy: { mode: 'system' },
  window: { menusVisible: true },
  shortcuts: {},
  recentFiles: ['/docs/a.txt'],
  onboardingCompleted: false,
  eulaAcceptedVersion: 0,
}

describe('backup', () => {
  it('builds a backup envelope carrying settings and a secure-key manifest', () => {
    const backup = buildBackup({
      appId: 'com.example.app',
      appVersion: '1.2.3',
      settingsVersion: 7,
      settings: SETTINGS,
      secureKeysPresent: ['access-token'],
      now: new Date('2026-06-15T00:00:00.000Z'),
    })

    expect(backup).toEqual({
      kind: 'settings-backup',
      formatVersion: BACKUP_FORMAT_VERSION,
      appId: 'com.example.app',
      appVersion: '1.2.3',
      exportedAt: '2026-06-15T00:00:00.000Z',
      settingsVersion: 7,
      settings: SETTINGS,
      secureKeysPresent: ['access-token'],
    })
  })

  it('round-trips through parseBackup', () => {
    const backup = buildBackup({
      appId: 'com.example.app',
      appVersion: '1.2.3',
      settingsVersion: 7,
      settings: SETTINGS,
      secureKeysPresent: [],
    })
    expect(parseBackup(JSON.parse(JSON.stringify(backup)))).toEqual(backup)
  })

  it('imports a backup carrying settings and secure keys this build does not know', () => {
    const backup = buildBackup({
      appId: 'com.example.app',
      appVersion: '1.2.3',
      settingsVersion: 10,
      settings: SETTINGS,
      secureKeysPresent: ['access-token'],
    })
    const raw = {
      ...JSON.parse(JSON.stringify(backup)),
      settings: { ...SETTINGS, retiredFlag: true },
      secureKeysPresent: ['access-token', 'retired-key'],
    }

    const parsed = parseBackup(raw)
    expect(parsed.settings).toEqual(SETTINGS)
    expect(parsed.secureKeysPresent).toEqual(['access-token'])
  })

  it('rejects a file with the wrong kind', () => {
    expect(() => parseBackup({ kind: 'not-a-backup' })).toThrow()
  })

  it('rejects a backup whose settings are malformed', () => {
    expect(() =>
      parseBackup({
        kind: 'settings-backup',
        formatVersion: 1,
        appId: 'x',
        appVersion: '1',
        exportedAt: 'now',
        settingsVersion: 7,
        settings: { theme: 'purple' },
        secureKeysPresent: [],
      })
    ).toThrow()
  })

  it('rejects a malformed secure key manifest', () => {
    expect(() =>
      parseBackup({
        kind: 'settings-backup',
        formatVersion: 1,
        appId: 'x',
        appVersion: '1',
        exportedAt: 'now',
        settingsVersion: 7,
        settings: SETTINGS,
        secureKeysPresent: [42],
      })
    ).toThrow()
  })
})
