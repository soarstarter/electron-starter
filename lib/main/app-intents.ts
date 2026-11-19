import type { BrowserWindow } from 'electron'
import { validateEventPayload, type AppIntent } from '@/lib/conveyor/schemas'

const APP_INTENT_EVENT = 'app-intent'

export class AppIntentService {
  private primaryWindow: BrowserWindow | undefined
  private rendererReady = false
  private readonly pendingIntents: AppIntent[] = []

  attachPrimaryWindow = (window: BrowserWindow): void => {
    this.primaryWindow = window
    this.rendererReady = false
    const webContents = window.webContents

    webContents.on('did-start-navigation', (details) => {
      if (this.primaryWindow === window && details.isMainFrame && !details.isSameDocument) {
        this.rendererReady = false
      }
    })

    webContents.once('destroyed', () => {
      if (this.primaryWindow === window) {
        this.primaryWindow = undefined
        this.rendererReady = false
      }
    })
  }

  dispatch = (intent: AppIntent): void => {
    const validatedIntent = validateEventPayload(APP_INTENT_EVENT, intent)
    this.pendingIntents.push(validatedIntent)
    this.deliverPendingIntents()
  }

  rendererIsReady = (window: BrowserWindow): void => {
    if (window !== this.primaryWindow) {
      throw new Error('Only the primary application window can receive app intents')
    }

    this.rendererReady = true
    this.deliverPendingIntents()
  }

  private deliverPendingIntents = (): void => {
    const window = this.primaryWindow
    if (!this.rendererReady || !window || window.isDestroyed() || window.webContents.isDestroyed()) {
      return
    }

    while (this.pendingIntents.length > 0) {
      const intent = this.pendingIntents.shift()
      if (intent) {
        window.webContents.send(APP_INTENT_EVENT, intent)
      }
    }
  }
}
