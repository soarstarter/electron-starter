import type { App } from 'electron'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WindowStateStore } from './window-state'

vi.mock('electron', () => ({
  screen: {
    getPrimaryDisplay: () => ({
      workArea: { x: 0, y: 0, width: 1440, height: 900 },
    }),
    getAllDisplays: () => [
      {
        workArea: { x: 0, y: 0, width: 1440, height: 900 },
      },
    ],
  },
}))

const directories: string[] = []

const createUserDataDirectory = () => {
  const directory = mkdtempSync(join(tmpdir(), 'electron-starter-window-state-'))
  directories.push(directory)
  return directory
}

const createStore = (directory: string) =>
  new WindowStateStore({
    getPath: vi.fn(() => directory),
  } as unknown as App)

const readPersistedState = (directory: string) => JSON.parse(readFileSync(join(directory, 'window-state.json'), 'utf8'))

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('WindowStateStore', () => {
  it('writes defaults including non-maximized state on first load', () => {
    const directory = createUserDataDirectory()
    const store = createStore(directory)

    expect(store.getIsMaximized()).toBe(false)
    expect(readPersistedState(directory)).toMatchObject({
      bounds: null,
      isMaximized: false,
      lastOpenedPath: null,
    })
  })

  it('persists maximized state separately from bounds', () => {
    const directory = createUserDataDirectory()
    const store = createStore(directory)

    store.setBounds({ x: 20, y: 30, width: 1000, height: 700 })
    store.setIsMaximized(true)

    expect(createStore(directory).getIsMaximized()).toBe(true)
    expect(createStore(directory).getBounds({ width: 900, height: 670 })).toEqual({
      x: 20,
      y: 30,
      width: 1000,
      height: 700,
    })
  })

  it('loads an old state file without a maximized field', () => {
    const directory = createUserDataDirectory()
    writeFileSync(
      join(directory, 'window-state.json'),
      JSON.stringify({
        bounds: { x: 40, y: 50, width: 900, height: 670 },
        lastOpenedPath: '/docs/a.txt',
      }),
      'utf8'
    )

    const store = createStore(directory)

    expect(store.getIsMaximized()).toBe(false)
    expect(store.getBounds({ width: 900, height: 670 })).toEqual({ x: 40, y: 50, width: 900, height: 670 })
  })
})
