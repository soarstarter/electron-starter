import { describe, expect, it, vi } from 'vitest'
import { AppApi } from '@/lib/conveyor/api/app-api'

describe('Conveyor event subscriptions', () => {
  it('validates public events and removes the exact listener during cleanup', () => {
    let handler: ((event: unknown, payload: unknown) => void) | undefined
    const renderer = {
      invoke: vi.fn(),
      on: vi.fn((_event, nextHandler) => {
        handler = nextHandler
      }),
      removeListener: vi.fn(),
    }
    const api = new AppApi({ ipcRenderer: renderer } as never)
    const listener = vi.fn()
    const cleanup = api.onAppIntent(listener)
    const intent = { type: 'navigate', route: '/settings' }

    handler?.({}, intent)
    expect(listener).toHaveBeenCalledWith(intent)
    expect(() => handler?.({}, { type: 'navigate', route: '/not-a-route' })).toThrow()

    cleanup()
    expect(renderer.removeListener).toHaveBeenCalledWith('app-intent', handler)
  })
})
