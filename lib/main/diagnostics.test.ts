import { describe, expect, it } from 'vitest'
import { diagnosticsSchema } from '@/lib/conveyor/schemas'
import { buildDiagnostics, type DiagnosticsSources } from './diagnostics'

const sources: DiagnosticsSources = {
  name: 'Electron Starter',
  version: '12.1.0',
  commitSha: 'abc1234',
  buildTime: '2026-06-14T00:00:00.000Z',
  versions: { electron: '40.1.0', chromium: '130.0', node: '22.0.0', v8: '13.0' },
  platform: 'darwin',
  release: '25.5.0',
  arch: 'arm64',
  logPath: '/Users/test/Library/Logs/Electron Starter/main.log',
}

describe('buildDiagnostics', () => {
  it('produces a blob that matches the diagnostics schema', () => {
    const result = buildDiagnostics(sources)

    expect(diagnosticsSchema.safeParse(result).success).toBe(true)
    expect(result).toEqual({
      app: { name: 'Electron Starter', version: '12.1.0', commitSha: 'abc1234', buildTime: '2026-06-14T00:00:00.000Z' },
      versions: { electron: '40.1.0', chromium: '130.0', node: '22.0.0', v8: '13.0' },
      os: { platform: 'darwin', release: '25.5.0', arch: 'arm64' },
      logPath: '/Users/test/Library/Logs/Electron Starter/main.log',
    })
  })

  it('redacts secret-shaped values that leak into any string field', () => {
    const result = buildDiagnostics({
      ...sources,
      // A contrived path proving the blob is routed through redactSensitive.
      logPath: '/var/log/app.log?session=eyJhbGciOi_supersecret&token=abc123',
    })

    expect(result.logPath).not.toContain('supersecret')
    expect(result.logPath).not.toContain('abc123')
    expect(result.logPath).toContain('[redacted]')
  })
})
