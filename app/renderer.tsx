import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/app.css'
import { WindowContextProvider } from '@/app/components/window'
import { ErrorBoundary } from './components/ErrorBoundary'
import { logRendererError } from './utils/renderer-logger'
import { bootstrapI18n } from './lib/i18n/bootstrap'

window.addEventListener('error', (event) => {
  logRendererError(event.error ?? event.message, {
    source: 'window.onerror',
    filename: event.filename ?? '',
    line: event.lineno,
    column: event.colno,
  })
})

window.addEventListener('unhandledrejection', (event) => {
  logRendererError(event.reason, { source: 'unhandledrejection' })
})

const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement)

const mount = async () => {
  const { default: App } = await import('./app')
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <WindowContextProvider>
          <App />
        </WindowContextProvider>
      </ErrorBoundary>
    </React.StrictMode>
  )
}

bootstrapI18n({
  getSettings: () => window.conveyor.app.getSettings(),
  getSystemLocale: () => window.conveyor.app.getLocale(),
  setSettings: (patch) => window.conveyor.app.setSettings(patch),
})
  .catch((error) => {
    console.error('i18n bootstrap failed:', error)
  })
  .finally(() => {
    void mount().catch((error) => {
      logRendererError(error, { source: 'renderer-mount' })
    })
  })
