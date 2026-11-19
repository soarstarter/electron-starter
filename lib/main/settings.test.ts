import type { App } from 'electron'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clampZoomLevel, pushRecentFile, SettingsStore, type AppSettings } from './settings'

const directories: string[] = []

const createUserDataDirectory = () => {
  const directory = mkdtempSync(join(tmpdir(), 'electron-starter-settings-'))
  directories.push(directory)
  return directory
}

const createStore = (directory: string) =>
  new SettingsStore({
    getPath: vi.fn(() => directory),
  } as unknown as App)

const readPersistedSettings = (directory: string) =>
  JSON.parse(readFileSync(join(directory, 'settings.json'), 'utf8')) as { version: number; settings: AppSettings }

const DEFAULTS: AppSettings = {
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

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('SettingsStore', () => {
  it('writes defaults under the current envelope version on first load', () => {
    const directory = createUserDataDirectory()
    const store = createStore(directory)

    expect(store.get()).toEqual(DEFAULTS)
    expect(readPersistedSettings(directory)).toEqual({ version: 10, settings: DEFAULTS })
  })

  it('persists patches and reloads them on construction', () => {
    const directory = createUserDataDirectory()
    const store = createStore(directory)

    store.update({ theme: 'light', notifications: false })

    const reloaded = createStore(directory).get()
    expect(reloaded.theme).toBe('light')
    expect(reloaded.notifications).toBe(false)
  })

  it('persists bounded zoom level changes', () => {
    const directory = createUserDataDirectory()
    const store = createStore(directory)

    store.update({ zoomLevel: 1.5 })

    expect(store.get().zoomLevel).toBe(1.5)
    expect(createStore(directory).get().zoomLevel).toBe(1.5)
  })

  it('clamps zoom levels to the supported range', () => {
    expect(clampZoomLevel(-99)).toBe(-3)
    expect(clampZoomLevel(99)).toBe(3)
    expect(clampZoomLevel(1.5)).toBe(1.5)
  })

  it('deep-merges the proxy section instead of replacing it', () => {
    const directory = createUserDataDirectory()
    const store = createStore(directory)

    store.update({ proxy: { mode: 'custom', url: 'http://proxy.local:8080' } })
    store.update({ proxy: { url: 'http://proxy.local:9090' } })

    expect(store.get().proxy).toEqual({ mode: 'custom', url: 'http://proxy.local:9090' })
  })

  it('preserves window.menusVisible when patching unrelated keys', () => {
    const directory = createUserDataDirectory()
    const store = createStore(directory)

    store.update({ window: { menusVisible: false } })
    store.update({ theme: 'light' })

    expect(store.get().window).toEqual({ menusVisible: false })
  })

  it('clears proxy.url and dataDir when patched with null', () => {
    const directory = createUserDataDirectory()
    const store = createStore(directory)

    store.update({ proxy: { mode: 'custom', url: 'http://x.local:1' }, dataDir: '/tmp/electron-starter' })
    expect(store.get().proxy.url).toBe('http://x.local:1')
    expect(store.get().dataDir).toBe('/tmp/electron-starter')

    store.update({ proxy: { url: null }, dataDir: null })
    expect(store.get().proxy.url).toBeUndefined()
    expect(store.get().dataDir).toBeUndefined()
  })

  it('restore() replaces the whole settings object and persists it', () => {
    const directory = createUserDataDirectory()
    const store = createStore(directory)

    const restored: AppSettings = {
      ...DEFAULTS,
      theme: 'light',
      accentColor: 'blue',
      recentFiles: ['/docs/a.txt'],
    }
    store.restore(restored)

    expect(store.get()).toEqual(restored)
    expect(createStore(directory).get()).toEqual(restored)
  })

  it('reset() restores defaults and persists them', () => {
    const directory = createUserDataDirectory()
    const store = createStore(directory)

    store.update({ theme: 'light', notifications: false })
    store.reset()

    expect(store.get()).toEqual(DEFAULTS)
    expect(readPersistedSettings(directory).settings).toEqual(DEFAULTS)
  })

  it('drops keys the schema does not know instead of rejecting the file', () => {
    const directory = createUserDataDirectory()
    writeFileSync(
      join(directory, 'settings.json'),
      JSON.stringify({
        version: 10,
        settings: { ...DEFAULTS, theme: 'light', retiredFlag: true, retiredChannel: 'latest' },
      }),
      'utf8'
    )

    const store = createStore(directory)
    expect(store.get()).toEqual({ ...DEFAULTS, theme: 'light' })
    expect(store.get()).not.toHaveProperty('retiredFlag')
  })

  it('migrates a v1 envelope forward by filling in new defaults', () => {
    const directory = createUserDataDirectory()
    writeFileSync(
      join(directory, 'settings.json'),
      JSON.stringify({ version: 1, settings: { theme: 'system', window: { menusVisible: false } } }),
      'utf8'
    )

    const store = createStore(directory)
    expect(store.get()).toEqual({
      ...DEFAULTS,
      theme: 'system',
      window: { menusVisible: false },
    })

    const persisted = readPersistedSettings(directory)
    expect(persisted.version).toBe(10)
    expect(persisted.settings.locale).toBe('system')
    expect(persisted.settings.notifications).toBe(true)
  })

  it('migrates a v2 envelope through the pass-through step', () => {
    const directory = createUserDataDirectory()
    const { shortcuts: _shortcuts, ...v2Settings } = DEFAULTS
    writeFileSync(join(directory, 'settings.json'), JSON.stringify({ version: 2, settings: v2Settings }), 'utf8')

    const store = createStore(directory)
    expect(store.get().shortcuts).toEqual({})
    expect(readPersistedSettings(directory).version).toBe(10)
  })

  it('migrates a v3 envelope by introducing an empty shortcut override map', () => {
    const directory = createUserDataDirectory()
    const { shortcuts: _shortcuts, ...v3Settings } = DEFAULTS
    writeFileSync(join(directory, 'settings.json'), JSON.stringify({ version: 3, settings: v3Settings }), 'utf8')

    const store = createStore(directory)
    expect(store.get().shortcuts).toEqual({})
    expect(readPersistedSettings(directory).version).toBe(10)
  })

  it('migrates a v4 envelope through the pass-through step', () => {
    const directory = createUserDataDirectory()
    const { recentFiles: _recentFiles, ...v4Settings } = DEFAULTS
    writeFileSync(join(directory, 'settings.json'), JSON.stringify({ version: 4, settings: v4Settings }), 'utf8')

    const store = createStore(directory)
    expect(store.get().recentFiles).toEqual([])
    expect(readPersistedSettings(directory).version).toBe(10)
  })

  it('migrates a v5 envelope by introducing an empty recent-files list', () => {
    const directory = createUserDataDirectory()
    const { recentFiles: _recentFiles, accentColor: _accentColor, ...v5Settings } = DEFAULTS
    writeFileSync(join(directory, 'settings.json'), JSON.stringify({ version: 5, settings: v5Settings }), 'utf8')

    const store = createStore(directory)
    expect(store.get().recentFiles).toEqual([])
    expect(readPersistedSettings(directory).version).toBe(10)
  })

  it('migrates a v6 envelope through the pass-through step', () => {
    const directory = createUserDataDirectory()
    const { accentColor: _accentColor, ...v6Settings } = DEFAULTS
    writeFileSync(join(directory, 'settings.json'), JSON.stringify({ version: 6, settings: v6Settings }), 'utf8')

    const store = createStore(directory)
    expect(store.get().accentColor).toBe('default')
    expect(readPersistedSettings(directory).version).toBe(10)
  })

  it('migrates a v7 envelope by defaulting the accent color', () => {
    const directory = createUserDataDirectory()
    const { accentColor: _accentColor, ...v7Settings } = DEFAULTS
    writeFileSync(join(directory, 'settings.json'), JSON.stringify({ version: 7, settings: v7Settings }), 'utf8')

    const store = createStore(directory)
    expect(store.get().accentColor).toBe('default')
    expect(readPersistedSettings(directory).version).toBe(10)
  })

  it('migrates a v8 envelope by resetting onboarding state', () => {
    const directory = createUserDataDirectory()
    const {
      onboardingCompleted: _onboardingCompleted,
      eulaAcceptedVersion: _eulaAcceptedVersion,
      ...v8Settings
    } = DEFAULTS
    writeFileSync(join(directory, 'settings.json'), JSON.stringify({ version: 8, settings: v8Settings }), 'utf8')

    const store = createStore(directory)
    expect(store.get().onboardingCompleted).toBe(false)
    expect(store.get().eulaAcceptedVersion).toBe(0)
    expect(readPersistedSettings(directory).version).toBe(10)
  })

  it('migrates a v9 envelope by defaulting the zoom level', () => {
    const directory = createUserDataDirectory()
    const { zoomLevel: _zoomLevel, ...v9Settings } = DEFAULTS
    writeFileSync(join(directory, 'settings.json'), JSON.stringify({ version: 9, settings: v9Settings }), 'utf8')

    const store = createStore(directory)
    expect(store.get().zoomLevel).toBe(0)
    expect(readPersistedSettings(directory).version).toBe(10)
  })

  describe('recent files', () => {
    it('prepends newest-first, dedupes, and caps at 10 (pushRecentFile)', () => {
      let list: string[] = []
      for (let i = 1; i <= 12; i++) {
        list = pushRecentFile(list, `/docs/file-${i}.txt`)
      }
      expect(list).toHaveLength(10)
      expect(list[0]).toBe('/docs/file-12.txt')
      expect(list).not.toContain('/docs/file-1.txt')
      expect(list).not.toContain('/docs/file-2.txt')

      // Re-opening an existing entry moves it to the front without duplicating.
      const moved = pushRecentFile(list, '/docs/file-5.txt')
      expect(moved[0]).toBe('/docs/file-5.txt')
      expect(moved.filter((p) => p === '/docs/file-5.txt')).toHaveLength(1)
      expect(moved).toHaveLength(10)
    })

    it('ignores blank paths', () => {
      expect(pushRecentFile(['/a.txt'], '   ')).toEqual(['/a.txt'])
    })

    it('addRecentFile persists the MRU list and reloads it', () => {
      const directory = createUserDataDirectory()
      const store = createStore(directory)

      store.addRecentFile('/docs/a.txt')
      store.addRecentFile('/docs/b.txt')

      expect(store.get().recentFiles).toEqual(['/docs/b.txt', '/docs/a.txt'])
      expect(createStore(directory).get().recentFiles).toEqual(['/docs/b.txt', '/docs/a.txt'])
    })

    it('removeRecentFile drops a stale entry and is a no-op when absent', () => {
      const directory = createUserDataDirectory()
      const store = createStore(directory)

      store.addRecentFile('/docs/a.txt')
      store.addRecentFile('/docs/b.txt')
      store.removeRecentFile('/docs/a.txt')
      expect(store.get().recentFiles).toEqual(['/docs/b.txt'])

      const before = store.get()
      expect(store.removeRecentFile('/docs/missing.txt')).toBe(before)
    })

    it('clears the list when patched with an empty array', () => {
      const directory = createUserDataDirectory()
      const store = createStore(directory)

      store.addRecentFile('/docs/a.txt')
      store.update({ recentFiles: [] })
      expect(store.get().recentFiles).toEqual([])
    })
  })

  it('migrates the legacy unversioned format without losing values', () => {
    const directory = createUserDataDirectory()
    writeFileSync(
      join(directory, 'settings.json'),
      JSON.stringify({ theme: 'system', window: { menusVisible: false } }),
      'utf8'
    )

    expect(createStore(directory).get()).toEqual({
      ...DEFAULTS,
      theme: 'system',
      window: { menusVisible: false },
    })
    expect(readPersistedSettings(directory).version).toBe(10)
  })

  it('falls back to defaults when the stored version is newer than supported', () => {
    const directory = createUserDataDirectory()
    writeFileSync(
      join(directory, 'settings.json'),
      JSON.stringify({ version: 99, settings: { theme: 'light' } }),
      'utf8'
    )

    const store = createStore(directory)
    expect(store.get()).toEqual(DEFAULTS)
  })
})
