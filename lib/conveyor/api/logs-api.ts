import { ConveyorApi } from '@/lib/preload/shared'

export class LogsApi extends ConveyorApi {
  getPath = () => this.invoke('logs-get-path')
  openFolder = () => this.invoke('logs-open-folder')
}
