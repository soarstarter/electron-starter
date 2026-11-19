// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import type { TemplateCapability } from '@/app/showcase/capability-types'
import { cn } from '@/lib/utils'
import { STATUS_TINTS } from './showcase-styles'

interface DemoShellProps {
  capability: TemplateCapability
  children: ReactNode
}

export const DemoShell = ({ capability, children }: DemoShellProps) => {
  const { t } = useTranslation('showcase')
  const Icon = capability.icon

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-5">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/showcase">
            <ArrowLeft className="size-4" aria-hidden />
            {t('actions.back')}
          </Link>
        </Button>
      </div>

      <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold">{t(capability.labelKey)}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">{t(capability.summaryKey)}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn('shrink-0', STATUS_TINTS[capability.status])}>
          {t(`status.${capability.status}`)}
        </Badge>
      </header>

      <div className={cn('rounded-lg border p-4 text-sm', STATUS_TINTS[capability.status])}>
        {t(`callouts.${capability.status}`)}
      </div>

      <div>{children}</div>

      {capability.sourceFiles && capability.sourceFiles.length > 0 && (
        <footer className="space-y-2 border-t border-border pt-4">
          <h2 className="text-sm font-semibold">{t('sourceFiles')}</h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {capability.sourceFiles.map((file) => (
              <li key={file} className="rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs">
                {file}
              </li>
            ))}
          </ul>
        </footer>
      )}
    </section>
  )
}
