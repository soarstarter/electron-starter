import { ConveyorApi } from '@/lib/preload/shared'
import type { ChannelArgs } from '@/lib/conveyor/schemas'

export class NotificationApi extends ConveyorApi {
  notify = (payload: ChannelArgs<'notify'>[0]) => this.invoke('notify', payload)
}
