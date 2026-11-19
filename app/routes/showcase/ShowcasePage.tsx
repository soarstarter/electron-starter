// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { useConveyor } from '@/app/hooks/use-conveyor'
import { CAPABILITY_CATALOG, capabilitiesIn } from '@/app/showcase/capability-catalog'
import { PRO_CATALOG, PRO_UPGRADE_URL } from '@/app/showcase/pro-catalog'
import type { CapabilityCategory } from '@/app/showcase/capability-types'
import { cn } from '@/lib/utils'
import { STATUS_TINTS } from './showcase-styles'

const CATEGORIES: readonly CapabilityCategory[] = ['shell', 'system', 'data', 'ops']

export const ShowcasePage = () => {
  const { t } = useTranslation('showcase')
  const { webOpenUrl } = useConveyor('window')

  const openProPage = () => {
    void webOpenUrl(PRO_UPGRADE_URL).catch(() => undefined)
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="space-y-2 border-b border-border pb-5">
        <Badge variant="outline">{CAPABILITY_CATALOG.length} capabilities</Badge>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </header>

      {CATEGORIES.map((category) => {
        const capabilities = capabilitiesIn(category)
        return (
          <section key={category} className="space-y-3">
            <h2 className="text-base font-semibold">{t(`categories.${category}`)}</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {capabilities.map((capability) => {
                const Icon = capability.icon
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Icon className="size-4" aria-hidden />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <h3 className="text-sm font-medium">{t(capability.labelKey)}</h3>
                          <p className="line-clamp-3 text-xs text-muted-foreground">{t(capability.summaryKey)}</p>
                        </div>
                      </div>
                      {capability.route && (
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent-foreground" />
                      )}
                    </div>
                    <Badge variant="outline" className={cn('mt-4', STATUS_TINTS[capability.status])}>
                      {t(`status.${capability.status}`)}
                    </Badge>
                  </>
                )

                if (!capability.route) {
                  return (
                    <article key={capability.id} className="rounded-lg border border-border bg-card p-4">
                      {content}
                    </article>
                  )
                }

                return (
                  <Link
                    key={capability.id}
                    to={capability.route}
                    className="group rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {content}
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}

      <section className="space-y-3" aria-labelledby="showcase-pro-heading">
        <div className="space-y-1">
          <h2 id="showcase-pro-heading" className="text-base font-semibold">
            {t('pro.title')}
          </h2>
          <p className="max-w-3xl text-xs text-muted-foreground">{t('pro.description')}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PRO_CATALOG.map((capability) => {
            const Icon = capability.icon
            return (
              <button
                key={capability.id}
                type="button"
                onClick={openProPage}
                data-testid={`pro-capability-${capability.id}`}
                className="group rounded-lg border border-dashed border-border bg-card/60 p-4 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="size-4" aria-hidden />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-medium">{t(capability.labelKey)}</h3>
                      <p className="line-clamp-3 text-xs text-muted-foreground">{t(capability.summaryKey)}</p>
                    </div>
                  </div>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground group-hover:text-accent-foreground"
                    aria-label={t('pro.action')}
                  />
                </div>
                <Badge variant="outline" className="mt-4">
                  {t('pro.badge')}
                </Badge>
              </button>
            )
          })}
        </div>
      </section>

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link to="/settings">Open Settings</Link>
        </Button>
      </div>
    </section>
  )
}
