import { electronAPI } from '@electron-toolkit/preload'
import { toBridgeObject } from '@/lib/preload/shared'
import { AppApi } from './app-api'
import { FileApi } from './file-api'
import { LogsApi } from './logs-api'
import { NotificationApi } from './notification-api'
import { SecureApi } from './secure-api'
import { ShortcutApi } from './shortcut-api'
import { WindowApi } from './window-api'

// Each domain is flattened to a plain object of its methods before it reaches
// the contextBridge, so the page sees only `window.conveyor.<domain>.<method>`.
export const conveyor = Object.freeze({
  app: toBridgeObject(new AppApi(electronAPI)),
  file: toBridgeObject(new FileApi(electronAPI)),
  logs: toBridgeObject(new LogsApi(electronAPI)),
  notification: toBridgeObject(new NotificationApi(electronAPI)),
  secure: toBridgeObject(new SecureApi(electronAPI)),
  shortcut: toBridgeObject(new ShortcutApi(electronAPI)),
  window: toBridgeObject(new WindowApi(electronAPI)),
})

export type ConveyorApi = typeof conveyor
