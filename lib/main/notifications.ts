import { Notification, type NotificationConstructorOptions } from 'electron'
import type { SettingsStore } from './settings'
import { writeLog, type LogEntry } from './logger'

export type NotifyDropReason = 'disabled' | 'unsupported'

export type NotifyResult = { ok: true } | { ok: false; reason: NotifyDropReason }

export interface NotificationPayload {
  title: string
  body: string
  silent?: boolean
}

interface NotificationLike {
  show: () => void
}

type NotificationFactory = (options: NotificationConstructorOptions) => NotificationLike
type SupportProbe = () => boolean
type SettingsReader = Pick<SettingsStore, 'get'>
type LogWriter = (entry: LogEntry) => void

const defaultFactory: NotificationFactory = (options) => new Notification(options)
const defaultSupportProbe: SupportProbe = () => Notification.isSupported()

export class NotificationsService {
  constructor(
    private readonly settingsStore: SettingsReader,
    private readonly notificationFactory: NotificationFactory = defaultFactory,
    private readonly isSupported: SupportProbe = defaultSupportProbe,
    private readonly log: LogWriter = writeLog
  ) {}

  notify = ({ title, body, silent }: NotificationPayload): NotifyResult => {
    if (!this.settingsStore.get().notifications) {
      return { ok: false, reason: 'disabled' }
    }

    if (!this.isSupported()) {
      this.log({
        level: 'warn',
        message: 'Native notifications are not supported on this platform',
        source: 'main',
      })
      return { ok: false, reason: 'unsupported' }
    }

    const notification = this.notificationFactory({
      title,
      body,
      ...(silent !== undefined && { silent }),
    })
    notification.show()
    return { ok: true }
  }
}
