import type { App, Rectangle } from 'electron'
import { screen } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { z } from 'zod'

const windowBoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

const windowStateSchema = z.object({
  bounds: windowBoundsSchema.nullable(),
  isMaximized: z.boolean().catch(false),
  lastOpenedPath: z.string().nullable(),
})

type WindowState = z.infer<typeof windowStateSchema>

const DEFAULT_STATE: WindowState = {
  bounds: null,
  isMaximized: false,
  lastOpenedPath: null,
}

const MIN_WINDOW_WIDTH = 700
const MIN_WINDOW_HEIGHT = 500

export class WindowStateStore {
  private readonly statePath: string
  private state: WindowState

  constructor(app: App) {
    this.statePath = join(app.getPath('userData'), 'window-state.json')
    this.state = this.load()
  }

  getBounds = (fallback: Pick<Rectangle, 'width' | 'height'>): Pick<Rectangle, 'x' | 'y' | 'width' | 'height'> => {
    const savedBounds = this.state.bounds
    if (!savedBounds || !this.isBoundsValid(savedBounds)) {
      return this.centerBounds(fallback.width, fallback.height)
    }

    return savedBounds
  }

  setBounds = (bounds: Rectangle): void => {
    const normalized: Rectangle = {
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.max(MIN_WINDOW_WIDTH, Math.round(bounds.width)),
      height: Math.max(MIN_WINDOW_HEIGHT, Math.round(bounds.height)),
    }

    if (!this.isBoundsValid(normalized)) {
      return
    }

    this.state = {
      ...this.state,
      bounds: normalized,
    }
    this.save(this.state)
  }

  getIsMaximized = (): boolean => {
    return this.state.isMaximized
  }

  setIsMaximized = (isMaximized: boolean): void => {
    this.state = {
      ...this.state,
      isMaximized,
    }
    this.save(this.state)
  }

  getLastOpenedPath = (): string | null => {
    return this.state.lastOpenedPath
  }

  setLastOpenedPath = (path: string): void => {
    this.state = {
      ...this.state,
      lastOpenedPath: path,
    }
    this.save(this.state)
  }

  private centerBounds = (width: number, height: number): Pick<Rectangle, 'x' | 'y' | 'width' | 'height'> => {
    const primary = screen.getPrimaryDisplay().workArea
    const safeWidth = Math.max(MIN_WINDOW_WIDTH, width)
    const safeHeight = Math.max(MIN_WINDOW_HEIGHT, height)
    const x = Math.round(primary.x + (primary.width - safeWidth) / 2)
    const y = Math.round(primary.y + (primary.height - safeHeight) / 2)

    return { x, y, width: safeWidth, height: safeHeight }
  }

  private isBoundsValid = (bounds: Rectangle): boolean => {
    if (bounds.width < MIN_WINDOW_WIDTH || bounds.height < MIN_WINDOW_HEIGHT) {
      return false
    }

    const boundsRight = bounds.x + bounds.width
    const boundsBottom = bounds.y + bounds.height

    return screen.getAllDisplays().some((display) => {
      const area = display.workArea
      const areaRight = area.x + area.width
      const areaBottom = area.y + area.height

      const overlapsX = bounds.x < areaRight && boundsRight > area.x
      const overlapsY = bounds.y < areaBottom && boundsBottom > area.y
      return overlapsX && overlapsY
    })
  }

  private load = (): WindowState => {
    try {
      if (!existsSync(this.statePath)) {
        this.save(DEFAULT_STATE)
        return DEFAULT_STATE
      }

      const raw = readFileSync(this.statePath, 'utf8')
      const parsed = JSON.parse(raw)
      const result = windowStateSchema.safeParse(parsed)

      if (result.success) {
        return result.data
      }
    } catch (error) {
      console.error('Failed to load window state:', error)
    }

    this.save(DEFAULT_STATE)
    return DEFAULT_STATE
  }

  private save = (state: WindowState): void => {
    const directory = dirname(this.statePath)
    mkdirSync(directory, { recursive: true })
    writeFileSync(this.statePath, JSON.stringify(state, null, 2), 'utf8')
  }
}
