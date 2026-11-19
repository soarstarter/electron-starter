import log from 'electron-log/main'

const MAX_LOG_BYTES = 5 * 1024 * 1024

let initialized = false

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'
type MainErrorReporter = (error: Error, context: Record<string, string | number | boolean>) => void

export const initializeLogger = (reportMainError?: MainErrorReporter): void => {
  if (initialized) return

  log.transports.file.level = 'info'
  log.transports.file.maxSize = MAX_LOG_BYTES
  log.transports.console.level = 'debug'
  log.errorHandler.startCatching({
    showDialog: false,
    onError: ({ error, errorName }) => {
      reportMainError?.(error, { source: 'electron-log', errorName })
    },
  })

  initialized = true
}

export const getLogFilePath = (): string => log.transports.file.getFile().path

export interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, string | number | boolean>
  source?: 'main' | 'renderer'
}

export const writeLog = ({ level, message, context, source = 'main' }: LogEntry): void => {
  const tag = `[${source}]`
  if (context && Object.keys(context).length > 0) {
    log[level](tag, message, context)
  } else {
    log[level](tag, message)
  }
}
