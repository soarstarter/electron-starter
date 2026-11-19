import { z } from 'zod'
import { windowIpcSchema } from './window-schema'
import { appIpcSchema } from './app-schema'
import { fileIpcSchema } from './file-schema'
import { logsIpcSchema } from './logs-schema'
import { notificationIpcSchema } from './notification-schema'
import { secureIpcSchema } from './secure-schema'
import { shortcutIpcSchema } from './shortcut-schema'

export { diagnosticsSchema, MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL, zoomLevelSchema, type Diagnostics } from './app-schema'

export {
  appIntentSchema,
  eventSchemas,
  navigationRouteSchema,
  validateEventPayload,
  type AppIntent,
  type EventName,
  type EventPayload,
  type NavigationRoute,
} from './event-schema'
export {
  notificationPayloadSchema,
  notifyDropReasonSchema,
  notifyResultSchema,
  type NotificationPayload,
  type NotifyResult,
} from './notification-schema'
export { secureKeySchema, secureStorageErrorCodeSchema, type SecureKey } from './secure-schema'
export {
  resolvedShortcutSchema,
  shortcutScopeSchema,
  type ResolvedShortcut,
  type ShortcutScope,
} from './shortcut-schema'

// Define all IPC channel schemas in one place
export const ipcSchemas = {
  ...windowIpcSchema,
  ...appIpcSchema,
  ...fileIpcSchema,
  ...logsIpcSchema,
  ...notificationIpcSchema,
  ...secureIpcSchema,
  ...shortcutIpcSchema,
} as const

// Extract types from Zod schemas
export type IPCChannels = {
  [K in keyof typeof ipcSchemas]: {
    args: z.infer<(typeof ipcSchemas)[K]['args']>
    return: z.infer<(typeof ipcSchemas)[K]['return']>
  }
}

export type ChannelName = keyof typeof ipcSchemas
export type ChannelArgs<T extends ChannelName> = IPCChannels[T]['args']
export type ChannelReturn<T extends ChannelName> = IPCChannels[T]['return']

// Runtime validation helpers
export const validateArgs = <T extends ChannelName>(channel: T, args: unknown[]): ChannelArgs<T> => {
  return ipcSchemas[channel].args.parse(args) as ChannelArgs<T>
}

export const validateReturn = <T extends ChannelName>(channel: T, data: unknown): ChannelReturn<T> => {
  return ipcSchemas[channel].return.parse(data) as ChannelReturn<T>
}
