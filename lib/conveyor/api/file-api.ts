import { ConveyorApi } from '@/lib/preload/shared'
import type { ChannelArgs } from '@/lib/conveyor/schemas'

export class FileApi extends ConveyorApi {
  openFile = () => this.invoke('file-open')
  openLastFile = () => this.invoke('file-open-last')
  openFilePath = (path: string) => this.invoke('file-open-path', path)
  saveFile = (payload: ChannelArgs<'file-save'>[0]) => this.invoke('file-save', payload)
  openImage = (payload: ChannelArgs<'file-open-image'>[0]) => this.invoke('file-open-image', payload)
}
