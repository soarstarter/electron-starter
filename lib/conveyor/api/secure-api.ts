import { ConveyorApi } from '@/lib/preload/shared'
import type { SecureKey } from '@/lib/conveyor/schemas'

export class SecureApi extends ConveyorApi {
  get = (key: SecureKey) => this.invoke('secure-get', key)
  set = (key: SecureKey, value: string) => this.invoke('secure-set', key, value)
  delete = (key: SecureKey) => this.invoke('secure-delete', key)
}
