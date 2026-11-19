import type { NotificationConstructorOptions } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppSettings } from './settings'
import type { LogEntry } from './logger'
import { NotificationsService } from './notifications'

vi.mock('electron', () => ({
  Notification: class {
    show = vi.fn()
  },
}))

const DEFAULT_SETTINGS = {
  theme: 'dark',
  accentColor: 'default',
  zoomLevel: 0,
  locale: 'system',
  launchAtLogin: false,
  minimizeToTray: false,
  notifications: true,
  proxy: { mode: 'system' },
  window: { menusVisible: true },
  shortcuts: {},
  recentFiles: [],
  onboardingCompleted: false,
  eulaAcceptedVersion: 0,
} satisfies AppSettings

interface ShownNotification {
  options: NotificationConstructorOptions
  show: () => void
}

const createFactory = () => {
  const created: ShownNotification[] = []
  const factory = vi.fn((options: NotificationConstructorOptions) => {
    const notification = { options, show: vi.fn() }
    created.push(notification)
    return notification
  })
  return { created, factory }
}

const createService = (
  notifications = true,
  isSupported = true
): {
  service: NotificationsService
  created: ShownNotification[]
  factory: ReturnType<typeof createFactory>['factory']
  entries: LogEntry[]
} => {
  const { created, factory } = createFactory()
  const entries: LogEntry[] = []
  const service = new NotificationsService(
    { get: () => ({ ...DEFAULT_SETTINGS, notifications }) },
    factory,
    () => isSupported,
    (entry) => entries.push(entry)
  )
  return { service, created, factory, entries }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('NotificationsService', () => {
  it('shows a notification when notifications are enabled and supported', () => {
    const { service, created, factory } = createService()

    const result = service.notify({ title: 'Hello', body: 'World' })

    expect(result).toEqual({ ok: true })
    expect(factory).toHaveBeenCalledWith({ title: 'Hello', body: 'World' })
    expect(created).toHaveLength(1)
    expect(created[0]?.show).toHaveBeenCalledOnce()
  })

  it('forwards the silent flag when provided', () => {
    const { service, factory } = createService()

    service.notify({ title: 'Hello', body: 'World', silent: true })

    expect(factory).toHaveBeenCalledWith({ title: 'Hello', body: 'World', silent: true })
  })

  it('drops silently with reason "disabled" when settings.notifications is false', () => {
    const { service, factory, entries } = createService(false)

    const result = service.notify({ title: 'Hello', body: 'World' })

    expect(result).toEqual({ ok: false, reason: 'disabled' })
    expect(factory).not.toHaveBeenCalled()
    expect(entries).toEqual([])
  })

  it('returns "unsupported" and warns once when the platform does not support notifications', () => {
    const { service, factory, entries } = createService(true, false)

    const result = service.notify({ title: 'Hello', body: 'World' })

    expect(result).toEqual({ ok: false, reason: 'unsupported' })
    expect(factory).not.toHaveBeenCalled()
    expect(entries).toEqual([
      {
        level: 'warn',
        message: 'Native notifications are not supported on this platform',
        source: 'main',
      },
    ])
  })
})
