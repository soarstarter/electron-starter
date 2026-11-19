import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { useConveyor } from '@/app/hooks/use-conveyor'
import { useToast } from '@/app/hooks/use-toast'

export const LogsPage = () => {
  const { t } = useTranslation('common')
  const { getPath, openFolder } = useConveyor('logs')
  const toast = useToast()
  const [path, setPath] = useState<string | null>(null)
  const [pathError, setPathError] = useState(false)

  useEffect(() => {
    getPath()
      .then(setPath)
      .catch(() => setPathError(true))
  }, [getPath])

  const handleOpenFolder = async () => {
    try {
      const result = await openFolder()
      if (result) {
        toast.error(t('logs.openFailed'))
      } else {
        toast.success(t('logs.opened'))
      }
    } catch {
      toast.error(t('logs.openFailed'))
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">{t('logs.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('logs.description')}</p>
      </header>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3 text-sm">
        <div className="space-y-1">
          <span className="text-muted-foreground">{t('logs.path')}</span>
          <p className="font-mono text-xs break-all">{pathError ? t('logs.pathError') : (path ?? t('logs.loading'))}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleOpenFolder} disabled={!path}>
          <FolderOpen /> {t('logs.openFolder')}
        </Button>
      </div>
    </section>
  )
}
