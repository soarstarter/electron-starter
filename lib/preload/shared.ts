import type { ElectronAPI, IpcRenderer } from '@electron-toolkit/preload'
import {
  validateEventPayload,
  type ChannelName,
  type ChannelArgs,
  type ChannelReturn,
  type EventName,
  type EventPayload,
} from '@/lib/conveyor/schemas'

/**
 * Base class for one Conveyor domain. Subclasses declare each renderer-facing
 * method as an arrow-function field that calls `this.invoke(...)` or
 * `this.subscribe(...)`.
 *
 * The raw `ipcRenderer` lives in a JS private field, and `invoke`/`subscribe`
 * are prototype methods, so none of them are own properties of an instance.
 * Only the domain methods are, and {@link toBridgeObject} copies exactly those
 * onto the plain object that crosses the contextBridge.
 */
export abstract class ConveyorApi {
  readonly #renderer: IpcRenderer

  constructor(electronApi: ElectronAPI) {
    this.#renderer = electronApi.ipcRenderer
  }

  protected invoke<T extends ChannelName>(channel: T, ...args: ChannelArgs<T>): Promise<ChannelReturn<T>> {
    // Call the IPC method without runtime validation in preload
    // Validation happens on the main process side
    return this.#renderer.invoke(channel, ...args) as Promise<ChannelReturn<T>>
  }

  protected subscribe<T extends EventName>(event: T, listener: (payload: EventPayload<T>) => void): () => void {
    const renderer = this.#renderer
    const onEvent = (_ipcEvent: Electron.IpcRendererEvent, payload: unknown) => {
      listener(validateEventPayload(event, payload))
    }

    renderer.on(event, onEvent)
    return () => renderer.removeListener(event, onEvent)
  }
}

/** The function-valued public members of a domain, i.e. what the page may call. */
export type BridgeObject<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K]
}

/**
 * Copies a domain's own method fields onto a fresh plain object. This is what
 * the preload exposes, so the page never receives the class instance, its
 * prototype, or the underlying `ipcRenderer`.
 */
export const toBridgeObject = <T extends ConveyorApi>(api: T): BridgeObject<T> => {
  const methods: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(api)) {
    if (typeof value === 'function') methods[name] = value
  }
  return Object.freeze(methods) as BridgeObject<T>
}
