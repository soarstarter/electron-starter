import { handle } from '@/lib/main/shared'
import type { ShortcutRegistry } from '@/lib/main/shortcuts'

export const registerShortcutHandlers = (shortcutRegistry: ShortcutRegistry) => {
  handle('shortcuts-list', () => shortcutRegistry.list())
}
