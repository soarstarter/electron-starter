import { handle } from '@/lib/main/shared'
import type { NotificationsService } from '@/lib/main/notifications'

export const registerNotificationHandlers = (notificationsService: NotificationsService) => {
  handle('notify', (_event, payload) => notificationsService.notify(payload))
}
