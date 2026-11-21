import { ipcMain, type BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import { ipcSchemas, validateArgs, validateReturn, type ChannelArgs, type ChannelReturn } from '@/lib/conveyor/schemas'
import { resolveIpcSenderWindow } from './ipc-sender'

/**
 * Helper to register IPC handlers
 *
 * Every request is checked before its arguments are parsed: it must come from
 * the main frame of a window the app created (see `lib/main/ipc-sender.ts`).
 * A request that fails the check throws and the handler is never called.
 *
 * @param channel - The IPC channel to register the handler for
 * @param handler - The handler function to register
 * @returns void
 */
export const handle = <T extends keyof typeof ipcSchemas>(
  channel: T,
  handler: (event: IpcMainInvokeEvent, ...args: ChannelArgs<T>) => ChannelReturn<T> | Promise<ChannelReturn<T>>
) => {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      resolveIpcSenderWindow(event)
      const validatedArgs = validateArgs(channel, args)
      const result = await handler(event, ...validatedArgs)

      return validateReturn(channel, result)
    } catch (error) {
      console.error(`IPC Error in ${channel}:`, error)
      throw error
    }
  })
}

/** The application window that sent `event`; throws if it is not a trusted sender. */
export const getRequestingWindow = (event: IpcMainInvokeEvent): BrowserWindow =>
  resolveIpcSenderWindow<BrowserWindow>(event)
