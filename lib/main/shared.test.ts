import { beforeEach, describe, expect, it, vi } from 'vitest'

type Listener = (event: unknown, ...args: unknown[]) => Promise<unknown>
const listeners = vi.hoisted(() => new Map<string, Listener>())

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, listener: Listener) => {
      listeners.set(channel, listener)
    }),
  },
}))

const { getRequestingWindow, handle } = await import('./shared')
const { trustWindow } = await import('./ipc-sender')

let nextWebContentsId = 1_000

const createTrustedWindow = (id: number = nextWebContentsId++) => {
  let onClosed: (() => void) | undefined
  let destroyed = false
  const mainFrame = {}
  const window = {
    isDestroyed: () => destroyed,
    webContents: { id },
    once: (_event: 'closed', listener: () => void) => {
      onClosed = listener
    },
  }
  trustWindow(window)
  return {
    window,
    event: { sender: { id, mainFrame }, senderFrame: mainFrame as unknown },
    destroy: () => {
      destroyed = true
    },
    close: () => {
      destroyed = true
      onClosed?.()
    },
  }
}

describe('handle() sender validation', () => {
  beforeEach(() => {
    listeners.clear()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('runs the handler for the main frame of a trusted window', async () => {
    const { event } = createTrustedWindow(201)
    const handler = vi.fn(() => '1.0.0')
    handle('version', handler)

    await expect(listeners.get('version')!(event)).resolves.toBe('1.0.0')
    expect(handler).toHaveBeenCalledOnce()
  })

  it.each([
    ['a sub-frame', (t: ReturnType<typeof createTrustedWindow>) => ({ ...t.event, senderFrame: {} })],
    ['an unknown webContents', () => ({ sender: { id: 999, mainFrame: {} }, senderFrame: {} })],
    [
      'a destroyed window',
      (t: ReturnType<typeof createTrustedWindow>) => {
        t.destroy()
        return t.event
      },
    ],
    [
      'a closed window',
      (t: ReturnType<typeof createTrustedWindow>) => {
        t.close()
        return t.event
      },
    ],
  ])('rejects a request from %s without calling the handler', async (_label, makeEvent) => {
    const trusted = createTrustedWindow()
    const handler = vi.fn(() => '1.0.0')
    handle('version', handler)

    await expect(listeners.get('version')!(makeEvent(trusted))).rejects.toMatchObject({
      code: 'FORBIDDEN_IPC_SENDER',
    })
    expect(handler).not.toHaveBeenCalled()
  })

  it('checks the sender before parsing arguments', async () => {
    const handler = vi.fn()
    handle('web-open-url', handler)

    await expect(
      listeners.get('web-open-url')!({ sender: { id: 998, mainFrame: {} }, senderFrame: {} }, 42)
    ).rejects.toMatchObject({ code: 'FORBIDDEN_IPC_SENDER' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('applies the same check to dev-only channels', async () => {
    const handler = vi.fn()
    handle('web-reload', handler)

    await expect(
      listeners.get('web-reload')!({ sender: { id: 997, mainFrame: {} }, senderFrame: {} })
    ).rejects.toMatchObject({ code: 'FORBIDDEN_IPC_SENDER' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('getRequestingWindow returns the window that sent the request', () => {
    const first = createTrustedWindow(301)
    const second = createTrustedWindow(302)
    expect(getRequestingWindow(first.event as never)).toBe(first.window)
    expect(getRequestingWindow(second.event as never)).toBe(second.window)
  })
})
