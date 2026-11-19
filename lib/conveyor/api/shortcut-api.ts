import { ConveyorApi } from '@/lib/preload/shared'

export class ShortcutApi extends ConveyorApi {
  list = () => this.invoke('shortcuts-list')
}
