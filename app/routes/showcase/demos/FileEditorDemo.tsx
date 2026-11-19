// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock, FileText, X } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { useConveyor } from '@/app/hooks/use-conveyor'

const basename = (filePath: string): string => filePath.split(/[\\/]/).pop() || filePath

export const FileEditorDemo = () => {
  const { openFile, openLastFile, openFilePath, saveFile } = useConveyor('file')
  const { getSettings, setSettings } = useConveyor('app')
  const [path, setPath] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [status, setStatus] = useState<string>('No file opened.')
  const [recentFiles, setRecentFiles] = useState<string[]>([])

  const fileLabel = useMemo(() => (path ? basename(path) : 'Untitled'), [path])

  const refreshRecentFiles = useCallback(async () => {
    try {
      const settings = await getSettings()
      setRecentFiles(settings.recentFiles)
    } catch (error) {
      console.error('Failed to load recent files:', error)
    }
  }, [getSettings])

  useEffect(() => {
    void refreshRecentFiles()
  }, [refreshRecentFiles])

  const handleOpen = async () => {
    const result = await openFile()
    if (result.canceled || !result.path || result.content == null) return

    setPath(result.path)
    setContent(result.content)
    setIsDirty(false)
    setStatus(`Opened ${result.path}`)
    void refreshRecentFiles()
  }

  const handleOpenRecent = async (recentPath: string) => {
    const result = await openFilePath(recentPath)
    if (result.canceled || !result.path || result.content == null) {
      setStatus(`Could not open ${recentPath} — it may have been moved or deleted.`)
      void refreshRecentFiles()
      return
    }

    setPath(result.path)
    setContent(result.content)
    setIsDirty(false)
    setStatus(`Opened ${result.path}`)
    void refreshRecentFiles()
  }

  const handleClearRecent = async () => {
    try {
      await setSettings({ recentFiles: [] })
      setRecentFiles([])
    } catch (error) {
      console.error('Failed to clear recent files:', error)
    }
  }

  useEffect(() => {
    openLastFile()
      .then((result) => {
        if (result.canceled || !result.path || result.content == null) return

        setPath(result.path)
        setContent(result.content)
        setIsDirty(false)
        setStatus(`Restored ${result.path}`)
      })
      .catch((error) => {
        console.error('Failed to restore last opened document:', error)
      })
  }, [openLastFile])

  const handleSave = async (saveAs = false) => {
    const result = await saveFile({ content, saveAs })

    if (result.canceled) return

    setPath(result.path)
    setIsDirty(false)
    setStatus(`Saved ${result.path}`)
    void refreshRecentFiles()
  }

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <h2 className="text-base font-semibold">Open File</h2>
      <p className="text-sm text-muted-foreground">Open a text file, edit it, and save changes back to disk.</p>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={handleOpen}>
            Open
          </Button>
          <Button size="sm" onClick={() => handleSave(false)} disabled={!isDirty && path != null}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleSave(true)}>
            Save As
          </Button>
          <span className="text-xs text-muted-foreground">
            {fileLabel}
            {isDirty ? ' (unsaved)' : ''}
          </span>
        </div>

        <textarea
          value={content}
          onChange={(event) => {
            setContent(event.target.value)
            setIsDirty(true)
          }}
          placeholder="Open a text file to start editing..."
          className="min-h-[420px] w-full rounded-md border border-input bg-background p-3 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />

        <p className="text-xs text-muted-foreground">{status}</p>
      </div>

      {recentFiles.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <Clock className="size-4 text-muted-foreground" aria-hidden />
              Recent files
            </h2>
            <Button size="sm" variant="ghost" onClick={handleClearRecent}>
              <X className="size-3.5" aria-hidden />
              Clear
            </Button>
          </div>
          <ul className="space-y-0.5">
            {recentFiles.map((recentPath) => (
              <li key={recentPath}>
                <button
                  type="button"
                  onClick={() => void handleOpenRecent(recentPath)}
                  title={recentPath}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{basename(recentPath)}</span>
                  <span className="hidden max-w-[55%] truncate text-xs text-muted-foreground sm:inline">
                    {recentPath}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
