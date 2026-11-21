/**
 * Sender validation for every IPC request (Electron security checklist #17).
 *
 * A request is accepted only when it comes from the main frame of a window the
 * application itself created and registered with {@link trustWindow}. Requests
 * from sub-frames (iframes), from destroyed windows, or from any other
 * webContents (DevTools, a WebContentsView or webview hosting other content)
 * are rejected before a handler runs.
 *
 * This module deliberately avoids a runtime `electron` import so the checks can
 * be unit-tested with plain objects.
 */

export interface IpcSenderEvent {
  sender: { id: number; mainFrame: unknown }
  senderFrame: unknown
}

export interface IpcSenderWindow {
  isDestroyed(): boolean
  webContents: { id: number }
}

interface TrustableWindow extends IpcSenderWindow {
  once(event: 'closed', listener: () => void): unknown
}

export class ForbiddenIpcSenderError extends Error {
  readonly code = 'FORBIDDEN_IPC_SENDER'

  constructor(message = 'IPC request did not come from the main frame of an application window') {
    super(message)
    this.name = 'ForbiddenIpcSenderError'
  }
}

/**
 * True when `event` was sent by the main frame of `window`'s own webContents.
 * Never throws: a destroyed or torn-down sender simply does not match.
 */
export const isMainFrameOfWindow = (event: IpcSenderEvent, window: IpcSenderWindow | null | undefined): boolean => {
  try {
    if (!window || window.isDestroyed()) return false
    if (window.webContents.id !== event.sender.id) return false
    // senderFrame is null once the frame has navigated away or been destroyed.
    return event.senderFrame != null && event.senderFrame === event.sender.mainFrame
  } catch {
    return false
  }
}

/** webContents id → window, for every window the application created. */
const trustedWindows = new Map<number, IpcSenderWindow>()

/**
 * Registers an application window as a valid IPC sender. Call this for every
 * BrowserWindow the app creates (see `createAppWindow`); the registration is
 * dropped automatically when the window closes.
 */
export const trustWindow = <W extends TrustableWindow>(window: W): W => {
  const id = window.webContents.id
  trustedWindows.set(id, window)
  window.once('closed', () => {
    if (trustedWindows.get(id) === window) trustedWindows.delete(id)
  })
  return window
}

/**
 * Returns the trusted window that sent `event`, or throws
 * {@link ForbiddenIpcSenderError}.
 */
export const resolveIpcSenderWindow = <W extends IpcSenderWindow = IpcSenderWindow>(
  event: IpcSenderEvent,
  registry: ReadonlyMap<number, W> = trustedWindows as unknown as ReadonlyMap<number, W>
): W => {
  const window = registry.get(event.sender.id)
  if (!window || !isMainFrameOfWindow(event, window)) throw new ForbiddenIpcSenderError()
  return window
}
