import { appIntentSchema, type AppIntent } from '@/lib/conveyor/schemas'
import { PROTOCOL_SCHEME } from '@/shared/constants'

const ROUTE_FLAG = /^--route=(.+)$/
const PROTOCOL_PREFIX = `${PROTOCOL_SCHEME}://`

const extractProtocolRoute = (arg: string): string | null => {
  if (!arg.startsWith(PROTOCOL_PREFIX)) return null
  const rest = arg.slice(PROTOCOL_PREFIX.length).split(/[?#]/)[0] ?? ''
  const trimmed = rest.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!trimmed) return null
  return '/' + trimmed
}

const extractRoute = (arg: string): string | null => {
  const routeMatch = ROUTE_FLAG.exec(arg)
  if (routeMatch) return routeMatch[1] ?? null
  return extractProtocolRoute(arg)
}

export const parseArgvForIntents = (argv: readonly string[]): AppIntent[] => {
  const intents: AppIntent[] = []

  for (const arg of argv) {
    const route = extractRoute(arg)
    if (route === null) continue

    const result = appIntentSchema.safeParse({ type: 'navigate', route })
    if (result.success) {
      intents.push(result.data)
    }
  }

  return intents
}
