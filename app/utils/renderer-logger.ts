type LogLevel = 'error' | 'warn' | 'info' | 'debug'
type LogContextValue = string | number | boolean
type LogContext = Record<string, LogContextValue>

const MESSAGE_MAX = 2000
const CONTEXT_VALUE_MAX = 500
const CONTEXT_KEY_MAX = 8

const toMessage = (input: unknown): string => {
  if (input instanceof Error) {
    return input.stack ?? input.message
  }
  if (typeof input === 'string') return input
  try {
    return JSON.stringify(input) ?? String(input)
  } catch {
    return String(input)
  }
}

const truncate = (value: string, max: number): string => (value.length > max ? `${value.slice(0, max - 1)}…` : value)

const bound = (context: LogContext | undefined): LogContext | undefined => {
  if (!context) return undefined
  const entries = Object.entries(context).slice(0, CONTEXT_KEY_MAX)
  const bounded: LogContext = {}
  for (const [key, value] of entries) {
    bounded[key] = typeof value === 'string' ? truncate(value, CONTEXT_VALUE_MAX) : value
  }
  return bounded
}

const createEntry = (payload: unknown, context?: LogContext) => ({
  message: truncate(toMessage(payload), MESSAGE_MAX) || 'unknown renderer log entry',
  context: bound(context),
})

export const logRendererEntry = (level: LogLevel, payload: unknown, context?: LogContext): void => {
  const entry = { level, ...createEntry(payload, context) }

  if (typeof window === 'undefined' || !window.conveyor?.app?.log) {
    if (level === 'error') console.error(entry.message, context)
    else if (level === 'warn') console.warn(entry.message, context)
    return
  }

  window.conveyor.app.log(entry).catch((error) => {
    console.error('Failed to forward renderer log entry to main:', error)
  })
}

export const logRendererError = (error: unknown, context?: LogContext): void => {
  logRendererEntry('error', error, context)
}
