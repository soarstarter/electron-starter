/* @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppIntent } from '@/lib/conveyor/schemas'

import App from './app'
import { WindowContextProvider } from './components/window'
import { initI18n } from './lib/i18n'

let emitIntent: ((intent: AppIntent) => void) | undefined

const unsubscribe = vi.fn()
const readyForIntents = vi.fn(() => Promise.resolve())
beforeAll(() => {
  initI18n('en')
})

beforeEach(() => {
  window.location.hash = '#/about'
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia
  emitIntent = undefined
  unsubscribe.mockClear()
  readyForIntents.mockClear()

  const fullSettings = {
    theme: 'dark' as const,
    accentColor: 'default' as const,
    zoomLevel: 0,
    locale: 'en' as const,
    launchAtLogin: false,
    minimizeToTray: false,
    notifications: true,
    proxy: { mode: 'system' as const },
    window: { menusVisible: true },
    shortcuts: {},
    recentFiles: [],
    onboardingCompleted: true,
    eulaAcceptedVersion: 0,
  }

  window.conveyor = {
    app: {
      version: vi.fn(() => Promise.resolve('1.0.0')),
      getDiagnostics: vi.fn(() =>
        Promise.resolve({
          app: { name: 'Electron Starter', version: '1.0.0', commitSha: 'test', buildTime: 'test' },
          versions: { electron: '40.0.0', chromium: '130.0', node: '22.0.0', v8: '13.0' },
          os: { platform: 'darwin', release: '25.5.0', arch: 'arm64' },
          logPath: '/tmp/electron-starter/main.log',
        })
      ),
      getSettings: vi.fn(() => Promise.resolve(fullSettings)),
      setSettings: vi.fn(() => Promise.resolve(fullSettings)),
      resetSettings: vi.fn(() => Promise.resolve(fullSettings)),
      getLocale: vi.fn(() => Promise.resolve('en-US')),
      setLocale: vi.fn(() => Promise.resolve()),
      readyForIntents,
      onAppIntent: vi.fn((listener: (intent: AppIntent) => void) => {
        emitIntent = listener
        return unsubscribe
      }),
    },
    shortcut: {
      list: vi.fn(() => Promise.resolve([])),
    },
    file: {
      openFilePath: vi.fn(() => Promise.resolve({ canceled: true, path: null, content: null })),
    },
    window: {
      windowInit: vi.fn(() =>
        Promise.resolve({
          width: 900,
          height: 670,
          minimizable: true,
          maximizable: true,
          platform: 'darwin',
        })
      ),
      windowSetTitlebarDark: vi.fn(() => Promise.resolve()),
    },
  } as unknown as Window['conveyor']
})

afterEach(() => {
  cleanup()
})

describe('app intent navigation', () => {
  it('consumes named navigation intents and unsubscribes on unmount', async () => {
    const view = render(
      <WindowContextProvider>
        <App />
      </WindowContextProvider>
    )

    expect(await screen.findByRole('heading', { name: 'About' })).toBeInTheDocument()
    expect(readyForIntents).toHaveBeenCalledOnce()

    act(() => {
      emitIntent?.({ type: 'navigate', route: '/settings' })
    })

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()

    view.unmount()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('opens the home page in the shell without any backend configuration', async () => {
    window.location.hash = '#/home'

    render(
      <WindowContextProvider>
        <App />
      </WindowContextProvider>
    )

    expect(await screen.findByRole('heading', { name: 'Build from a production-ready shell' })).toBeInTheDocument()
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    expect(screen.queryByTestId('sidebar-account')).not.toBeInTheDocument()
  })
})
