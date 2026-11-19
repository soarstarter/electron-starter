import { z } from 'zod'

export const shortcutScopeSchema = z.enum(['menu', 'global', 'in-window'])

export const resolvedShortcutSchema = z.object({
  id: z.string().min(1).max(64),
  accelerator: z.string().min(1).max(128),
  scope: shortcutScopeSchema,
  description: z.string().min(1).max(200),
})

export type ResolvedShortcut = z.infer<typeof resolvedShortcutSchema>
export type ShortcutScope = z.infer<typeof shortcutScopeSchema>

export const shortcutIpcSchema = {
  'shortcuts-list': {
    args: z.tuple([]),
    return: z.array(resolvedShortcutSchema),
  },
}
