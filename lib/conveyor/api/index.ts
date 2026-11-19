import { electronAPI } from '@electron-toolkit/preload'
import { AppApi } from './app-api'
import { FileApi } from './file-api'
import { LogsApi } from './logs-api'
import { NotificationApi } from './notification-api'
import { SecureApi } from './secure-api'
import { ShortcutApi } from './shortcut-api'
import { WindowApi } from './window-api'

export const conveyor = {
  app: new AppApi(electronAPI),
  file: new FileApi(electronAPI),
  logs: new LogsApi(electronAPI),
  notification: new NotificationApi(electronAPI),
  secure: new SecureApi(electronAPI),
  shortcut: new ShortcutApi(electronAPI),
  window: new WindowApi(electronAPI),
}

export type ConveyorApi = typeof conveyor
