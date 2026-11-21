import { beforeAll, describe, expect, it, vi } from 'vitest'

const exposed = vi.hoisted(() => ({ value: undefined as Record<string, unknown> | undefined, key: '' }))
const ipcRenderer = vi.hoisted(() => ({
  invoke: vi.fn(() => Promise.resolve()),
  send: vi.fn(),
  sendSync: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn(),
  postMessage: vi.fn(),
}))

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn((key: string, value: Record<string, unknown>) => {
      exposed.key = key
      exposed.value = value
    }),
  },
}))

vi.mock('@electron-toolkit/preload', () => ({ electronAPI: { ipcRenderer } }))

/**
 * Every method the page may call, per domain. Adding a method to a domain means
 * adding it here too, so a widened bridge is always a reviewed change.
 */
const ALLOWED_METHODS: Record<string, readonly string[]> = {
  app: [
    'version',
    'getSettings',
    'setSettings',
    'resetSettings',
    'readyForIntents',
    'onAppIntent',
    'log',
    'showLogs',
    'getDiagnostics',
    'getLocale',
    'setLocale',
    'exportData',
    'importData',
  ],
  file: ['openFile', 'openLastFile', 'openFilePath', 'saveFile', 'openImage'],
  logs: ['getPath', 'openFolder'],
  notification: ['notify'],
  secure: ['get', 'set', 'delete'],
  shortcut: ['list'],
  window: [
    'windowInit',
    'windowIsMinimizable',
    'windowIsMaximizable',
    'windowMinimize',
    'windowMaximize',
    'windowClose',
    'windowMaximizeToggle',
    'windowSetTitlebarDark',
    'webUndo',
    'webRedo',
    'webCut',
    'webCopy',
    'webPaste',
    'webDelete',
    'webSelectAll',
    'webReload',
    'webForceReload',
    'webToggleDevtools',
    'webActualSize',
    'webZoomIn',
    'webZoomOut',
    'webToggleFullscreen',
    'webOpenUrl',
  ],
}

/** Names that would hand the page a generic, any-channel IPC primitive. */
const FORBIDDEN_NAMES = ['renderer', 'invoke', 'subscribe', 'send', 'on', 'ipcRenderer']

describe('preload contextBridge surface', () => {
  beforeAll(async () => {
    await import('./preload')
  })

  it('exposes the conveyor global with exactly the allow-listed domains', () => {
    expect(exposed.key).toBe('conveyor')
    expect(Object.getOwnPropertyNames(exposed.value).sort()).toEqual(Object.keys(ALLOWED_METHODS).sort())
  })

  it.each(Object.entries(ALLOWED_METHODS))('%s exposes only its allow-listed methods', (domain, allowed) => {
    const api = exposed.value?.[domain] as Record<string, unknown>
    const names = Object.getOwnPropertyNames(api)

    expect(Object.getPrototypeOf(api)).toBe(Object.prototype)
    for (const name of FORBIDDEN_NAMES) expect(names).not.toContain(name)
    expect(names.sort()).toEqual([...allowed].sort())
    for (const name of names) expect(typeof api[name]).toBe('function')
  })

  it('routes a domain method to its own fixed channel', async () => {
    const app = exposed.value?.app as { version: () => Promise<unknown> }
    await app.version()
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('version')
  })
})
