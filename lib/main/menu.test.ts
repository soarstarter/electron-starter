import { describe, expect, it, vi } from 'vitest'
import type { MenuItemConstructorOptions } from 'electron'
import { createMenuTemplate } from './menu'
import type { ShortcutRegistry } from './shortcuts'

vi.mock('electron', () => ({
  app: { isPackaged: false, name: 'Electron Starter' },
  Menu: {
    buildFromTemplate: vi.fn((template: MenuItemConstructorOptions[]) => template),
    setApplicationMenu: vi.fn(),
  },
}))

const shortcuts = {
  get: vi.fn((id: string) => (id === 'nav.open-file' ? 'CmdOrCtrl+O' : undefined)),
} as unknown as ShortcutRegistry

const submenuOf = (item: MenuItemConstructorOptions): MenuItemConstructorOptions[] =>
  item.submenu as MenuItemConstructorOptions[]

describe('createMenuTemplate', () => {
  it('moves showcase demo commands into a gated Template menu', () => {
    const navigateTo = vi.fn()
    const template = createMenuTemplate({ navigateTo }, shortcuts, { showcaseEnabled: true })
    const fileMenu = template.find((item) => item.label === 'File')!
    const templateMenu = template.find((item) => item.label === 'Template')!

    expect(submenuOf(fileMenu).some((item) => item.label === 'Open File Demo')).toBe(false)
    expect(templateMenu).toBeDefined()

    const showcaseItem = submenuOf(templateMenu).find((item) => item.label === 'Open Showcase')!
    const fileDemoItem = submenuOf(templateMenu).find((item) => item.label === 'Open File Demo')!

    expect(fileDemoItem.accelerator).toBe('CmdOrCtrl+O')
    showcaseItem.click?.({} as never, {} as never, {} as never)
    fileDemoItem.click?.({} as never, {} as never, {} as never)

    expect(navigateTo).toHaveBeenCalledWith('/showcase')
    expect(navigateTo).toHaveBeenCalledWith('/showcase/file')
  })

  it('omits Template commands when showcase is disabled', () => {
    const template = createMenuTemplate({ navigateTo: vi.fn() }, shortcuts, { showcaseEnabled: false })

    expect(template.find((item) => item.label === 'Template')).toBeUndefined()
    expect(template.some((item) => submenuOf(item).some((subitem) => subitem.label === 'Open File Demo'))).toBe(false)
  })

  it('routes zoom menu commands through persisted zoom actions', () => {
    const resetZoom = vi.fn()
    const zoomIn = vi.fn()
    const zoomOut = vi.fn()
    const template = createMenuTemplate({ navigateTo: vi.fn(), resetZoom, zoomIn, zoomOut }, shortcuts)
    const viewMenu = template.find((item) => item.label === 'View')!

    submenuOf(viewMenu)
      .find((item) => item.label === 'Actual Size')!
      .click?.({} as never, {} as never, {} as never)
    submenuOf(viewMenu)
      .find((item) => item.label === 'Zoom In')!
      .click?.({} as never, {} as never, {} as never)
    submenuOf(viewMenu)
      .find((item) => item.label === 'Zoom Out')!
      .click?.({} as never, {} as never, {} as never)

    expect(resetZoom).toHaveBeenCalledOnce()
    expect(zoomIn).toHaveBeenCalledOnce()
    expect(zoomOut).toHaveBeenCalledOnce()
  })
})
