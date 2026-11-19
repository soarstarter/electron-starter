import { app, Menu, type MenuItemConstructorOptions } from 'electron'
import type { NavigationRoute } from '@/lib/conveyor/schemas'
import type { ShortcutRegistry } from './shortcuts'
import { openExternal } from './external-url'
import { HOMEPAGE_URL } from '@/shared/constants'
import { t } from './i18n'

interface MenuActions {
  navigateTo: (route: NavigationRoute) => void
  resetZoom?: () => void
  zoomIn?: () => void
  zoomOut?: () => void
}

interface MenuOptions {
  resetZoom?: () => void
  showcaseEnabled?: boolean
  zoomIn?: () => void
  zoomOut?: () => void
}

export const createMenuTemplate = (
  actions: MenuActions,
  shortcuts: ShortcutRegistry,
  options: Pick<MenuOptions, 'showcaseEnabled'> = {}
): MenuItemConstructorOptions[] => {
  const isMac = process.platform === 'darwin'
  const showcaseEnabled = options.showcaseEnabled ?? true

  const fileMenu: MenuItemConstructorOptions = {
    label: t('common:menu.file'),
    submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
  }

  // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
  const templateMenu: MenuItemConstructorOptions | undefined = showcaseEnabled
    ? {
        label: t('common:menu.template'),
        submenu: [
          {
            label: t('common:menu.openShowcase'),
            click: () => actions.navigateTo('/showcase'),
          },
          {
            label: t('common:menu.openFileDemo'),
            accelerator: shortcuts.get('nav.open-file'),
            click: () => actions.navigateTo('/showcase/file'),
          },
        ],
      }
    : undefined

  const editMenu: MenuItemConstructorOptions = {
    label: t('common:menu.edit'),
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'delete' },
      { type: 'separator' },
      { role: 'selectAll' },
    ],
  }

  const viewMenu: MenuItemConstructorOptions = {
    label: t('common:menu.view'),
    submenu: [
      ...(app.isPackaged
        ? []
        : ([
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
          ] satisfies MenuItemConstructorOptions[])),
      {
        label: t('common:menu.actualSize'),
        accelerator: 'CmdOrCtrl+0',
        click: () => actions.resetZoom?.(),
      },
      {
        label: t('common:menu.zoomIn'),
        accelerator: 'CmdOrCtrl+Plus',
        click: () => actions.zoomIn?.(),
      },
      {
        label: t('common:menu.zoomOut'),
        accelerator: 'CmdOrCtrl+-',
        click: () => actions.zoomOut?.(),
      },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  }

  const windowMenu: MenuItemConstructorOptions = {
    label: t('common:menu.window'),
    submenu: isMac
      ? [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }]
      : [{ role: 'minimize' }, { role: 'close' }],
  }

  const helpSubmenu: MenuItemConstructorOptions[] = [
    {
      label: t('common:menu.showLogs'),
      click: () => actions.navigateTo('/logs'),
    },
    { type: 'separator' },
    {
      label: t('common:menu.about'),
      click: () => actions.navigateTo('/about'),
    },
    { type: 'separator' },
    {
      label: t('common:menu.homepage'),
      click: () => {
        openExternal(HOMEPAGE_URL).catch((error) => {
          console.error('Rejected external URL:', error)
        })
      },
    },
  ]

  const helpMenu: MenuItemConstructorOptions = {
    role: 'help',
    submenu: helpSubmenu,
  }

  if (isMac) {
    return [
      {
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      fileMenu,
      // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
      ...(templateMenu ? [templateMenu] : []),
      editMenu,
      viewMenu,
      windowMenu,
      helpMenu,
    ]
  }

  return [
    fileMenu,
    // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
    ...(templateMenu ? [templateMenu] : []),
    editMenu,
    viewMenu,
    windowMenu,
    helpMenu,
  ]
}

export const registerApplicationMenu = (
  navigateTo: (route: NavigationRoute) => void,
  shortcuts: ShortcutRegistry,
  options: MenuOptions = {}
) => {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate(
      createMenuTemplate(
        {
          navigateTo,
          resetZoom: options.resetZoom,
          zoomIn: options.zoomIn,
          zoomOut: options.zoomOut,
        },
        shortcuts,
        {
          showcaseEnabled: options.showcaseEnabled,
        }
      )
    )
  )
}
