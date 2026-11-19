import type { BrowserWindow } from 'electron'
import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import { AppIntentService } from './app-intents'

class FakeWebContents extends EventEmitter {
  readonly send = vi.fn()
  readonly isDestroyed = vi.fn(() => false)
}

class FakeWindow extends EventEmitter {
  readonly webContents = new FakeWebContents()
  readonly isDestroyed = vi.fn(() => false)
}

const asBrowserWindow = (window: FakeWindow) => window as unknown as BrowserWindow

describe('AppIntentService', () => {
  it('queues validated events until the renderer is ready and delivers each once', () => {
    const service = new AppIntentService()
    const window = new FakeWindow()
    service.attachPrimaryWindow(asBrowserWindow(window))

    service.dispatch({ type: 'navigate', route: '/settings' })
    expect(window.webContents.send).not.toHaveBeenCalled()

    service.rendererIsReady(asBrowserWindow(window))
    expect(window.webContents.send).toHaveBeenCalledTimes(1)
    expect(window.webContents.send).toHaveBeenCalledWith('app-intent', {
      type: 'navigate',
      route: '/settings',
    })

    service.rendererIsReady(asBrowserWindow(window))
    expect(window.webContents.send).toHaveBeenCalledTimes(1)
  })

  it('detaches the primary window when its web contents are destroyed', () => {
    const service = new AppIntentService()
    const window = new FakeWindow()
    const browserWindow = asBrowserWindow(window)
    service.attachPrimaryWindow(browserWindow)
    service.rendererIsReady(browserWindow)

    window.webContents.emit('destroyed')
    expect(() => service.rendererIsReady(browserWindow)).toThrow('Only the primary application window')
  })

  it('queues intents while the attached renderer is loading again', () => {
    const service = new AppIntentService()
    const window = new FakeWindow()
    const browserWindow = asBrowserWindow(window)
    service.attachPrimaryWindow(browserWindow)
    service.rendererIsReady(browserWindow)

    window.webContents.emit('did-start-navigation', { isMainFrame: true, isSameDocument: false })
    service.dispatch({ type: 'navigate', route: '/about' })

    expect(window.webContents.send).not.toHaveBeenCalled()

    service.rendererIsReady(browserWindow)
    expect(window.webContents.send).toHaveBeenCalledWith('app-intent', {
      type: 'navigate',
      route: '/about',
    })
  })

  it('continues delivering intents after same-document route navigation', () => {
    const service = new AppIntentService()
    const window = new FakeWindow()
    const browserWindow = asBrowserWindow(window)
    service.attachPrimaryWindow(browserWindow)
    service.rendererIsReady(browserWindow)

    window.webContents.emit('did-start-navigation', { isMainFrame: true, isSameDocument: true })
    service.dispatch({ type: 'navigate', route: '/settings' })

    expect(window.webContents.send).toHaveBeenCalledWith('app-intent', {
      type: 'navigate',
      route: '/settings',
    })
  })
})
