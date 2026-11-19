import type { ElectronAPI, IpcRenderer } from '@electron-toolkit/preload'
import {
  validateEventPayload,
  type ChannelName,
  type ChannelArgs,
  type ChannelReturn,
  type EventName,
  type EventPayload,
} from '@/lib/conveyor/schemas'

export abstract class ConveyorApi {
  protected renderer: IpcRenderer

  constructor(electronApi: ElectronAPI) {
    this.renderer = electronApi.ipcRenderer
  }

  invoke = async <T extends ChannelName>(channel: T, ...args: ChannelArgs<T>): Promise<ChannelReturn<T>> => {
    // Call the IPC method without runtime validation in preload
    // Validation happens on the main process side
    return this.renderer.invoke(channel, ...args) as Promise<ChannelReturn<T>>
  }

  protected subscribe = <T extends EventName>(event: T, listener: (payload: EventPayload<T>) => void): (() => void) => {
    const onEvent = (_ipcEvent: Electron.IpcRendererEvent, payload: unknown) => {
      listener(validateEventPayload(event, payload))
    }

    this.renderer.on(event, onEvent)
    return () => this.renderer.removeListener(event, onEvent)
  }
}
