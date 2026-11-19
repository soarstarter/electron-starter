import { dirname } from 'node:path'
import { shell } from 'electron'
import { handle } from '@/lib/main/shared'
import { getLogFilePath } from '@/lib/main/logger'

export const registerLogsHandlers = () => {
  handle('logs-get-path', () => getLogFilePath())
  // shell.openPath resolves to '' on success or an error string on failure.
  handle('logs-open-folder', () => shell.openPath(dirname(getLogFilePath())))
}
