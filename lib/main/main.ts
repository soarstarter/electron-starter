import { app, BrowserWindow, protocol } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { resolve } from 'node:path'
import { createAppWindow } from './app'
import { registerApplicationMenu } from './menu'
import { registerResourcesProtocol } from './protocols'
import { registerWindowHandlers } from '@/lib/conveyor/handlers/window-handler'
import { registerAppHandlers } from '@/lib/conveyor/handlers/app-handler'
import { registerFileHandlers } from '@/lib/conveyor/handlers/file-handler'
import { registerLogsHandlers } from '@/lib/conveyor/handlers/logs-handler'
import { registerSecureHandlers } from '@/lib/conveyor/handlers/secure-handler'
import { SettingsStore } from './settings'
import { SecureStorage } from './secure-storage'
import { WindowStateStore } from './window-state'
import { AppIntentService } from './app-intents'
import { TrayService } from './tray'
import { parseArgvForIntents } from './argv-intents'
import { initializeLogger } from './logger'
import { NotificationsService } from './notifications'
import { registerNotificationHandlers } from '@/lib/conveyor/handlers/notification-handler'
import { ShortcutRegistry } from './shortcuts'
// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { mainFeatures } from './feature-flags'
import { registerShortcutHandlers } from '@/lib/conveyor/handlers/shortcut-handler'
import { APP_USER_MODEL_ID, PROTOCOL_SCHEME } from '@/shared/constants'
import type { NavigationRoute } from '@/lib/conveyor/schemas'
import { initMainI18n } from './i18n'
import { resolveSupportedLanguage } from '@/app/lib/i18n/resources'
import { registerPermissionHandlers } from './permissions'
import { adjustWindowZoomLevel, setWindowZoomLevel } from './zoom'

app.enableSandbox()

interface AppServices {
  appIntentService: AppIntentService
  trayService: TrayService
  windowStateStore: WindowStateStore
}

let services: AppServices | undefined

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

if (process.defaultApp) {
  // Dev mode: register Electron's binary with the project path so the OS can
  // relaunch us correctly. Packaged builds use the default exe path.
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL_SCHEME, process.execPath, [resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL_SCHEME)
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'res',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
])

const settingsStore = new SettingsStore(app)

initializeLogger()

const resolveBootLanguage = (): ReturnType<typeof resolveSupportedLanguage> => {
  const stored = settingsStore.get().locale
  if (stored !== 'system') return resolveSupportedLanguage(stored)
  return resolveSupportedLanguage(app.getLocale())
}

const initializeApplication = (): AppServices => {
  if (services) {
    return services
  }

  electronApp.setAppUserModelId(APP_USER_MODEL_ID)
  initMainI18n(resolveBootLanguage())

  const secureStorage = new SecureStorage(app)
  const windowStateStore = new WindowStateStore(app)
  const appIntentService = new AppIntentService()
  const trayService = new TrayService({ settingsStore, appIntentService })
  const notificationsService = new NotificationsService(settingsStore)
  const shortcutRegistry = new ShortcutRegistry(settingsStore)
  const appServices = { appIntentService, trayService, windowStateStore }
  shortcutRegistry.validateAtStartup()

  const getActiveZoomWindow = () => BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]

  const resetZoom = () => {
    const window = getActiveZoomWindow()
    if (window) setWindowZoomLevel(window, settingsStore, 0)
  }

  const zoomIn = () => {
    const window = getActiveZoomWindow()
    if (window) adjustWindowZoomLevel(window, settingsStore, 0.5)
  }

  const zoomOut = () => {
    const window = getActiveZoomWindow()
    if (window) adjustWindowZoomLevel(window, settingsStore, -0.5)
  }

  const rebuildNativeSurfaces = () => {
    registerApplicationMenu((route) => openRouteInPrimaryWindow(appServices, route), shortcutRegistry, {
      resetZoom,
      // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
      showcaseEnabled: mainFeatures.showcase,
      zoomIn,
      zoomOut,
    })
    trayService.refreshLocalization()
  }

  registerResourcesProtocol()
  registerPermissionHandlers()
  registerWindowHandlers(settingsStore)
  registerAppHandlers(app, settingsStore, secureStorage, appIntentService, trayService, {
    onLocaleChanged: rebuildNativeSurfaces,
  })
  registerFileHandlers(windowStateStore, settingsStore)
  registerLogsHandlers()
  registerSecureHandlers(secureStorage)
  registerNotificationHandlers(notificationsService)
  registerShortcutHandlers(shortcutRegistry)
  registerApplicationMenu((route) => openRouteInPrimaryWindow(appServices, route), shortcutRegistry, {
    resetZoom,
    // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
    showcaseEnabled: mainFeatures.showcase,
    zoomIn,
    zoomOut,
  })
  trayService.initialize()
  app.on('will-quit', () => {
    shortcutRegistry.unregisterAllGlobals()
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  services = appServices
  return services
}

const createPrimaryWindow = ({ appIntentService, trayService, windowStateStore }: AppServices): void => {
  const window = createAppWindow(windowStateStore, settingsStore)
  appIntentService.attachPrimaryWindow(window)
  trayService.attachPrimaryWindow(window)
}

const focusPrimaryWindow = (): void => {
  const primary = BrowserWindow.getAllWindows()[0]
  if (!primary) return

  if (primary.isMinimized()) primary.restore()
  primary.show()
  primary.focus()
}

const openRouteInPrimaryWindow = (appServices: AppServices, route: NavigationRoute): void => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createPrimaryWindow(appServices)
  } else {
    focusPrimaryWindow()
  }

  appServices.appIntentService.dispatch({ type: 'navigate', route })
}

/** Dispatches protocol URLs and `--route=` flags as app intents. */
const dispatchLaunchArgs = (appServices: AppServices, argv: readonly string[]): void => {
  for (const intent of parseArgvForIntents(argv)) {
    appServices.appIntentService.dispatch(intent)
  }
}

app.on('second-instance', (_event, argv) => {
  const appServices = initializeApplication()

  if (BrowserWindow.getAllWindows().length === 0) {
    createPrimaryWindow(appServices)
  } else {
    focusPrimaryWindow()
  }

  dispatchLaunchArgs(appServices, argv)
})

// macOS delivers protocol URLs via open-url. The event may fire before
// whenReady on cold start, so we buffer until the app is initialized.
const pendingProtocolUrls: string[] = []

const drainProtocolUrls = (appServices: AppServices): void => {
  while (pendingProtocolUrls.length > 0) {
    const url = pendingProtocolUrls.shift()
    if (!url) continue
    dispatchLaunchArgs(appServices, [url])
  }
}

app.on('open-url', (event, url) => {
  event.preventDefault()
  pendingProtocolUrls.push(url)

  if (!app.isReady()) return

  const appServices = initializeApplication()
  if (BrowserWindow.getAllWindows().length === 0) {
    createPrimaryWindow(appServices)
  } else {
    focusPrimaryWindow()
  }
  drainProtocolUrls(appServices)
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const appServices = initializeApplication()
  createPrimaryWindow(appServices)

  dispatchLaunchArgs(appServices, process.argv)
  drainProtocolUrls(appServices)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createPrimaryWindow(appServices)
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file, you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
