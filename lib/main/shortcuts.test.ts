import type { GlobalShortcut } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppSettings } from './settings'
import type { LogEntry } from './logger'
import { DEFAULT_SHORTCUTS, ShortcutRegistry, resolveForPlatform, type ShortcutDefinition } from './shortcuts'

vi.mock('electron', () => ({
  globalShortcut: {},
}))

const DEFAULT_SETTINGS = {
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
} satisfies AppSettings

const createGlobalShortcut = (registerResult = true) =>
  ({
    register: vi.fn(() => registerResult),
    unregister: vi.fn(),
    unregisterAll: vi.fn(),
    isRegistered: vi.fn(() => false),
  }) as unknown as GlobalShortcut

interface RegistryHarness {
  registry: ShortcutRegistry
  entries: LogEntry[]
  shortcutApi: GlobalShortcut
}

const createRegistry = (options?: {
  shortcuts?: Record<string, string>
  definitions?: readonly ShortcutDefinition[]
  platform?: NodeJS.Platform
  registerResult?: boolean
}): RegistryHarness => {
  const entries: LogEntry[] = []
  const shortcutApi = createGlobalShortcut(options?.registerResult ?? true)
  const registry = new ShortcutRegistry(
    { get: () => ({ ...DEFAULT_SETTINGS, shortcuts: options?.shortcuts ?? {} }) },
    options?.definitions ?? DEFAULT_SHORTCUTS,
    shortcutApi,
    () => options?.platform ?? 'linux',
    (entry) => entries.push(entry)
  )
  return { registry, entries, shortcutApi }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ShortcutRegistry', () => {
  it('returns the default accelerator when there is no user override', () => {
    const { registry } = createRegistry()
    expect(registry.get('nav.settings')).toBe('CmdOrCtrl+,')
  })

  it('returns the user override when present', () => {
    const { registry } = createRegistry({ shortcuts: { 'nav.settings': 'CmdOrCtrl+;' } })
    expect(registry.get('nav.settings')).toBe('CmdOrCtrl+;')
  })

  it('returns undefined for unknown ids without throwing', () => {
    const { registry } = createRegistry()
    expect(registry.get('does-not-exist')).toBeUndefined()
  })

  it('resolves CmdOrCtrl based on the host platform in list()', () => {
    const { registry } = createRegistry({ platform: 'darwin' })
    const home = registry.list().find((entry) => entry.id === 'nav.home')
    expect(home?.accelerator).toBe('Cmd+1')

    const { registry: linux } = createRegistry({ platform: 'linux' })
    const linuxHome = linux.list().find((entry) => entry.id === 'nav.home')
    expect(linuxHome?.accelerator).toBe('Ctrl+1')
  })

  it('warns once when two shortcut ids resolve to the same accelerator', () => {
    const definitions: ShortcutDefinition[] = [
      { id: 'a', defaultAccelerator: 'CmdOrCtrl+1', scope: 'menu', description: 'A' },
      { id: 'b', defaultAccelerator: 'CmdOrCtrl+1', scope: 'menu', description: 'B' },
      { id: 'c', defaultAccelerator: 'CmdOrCtrl+2', scope: 'menu', description: 'C' },
    ]
    const { registry, entries } = createRegistry({ definitions, platform: 'linux' })

    registry.validateAtStartup()

    const conflict = entries.find((entry) => entry.message === 'Shortcut accelerator is bound to multiple ids')
    expect(conflict?.context).toEqual({ accelerator: 'Ctrl+1', ids: 'a,b' })
    expect(entries).toHaveLength(1)
  })

  it('refuses to register non-global shortcuts as global hotkeys', () => {
    const { registry, entries, shortcutApi } = createRegistry()
    const handler = vi.fn()

    expect(registry.registerGlobal('palette.open', handler)).toBe(false)
    expect(shortcutApi.register).not.toHaveBeenCalled()
    expect(entries[0]?.message).toBe('Refused to register non-global shortcut as a global hotkey')
  })

  it('registers global hotkeys with the platform-resolved accelerator', () => {
    const definitions: ShortcutDefinition[] = [
      { id: 'global.quick-add', defaultAccelerator: 'CmdOrCtrl+Alt+N', scope: 'global', description: 'Quick add' },
    ]
    const { registry, shortcutApi } = createRegistry({ definitions, platform: 'darwin' })
    const handler = vi.fn()

    expect(registry.registerGlobal('global.quick-add', handler)).toBe(true)
    expect(shortcutApi.register).toHaveBeenCalledWith('Cmd+Alt+N', handler)
  })

  it('unregisters previously bound globals before re-registering the same id', () => {
    const definitions: ShortcutDefinition[] = [
      { id: 'global.x', defaultAccelerator: 'CmdOrCtrl+Alt+X', scope: 'global', description: 'X' },
    ]
    const { registry, shortcutApi } = createRegistry({ definitions, platform: 'linux' })

    registry.registerGlobal('global.x', vi.fn())
    registry.registerGlobal('global.x', vi.fn())

    expect(shortcutApi.unregister).toHaveBeenCalledWith('Ctrl+Alt+X')
  })

  it('logs a warning when register() reports failure', () => {
    const definitions: ShortcutDefinition[] = [
      { id: 'global.busy', defaultAccelerator: 'CmdOrCtrl+Alt+B', scope: 'global', description: 'Busy' },
    ]
    const { registry, entries } = createRegistry({ definitions, platform: 'linux', registerResult: false })

    expect(registry.registerGlobal('global.busy', vi.fn())).toBe(false)
    expect(entries[0]?.context).toMatchObject({ id: 'global.busy', accelerator: 'Ctrl+Alt+B' })
  })
})

describe('resolveForPlatform', () => {
  it('rewrites every CmdOrCtrl occurrence', () => {
    expect(resolveForPlatform('CmdOrCtrl+Shift+CmdOrCtrl+X', 'darwin')).toBe('Cmd+Shift+Cmd+X')
    expect(resolveForPlatform('CmdOrCtrl+Shift+CmdOrCtrl+X', 'linux')).toBe('Ctrl+Shift+Ctrl+X')
  })

  it('leaves accelerators without CmdOrCtrl unchanged', () => {
    expect(resolveForPlatform('Alt+F4', 'win32')).toBe('Alt+F4')
  })
})
