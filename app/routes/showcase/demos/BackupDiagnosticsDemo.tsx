// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { useState } from 'react'
import { ArchiveRestore, ClipboardList } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { useConveyor } from '@/app/hooks/use-conveyor'
import type { Diagnostics } from '@/lib/conveyor/schemas'

export const BackupDiagnosticsDemo = () => {
  const app = useConveyor('app')
  const [backupStatus, setBackupStatus] = useState('Choose an export or import action.')
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null)

  const exportData = async () => {
    const result = await app.exportData()
    setBackupStatus(result.canceled ? 'Export canceled.' : `Exported to ${result.path}.`)
  }

  const importData = async () => {
    const result = await app.importData()
    if (result.status === 'canceled') setBackupStatus('Import canceled.')
    else if (result.status === 'error') setBackupStatus(result.message)
    else setBackupStatus(`Imported settings. Secure keys present: ${result.secureKeysPresent.join(', ') || 'none'}.`)
  }

  const loadDiagnostics = async () => {
    setDiagnostics(await app.getDiagnostics())
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <ArchiveRestore className="size-4" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold">Backup and restore</h2>
            <p className="text-sm text-muted-foreground">{backupStatus}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void exportData()}>Export settings</Button>
          <Button variant="outline" onClick={() => void importData()}>
            Import settings
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <ClipboardList className="size-4" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold">Diagnostics report</h2>
            <p className="text-sm text-muted-foreground">Load the redacted support payload from the main process.</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => void loadDiagnostics()}>
          Load diagnostics
        </Button>
        {diagnostics && (
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">App</dt>
              <dd>{diagnostics.app.version}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Electron</dt>
              <dd>{diagnostics.versions.electron}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">OS</dt>
              <dd>{`${diagnostics.os.platform} ${diagnostics.os.arch}`}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Log path</dt>
              <dd className="max-w-[65%] truncate font-mono text-xs" title={diagnostics.logPath}>
                {diagnostics.logPath}
              </dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  )
}
