import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { Toaster } from '@/app/components/ui/sonner'
import { RouteFallback } from '@/app/components/layout/RouteFallback'

export const ShellLessLayout = () => (
  <div className="h-full flex flex-col bg-background text-foreground">
    <div data-testid="app-titlebar-drag" className="app-titlebar-drag h-10 shrink-0" aria-hidden />
    <main data-testid="shell-less-main" className="flex flex-1 items-center justify-center overflow-auto p-6">
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </main>
    <Toaster />
  </div>
)
