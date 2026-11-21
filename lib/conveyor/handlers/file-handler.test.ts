import path from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

type Handler = (event: unknown, ...args: unknown[]) => Promise<unknown>
const handlers = vi.hoisted(() => new Map<string, Handler>())

vi.mock('electron', () => ({ app: { addRecentDocument: vi.fn() }, dialog: {} }))
vi.mock('@/lib/main/shared', () => ({
  handle: (channel: string, handler: Handler) => handlers.set(channel, handler),
  getRequestingWindow: vi.fn(),
}))

const { registerFileHandlers } = await import('./file-handler')

let root: string
let recent: string
let other: string

const createStores = (recentFiles: string[]) => {
  const settingsStore = {
    get: () => ({ recentFiles }),
    addRecentFile: vi.fn(),
    removeRecentFile: vi.fn(),
  }
  const windowStateStore = { setLastOpenedPath: vi.fn(), getLastOpenedPath: vi.fn() }
  registerFileHandlers(windowStateStore as never, settingsStore as never)
  return { settingsStore, windowStateStore, openPath: (p: string) => handlers.get('file-open-path')!({}, p) }
}

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'file-handler-'))
  recent = path.join(root, 'recent.txt')
  other = path.join(root, 'other.txt')
  await writeFile(recent, 'recent contents')
  await writeFile(other, 'must not be readable')
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

beforeEach(() => {
  handlers.clear()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('file-open-path', () => {
  it('opens a file on the MRU list and records it as most recent', async () => {
    const { openPath, settingsStore, windowStateStore } = createStores([recent])
    await expect(openPath(recent)).resolves.toEqual({ canceled: false, path: recent, content: 'recent contents' })
    expect(settingsStore.addRecentFile).toHaveBeenCalledWith(recent)
    expect(windowStateStore.setLastOpenedPath).toHaveBeenCalledWith(recent)
  })

  it('rejects a path outside the MRU list without touching the list', async () => {
    const { openPath, settingsStore } = createStores([recent])
    await expect(openPath(other)).rejects.toThrow('recent files list')
    await expect(
      openPath(`${root}${path.sep}.${path.sep}..${path.sep}${path.basename(root)}/other.txt`)
    ).rejects.toThrow()
    expect(settingsStore.addRecentFile).not.toHaveBeenCalled()
    expect(settingsStore.removeRecentFile).not.toHaveBeenCalled()
  })

  it('prunes an MRU entry whose file has been deleted', async () => {
    const gone = path.join(root, 'gone.txt')
    const { openPath, settingsStore } = createStores([recent, gone])
    await expect(openPath(gone)).resolves.toEqual({ canceled: true, path: null, content: null })
    expect(settingsStore.removeRecentFile).toHaveBeenCalledWith(gone)
  })
})
