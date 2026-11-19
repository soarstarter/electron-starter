import { app } from 'electron'
import { getRequestingWindow, handle } from '@/lib/main/shared'
import { openExternal } from '@/lib/main/external-url'
import type { SettingsStore } from '@/lib/main/settings'
import { adjustWindowZoomLevel, setWindowZoomLevel } from '@/lib/main/zoom'

type ZoomSettingsStore = Pick<SettingsStore, 'update'>

export const registerWindowHandlers = (settingsStore: ZoomSettingsStore) => {
  // Window operations
  handle('window-init', (event) => {
    const window = getRequestingWindow(event)
    const { width, height } = window.getBounds()
    const minimizable = window.isMinimizable()
    const maximizable = window.isMaximizable()
    const platform = process.platform

    return { width, height, minimizable, maximizable, platform }
  })

  handle('window-is-minimizable', (event) => getRequestingWindow(event).isMinimizable())
  handle('window-is-maximizable', (event) => getRequestingWindow(event).isMaximizable())
  handle('window-minimize', (event) => getRequestingWindow(event).minimize())
  handle('window-maximize', (event) => getRequestingWindow(event).maximize())
  handle('window-close', (event) => getRequestingWindow(event).close())
  handle('window-maximize-toggle', (event) => {
    const window = getRequestingWindow(event)
    return window.isMaximized() ? window.unmaximize() : window.maximize()
  })
  handle('window-set-titlebar-dark', (event, isDark) => {
    if (process.platform !== 'win32') return
    const window = getRequestingWindow(event)
    window.setTitleBarOverlay({
      color: isDark ? '#0a0a0a' : '#fcfcfc',
      symbolColor: isDark ? '#ffffff' : '#1f1f1f',
      height: 39,
    })
  })

  // Web content operations
  handle('web-undo', (event) => getRequestingWindow(event).webContents.undo())
  handle('web-redo', (event) => getRequestingWindow(event).webContents.redo())
  handle('web-cut', (event) => getRequestingWindow(event).webContents.cut())
  handle('web-copy', (event) => getRequestingWindow(event).webContents.copy())
  handle('web-paste', (event) => getRequestingWindow(event).webContents.paste())
  handle('web-delete', (event) => getRequestingWindow(event).webContents.delete())
  handle('web-select-all', (event) => getRequestingWindow(event).webContents.selectAll())
  if (!app.isPackaged) {
    handle('web-reload', (event) => getRequestingWindow(event).webContents.reload())
    handle('web-force-reload', (event) => getRequestingWindow(event).webContents.reloadIgnoringCache())
    handle('web-toggle-devtools', (event) => getRequestingWindow(event).webContents.toggleDevTools())
  }
  handle('web-actual-size', (event) => {
    setWindowZoomLevel(getRequestingWindow(event), settingsStore, 0)
  })
  handle('web-zoom-in', (event) => {
    adjustWindowZoomLevel(getRequestingWindow(event), settingsStore, 0.5)
  })
  handle('web-zoom-out', (event) => {
    adjustWindowZoomLevel(getRequestingWindow(event), settingsStore, -0.5)
  })
  handle('web-toggle-fullscreen', (event) => {
    const window = getRequestingWindow(event)
    window.setFullScreen(!window.fullScreen)
  })
  handle('web-open-url', (_event, url: string) => openExternal(url))
}
