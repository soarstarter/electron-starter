import { z } from 'zod'

export const navigationRouteSchema = z.enum([
  '/home',
  // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
  '/showcase',
  '/showcase/components',
  '/showcase/file',
  '/settings',
  '/about',
  '/logs',
])

export const appIntentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('navigate'),
    route: navigationRouteSchema,
  }),
])

export const eventSchemas = {
  'app-intent': appIntentSchema,
} as const

export type AppIntent = z.infer<typeof appIntentSchema>
export type NavigationRoute = z.infer<typeof navigationRouteSchema>
export type EventName = keyof typeof eventSchemas
export type EventPayload<T extends EventName> = z.infer<(typeof eventSchemas)[T]>

export const validateEventPayload = <T extends EventName>(event: T, payload: unknown): EventPayload<T> => {
  return eventSchemas[event].parse(payload) as EventPayload<T>
}
