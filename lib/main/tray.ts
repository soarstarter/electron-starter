import { Menu, Tray, app, nativeImage, nativeTheme, type BrowserWindow, type Event, type NativeImage } from 'electron'
import lightTrayIconPath from '@/resources/build/tray/icon-light.png?asset'
import darkTrayIconPath from '@/resources/build/tray/icon-dark.png?asset'
// macOS menu bar uses a monochrome "template" image so the system can render it
// crisp (white on dark bars, black on light) and adapt to appearance changes.
import templateTrayIconPath from '@/resources/build/tray/icon-template.png?asset'
import templateTrayIcon2xPath from '@/resources/build/tray/icon-template-2x.png?asset'
import type { AppIntentService } from './app-intents'
import type { NavigationRoute } from '@/lib/conveyor/schemas'
import type { SettingsStore } from './settings'
import { t } from './i18n'

interface TrayServiceDeps {
  settingsStore: SettingsStore
  appIntentService: AppIntentService
}

export class TrayService {
  private tray: Tray | undefined
  private primaryWindow: BrowserWindow | undefined
  private quitting = false
  private readonly handleNativeThemeChange: () => void

  constructor(private readonly deps: TrayServiceDeps) {
    this.handleNativeThemeChange = () => this.refreshTrayIcon()
  }

  initialize = (): void => {
    app.on('before-quit', this.markQuitting)
    this.applySettings()
  }

  attachPrimaryWindow = (window: BrowserWindow): void => {
    this.primaryWindow = window
    window.on('close', this.handleWindowClose)
    window.once('closed', () => {
      if (this.primaryWindow === window) {
        this.primaryWindow = undefined
      }
    })
  }

  applySettings = (): void => {
    if (this.deps.settingsStore.get().minimizeToTray) {
      this.ensureTray()
    } else {
      this.destroyTray()
    }
  }

  private markQuitting = (): void => {
    this.quitting = true
  }

  private handleWindowClose = (event: Event): void => {
    if (this.quitting) return
    if (process.platform === 'darwin') return
    if (!this.deps.settingsStore.get().minimizeToTray) return
    if (!this.tray) return
    event.preventDefault()
    this.primaryWindow?.hide()
  }

  private ensureTray = (): void => {
    if (this.tray) {
      this.refreshMenu()
      return
    }

    const tray = new Tray(this.loadTrayIcon())
    tray.setToolTip(app.getName())
    tray.on('click', this.focusPrimaryWindow)
    this.tray = tray
    this.refreshMenu()
    nativeTheme.on('updated', this.handleNativeThemeChange)
  }

  private destroyTray = (): void => {
    if (!this.tray) return
    nativeTheme.removeListener('updated', this.handleNativeThemeChange)
    this.tray.destroy()
    this.tray = undefined
  }

  private refreshTrayIcon = (): void => {
    this.tray?.setImage(this.loadTrayIcon())
  }

  private loadTrayIcon = (): NativeImage => {
    if (process.platform === 'darwin') {
      // Monochrome template image + an explicit @2x representation for retina
      // menu bars. macOS recolors template images to match the bar automatically.
      const icon = nativeImage.createFromPath(templateTrayIconPath)
      icon.addRepresentation({
        scaleFactor: 2,
        buffer: nativeImage.createFromPath(templateTrayIcon2xPath).toPNG(),
      })
      icon.setTemplateImage(true)
      return icon
    }
    const path = nativeTheme.shouldUseDarkColors ? darkTrayIconPath : lightTrayIconPath
    return nativeImage.createFromPath(path)
  }

  refreshLocalization = (): void => {
    this.refreshMenu()
  }

  private refreshMenu = (): void => {
    if (!this.tray) return
    const menu = Menu.buildFromTemplate([
      { label: t('common:tray.openMainWindow'), click: this.focusPrimaryWindow },
      { label: t('common:tray.settings'), click: () => this.openRoute('/settings') },
      { label: t('common:tray.about'), click: () => this.openRoute('/about') },
      { type: 'separator' },
      { label: t('common:tray.quit'), role: 'quit' },
    ])
    this.tray.setContextMenu(menu)
  }

  private focusPrimaryWindow = (): void => {
    const window = this.primaryWindow
    if (!window || window.isDestroyed()) return
    if (window.isMinimized()) window.restore()
    if (!window.isVisible()) window.show()
    window.focus()
  }

  private openRoute = (route: NavigationRoute): void => {
    this.focusPrimaryWindow()
    this.deps.appIntentService.dispatch({ type: 'navigate', route })
  }
}
