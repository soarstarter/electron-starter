import { globalShortcut, type GlobalShortcut } from 'electron'
import type { SettingsStore } from './settings'
import { writeLog, type LogEntry } from './logger'

export type ShortcutScope = 'menu' | 'global' | 'in-window'

export interface ShortcutDefinition {
  id: string
  defaultAccelerator: string
  scope: ShortcutScope
  description: string
}

export interface ResolvedShortcut {
  id: string
  accelerator: string
  scope: ShortcutScope
  description: string
}

type SettingsReader = Pick<SettingsStore, 'get'>
type LogWriter = (entry: LogEntry) => void
type PlatformProbe = () => NodeJS.Platform

// Built-in shortcuts. Phase 3.4 only seeds menu accelerators and the future
// command-palette key; apps can extend at construction time.
export const DEFAULT_SHORTCUTS: readonly ShortcutDefinition[] = [
  { id: 'nav.home', defaultAccelerator: 'CmdOrCtrl+1', scope: 'menu', description: 'Open Home' },
  { id: 'nav.open-file', defaultAccelerator: 'CmdOrCtrl+O', scope: 'menu', description: 'Open File' },
  { id: 'nav.settings', defaultAccelerator: 'CmdOrCtrl+,', scope: 'menu', description: 'Open Settings' },
  {
    id: 'palette.open',
    defaultAccelerator: 'CmdOrCtrl+K',
    scope: 'in-window',
    description: 'Open Command Palette',
  },
]

export const resolveForPlatform = (accelerator: string, platform: NodeJS.Platform): string =>
  accelerator.replace(/CmdOrCtrl/g, platform === 'darwin' ? 'Cmd' : 'Ctrl')

export class ShortcutRegistry {
  private registeredGlobals = new Map<string, string>()

  constructor(
    private readonly settingsStore: SettingsReader,
    private readonly definitions: readonly ShortcutDefinition[] = DEFAULT_SHORTCUTS,
    private readonly globalShortcutApi: GlobalShortcut = globalShortcut,
    private readonly platform: PlatformProbe = () => process.platform,
    private readonly log: LogWriter = writeLog
  ) {}

  get = (id: string): string | undefined => {
    const definition = this.definitions.find((entry) => entry.id === id)
    if (!definition) return undefined
    const override = this.settingsStore.get().shortcuts[id]
    return override ?? definition.defaultAccelerator
  }

  list = (): ResolvedShortcut[] =>
    this.definitions.map((definition) => ({
      id: definition.id,
      accelerator: resolveForPlatform(this.get(definition.id) ?? definition.defaultAccelerator, this.platform()),
      scope: definition.scope,
      description: definition.description,
    }))

  validateAtStartup = (): void => {
    const byAccelerator = new Map<string, string[]>()
    for (const resolved of this.list()) {
      const ids = byAccelerator.get(resolved.accelerator) ?? []
      ids.push(resolved.id)
      byAccelerator.set(resolved.accelerator, ids)
    }

    for (const [accelerator, ids] of byAccelerator) {
      if (ids.length > 1) {
        this.log({
          level: 'warn',
          message: 'Shortcut accelerator is bound to multiple ids',
          context: { accelerator, ids: ids.join(',') },
          source: 'main',
        })
      }
    }
  }

  registerGlobal = (id: string, handler: () => void): boolean => {
    const definition = this.definitions.find((entry) => entry.id === id)
    if (!definition || definition.scope !== 'global') {
      this.log({
        level: 'warn',
        message: 'Refused to register non-global shortcut as a global hotkey',
        context: { id },
        source: 'main',
      })
      return false
    }

    const accelerator = resolveForPlatform(this.get(id) ?? definition.defaultAccelerator, this.platform())
    const previous = this.registeredGlobals.get(id)
    if (previous) this.globalShortcutApi.unregister(previous)

    const ok = this.globalShortcutApi.register(accelerator, handler)
    if (!ok) {
      this.log({
        level: 'warn',
        message: 'Failed to register global shortcut',
        context: { id, accelerator },
        source: 'main',
      })
      return false
    }
    this.registeredGlobals.set(id, accelerator)
    return true
  }

  unregisterAllGlobals = (): void => {
    for (const accelerator of this.registeredGlobals.values()) {
      this.globalShortcutApi.unregister(accelerator)
    }
    this.registeredGlobals.clear()
  }
}
