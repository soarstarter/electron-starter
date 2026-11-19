import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router'
import { AppShell } from '@/app/components/layout/AppShell'
import { ShellLessLayout } from '@/app/components/layout/ShellLessLayout'
import { RouterErrorBoundary } from '@/app/components/RouterErrorBoundary'
// Error fallback stays eager: it must render even when a lazy chunk fails to
// load, and it is tiny.
import { ErrorPage } from '@/app/routes/ErrorPage'
import { lazy, useEffect, useRef } from 'react'
import { loadAccentPreference, loadThemePreference } from '@/app/utils/theme-settings'
import { features } from '@/shared/config'

// Route components are code-split so the initial renderer bundle only carries
// the shell. Each page resolves on first navigation; `RouteFallback` covers the
// fetch. Named exports are mapped to the `default` shape `React.lazy` expects.
const HomePage = lazy(() => import('@/app/routes/HomePage').then((m) => ({ default: m.HomePage })))
const SettingsPage = lazy(() => import('@/app/routes/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const AboutPage = lazy(() => import('@/app/routes/AboutPage').then((m) => ({ default: m.AboutPage })))
const NotFoundPage = lazy(() => import('@/app/routes/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const LogsPage = lazy(() => import('@/app/routes/LogsPage').then((m) => ({ default: m.LogsPage })))
const HelpPage = lazy(() => import('@/app/routes/HelpPage').then((m) => ({ default: m.HelpPage })))
// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
const ShowcasePage = lazy(() => import('@/app/routes/showcase/ShowcasePage').then((m) => ({ default: m.ShowcasePage })))
const ShowcaseDemoRoute = lazy(() => import('@/app/routes/showcase/DemoRoute').then((m) => ({ default: m.DemoRoute })))
const ComponentsPage = lazy(() =>
  import('@/app/routes/showcase/components/ComponentsPage').then((m) => ({ default: m.ComponentsPage }))
)
import { useConveyor } from '@/app/hooks/use-conveyor'
import { OnboardingGate } from '@/app/components/onboarding/OnboardingGate'

const AppIntentNavigation = () => {
  const navigate = useNavigate()
  const { onAppIntent, readyForIntents } = useConveyor('app')
  const navigateRef = useRef(navigate)

  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  useEffect(() => {
    const unsubscribe = onAppIntent((intent) => {
      if (intent.type === 'navigate') {
        navigateRef.current(intent.route)
      }
    })

    readyForIntents().catch((error) => {
      console.error('Failed to register app intent listener:', error)
    })

    return unsubscribe
  }, [onAppIntent, readyForIntents])

  return null
}

export default function App() {
  useEffect(() => {
    loadThemePreference().catch((error) => {
      console.error('Failed to load theme preference:', error)
    })
    loadAccentPreference().catch((error) => {
      console.error('Failed to load accent preference:', error)
    })
  }, [])

  return (
    <>
      <HashRouter>
        <AppIntentNavigation />
        <RouterErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route element={<ShellLessLayout />}>
              <Route path="/error" element={<ErrorPage />} />
            </Route>
            <Route element={<AppShell />}>
              <Route path="/home" element={<HomePage />} />
              {/* [template-demo] Safe to delete — see docs/CUSTOMIZE.md. */}
              {features.showcase && (
                <>
                  <Route path="/showcase" element={<ShowcasePage />} />
                  <Route path="/showcase/components" element={<ComponentsPage />} />
                  <Route path="/showcase/:demoId" element={<ShowcaseDemoRoute />} />
                  <Route path="/file" element={<Navigate to="/showcase/file" replace />} />
                </>
              )}
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </RouterErrorBoundary>
      </HashRouter>
      <OnboardingGate />
    </>
  )
}
