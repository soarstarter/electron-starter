import os from 'node:os'
import type { App } from 'electron'
import type { Diagnostics } from '@/lib/conveyor/schemas'
import { getLogFilePath } from './logger'
import { redactSensitive } from './log-redact'

export interface DiagnosticsSources {
  name: string
  version: string
  commitSha: string
  buildTime: string
  versions: { electron: string; chromium: string; node: string; v8: string }
  platform: string
  release: string
  arch: string
  logPath: string
}

export const collectDiagnosticsSources = (app: Pick<App, 'getName' | 'getVersion'>): DiagnosticsSources => ({
  name: app.getName(),
  version: app.getVersion(),
  commitSha: __APP_COMMIT_SHA__,
  buildTime: __APP_BUILD_TIME__,
  versions: {
    electron: process.versions.electron ?? 'unknown',
    chromium: process.versions.chrome ?? 'unknown',
    node: process.versions.node ?? 'unknown',
    v8: process.versions.v8 ?? 'unknown',
  },
  platform: process.platform,
  release: os.release(),
  arch: process.arch,
  logPath: getLogFilePath(),
})

/**
 * Assemble the diagnostics blob and scrub it through `redactSensitive` so any
 * field that later starts carrying a secret (token, session, signed URL) is
 * stripped before it leaves the main process.
 */
export const buildDiagnostics = (sources: DiagnosticsSources): Diagnostics =>
  redactSensitive({
    app: {
      name: sources.name,
      version: sources.version,
      commitSha: sources.commitSha,
      buildTime: sources.buildTime,
    },
    versions: sources.versions,
    os: {
      platform: sources.platform,
      release: sources.release,
      arch: sources.arch,
    },
    logPath: sources.logPath,
  })

export const getDiagnostics = (app: Pick<App, 'getName' | 'getVersion'>): Diagnostics =>
  buildDiagnostics(collectDiagnosticsSources(app))
