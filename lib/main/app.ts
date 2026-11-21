import { APP_NAME } from '@/shared/constants'
import { BrowserWindow, app, nativeTheme } from 'electron'
import { join } from 'path'
import appIcon from '@/resources/build/icon.png?asset'
import type { WindowStateStore } from './window-state'
import type { SettingsStore } from './settings'
import { openExternal } from './external-url'
import { isAllowedInternalNavigation } from './navigation-guard'
import { trustWindow } from './ipc-sender'

const THEME_COLORS = {
  dark: {
    background: '#1c1c1c',
    titleBar: '#0a0a0a',
    symbol: '#ffffff',
  },
  light: {
    background: '#fcfcfc',
    titleBar: '#fcfcfc',
    symbol: '#1f1f1f',
  },
} as const

const resolveLaunchTheme = (theme: ReturnType<SettingsStore['get']>['theme']): keyof typeof THEME_COLORS => {
  if (theme === 'system') return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  return theme
}

export function createAppWindow(windowStateStore: WindowStateStore, settingsStore: SettingsStore): BrowserWindow {
  const isWindows = process.platform === 'win32'
  const isMac = process.platform === 'darwin'

  // The BrowserWindow `icon` option is ignored for the macOS dock — packaged
  // builds get their icon from the app bundle's icon.icns, but in `dev` the
  // bundle is Electron's own, so set the dock icon explicitly here.
  if (isMac && !app.isPackaged) {
    app.dock?.setIcon(appIcon)
  }

  const restoredBounds = windowStateStore.getBounds({ width: 900, height: 670 })
  const launchTheme = resolveLaunchTheme(settingsStore.get().theme)
  const launchColors = THEME_COLORS[launchTheme]

  // Create the main window.
  const mainWindow = new BrowserWindow({
    ...restoredBounds,
    show: false,
    backgroundColor: launchColors.background,
    icon: appIcon,
    frame: true,
    titleBarStyle: isWindows ? 'hidden' : isMac ? 'hiddenInset' : 'default',
    titleBarOverlay: isWindows
      ? {
          color: launchColors.titleBar,
          symbolColor: launchColors.symbol,
          height: 39,
        }
      : false,
    trafficLightPosition: isMac ? { x: 12, y: 12 } : undefined,
    autoHideMenuBar: true,
    title: APP_NAME,
    maximizable: true,
    resizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  })
  // Only windows registered here may call IPC handlers (see ipc-sender.ts).
  // Any future window must be registered the same way before it loads content.
  trustWindow(mainWindow)

  let loadedUrl: string | null = null
  mainWindow.webContents.on('did-finish-load', () => {
    loadedUrl = mainWindow.webContents.getURL()
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = isAllowedInternalNavigation(url, {
      loadedUrl,
      devRendererUrl: process.env['ELECTRON_RENDERER_URL'],
      isPackaged: app.isPackaged,
    })

    if (allowed) return

    event.preventDefault()
    openExternal(url).catch((error) => {
      console.error('Rejected navigation:', error)
    })
  })

  const persistWindowBounds = () => {
    if (mainWindow.isMinimized() || mainWindow.isMaximized() || mainWindow.isFullScreen()) {
      return
    }
    windowStateStore.setBounds(mainWindow.getBounds())
  }

  mainWindow.on('move', persistWindowBounds)
  mainWindow.on('resize', persistWindowBounds)
  mainWindow.on('maximize', () => windowStateStore.setIsMaximized(true))
  mainWindow.on('unmaximize', () => windowStateStore.setIsMaximized(false))
  mainWindow.on('close', () => {
    persistWindowBounds()
    windowStateStore.setIsMaximized(mainWindow.isMaximized())
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.webContents.setZoomLevel(settingsStore.get().zoomLevel)
    if (windowStateStore.getIsMaximized()) {
      mainWindow.maximize()
    }
    mainWindow.setMenuBarVisibility(false)
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    openExternal(details.url).catch((error) => {
      console.error('Rejected external URL:', error)
    })

    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}
