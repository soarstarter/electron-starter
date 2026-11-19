import { z } from 'zod'

export const logsIpcSchema = {
  'logs-get-path': {
    args: z.tuple([]),
    // Absolute path to the active log file.
    return: z.string(),
  },
  'logs-open-folder': {
    args: z.tuple([]),
    // `shell.openPath` resolves to '' on success or an error message on failure.
    return: z.string(),
  },
}
