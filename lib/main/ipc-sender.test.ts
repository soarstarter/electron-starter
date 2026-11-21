import { describe, expect, it } from 'vitest'
import { ForbiddenIpcSenderError, isMainFrameOfWindow, resolveIpcSenderWindow, trustWindow } from './ipc-sender'

const createWindow = (webContentsId: number) => {
  let destroyed = false
  let onClosed: (() => void) | undefined
  const mainFrame = { name: `main-${webContentsId}` }
  return {
    window: {
      isDestroyed: () => destroyed,
      webContents: { id: webContentsId },
      once: (_event: 'closed', listener: () => void) => {
        onClosed = listener
      },
    },
    mainFrame,
    /** An IPC event sent by this window's main frame. */
    event: { sender: { id: webContentsId, mainFrame }, senderFrame: mainFrame as unknown },
    destroy: () => {
      destroyed = true
    },
    close: () => {
      destroyed = true
      onClosed?.()
    },
  }
}

const expectForbidden = (fn: () => unknown) =>
  expect(fn).toThrowError(expect.objectContaining({ code: 'FORBIDDEN_IPC_SENDER' }))

describe('isMainFrameOfWindow', () => {
  it('matches only the main frame of the window’s own webContents', () => {
    const { window, event, mainFrame } = createWindow(1)
    expect(isMainFrameOfWindow(event, window)).toBe(true)

    expect(isMainFrameOfWindow({ ...event, senderFrame: { name: 'child-iframe' } }, window)).toBe(false)
    expect(isMainFrameOfWindow({ ...event, senderFrame: null }, window)).toBe(false)
    expect(isMainFrameOfWindow({ sender: { id: 2, mainFrame }, senderFrame: mainFrame }, window)).toBe(false)
    expect(isMainFrameOfWindow(event, undefined)).toBe(false)
  })

  it('rejects a destroyed window and never throws on a torn-down sender', () => {
    const { window, event, destroy } = createWindow(1)
    destroy()
    expect(isMainFrameOfWindow(event, window)).toBe(false)

    const throwing = {
      sender: {
        id: 1,
        get mainFrame(): unknown {
          throw new Error('Object has been destroyed')
        },
      },
      senderFrame: {},
    }
    expect(isMainFrameOfWindow(throwing, createWindow(1).window)).toBe(false)
  })
})

describe('resolveIpcSenderWindow', () => {
  it('returns the trusted window for a main-frame request', () => {
    const { window, event } = createWindow(1)
    expect(resolveIpcSenderWindow(event, new Map([[1, window]]))).toBe(window)
  })

  it('rejects a request from a sub-frame of a trusted window', () => {
    const { window, event } = createWindow(1)
    expectForbidden(() => resolveIpcSenderWindow({ ...event, senderFrame: {} }, new Map([[1, window]])))
  })

  it('rejects a request from a destroyed window', () => {
    const { window, event, destroy } = createWindow(1)
    destroy()
    expectForbidden(() => resolveIpcSenderWindow(event, new Map([[1, window]])))
  })

  it('rejects webContents the application never registered', () => {
    const trusted = createWindow(1)
    // e.g. DevTools, a WebContentsView, or a webview hosted inside the window.
    const foreign = createWindow(99)
    expectForbidden(() => resolveIpcSenderWindow(foreign.event, new Map([[1, trusted.window]])))
    expectForbidden(() => resolveIpcSenderWindow(foreign.event, new Map()))
  })

  it('throws the dedicated error type', () => {
    expect(() => resolveIpcSenderWindow(createWindow(5).event, new Map())).toThrow(ForbiddenIpcSenderError)
  })
})

describe('trustWindow', () => {
  it('trusts every registered window independently and forgets a window once it closes', () => {
    const primary = createWindow(101)
    const secondary = createWindow(102)
    trustWindow(primary.window)
    trustWindow(secondary.window)

    expect(resolveIpcSenderWindow(primary.event)).toBe(primary.window)
    expect(resolveIpcSenderWindow(secondary.event)).toBe(secondary.window)

    secondary.close()
    expectForbidden(() => resolveIpcSenderWindow(secondary.event))
    expect(resolveIpcSenderWindow(primary.event)).toBe(primary.window)

    primary.close()
    expectForbidden(() => resolveIpcSenderWindow(primary.event))
  })
})
