import { ConveyorApi } from '@/lib/preload/shared'
import type { ChannelArgs, EventPayload } from '@/lib/conveyor/schemas'

export class AppApi extends ConveyorApi {
  version = () => this.invoke('version')
  getSettings = () => this.invoke('get-settings')
  setSettings = (patch: ChannelArgs<'set-settings'>[0]) => this.invoke('set-settings', patch)
  resetSettings = () => this.invoke('reset-settings')
  readyForIntents = () => this.invoke('app-intents-ready')
  onAppIntent = (listener: (payload: EventPayload<'app-intent'>) => void) => this.subscribe('app-intent', listener)
  log = (entry: ChannelArgs<'app-log'>[0]) => this.invoke('app-log', entry)
  showLogs = () => this.invoke('app-show-logs')
  getDiagnostics = () => this.invoke('app-get-diagnostics')
  getLocale = () => this.invoke('app-get-locale')
  setLocale = (locale: ChannelArgs<'app-set-locale'>[0]) => this.invoke('app-set-locale', locale)
  exportData = () => this.invoke('app-export-data')
  importData = () => this.invoke('app-import-data')
}
