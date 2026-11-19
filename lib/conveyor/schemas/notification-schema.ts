import { z } from 'zod'

const MAX_NOTIFICATION_TITLE_LEN = 120
const MAX_NOTIFICATION_BODY_LEN = 500

export const notifyDropReasonSchema = z.enum(['disabled', 'unsupported'])

export const notificationPayloadSchema = z.object({
  title: z.string().min(1).max(MAX_NOTIFICATION_TITLE_LEN),
  body: z.string().min(1).max(MAX_NOTIFICATION_BODY_LEN),
  silent: z.boolean().optional(),
})

export const notifyResultSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true) }),
  z.object({ ok: z.literal(false), reason: notifyDropReasonSchema }),
])

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>
export type NotifyResult = z.infer<typeof notifyResultSchema>

export const notificationIpcSchema = {
  notify: {
    args: z.tuple([notificationPayloadSchema]),
    return: notifyResultSchema,
  },
}
