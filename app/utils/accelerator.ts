export interface ParsedAccelerator {
  meta: boolean
  ctrl: boolean
  alt: boolean
  shift: boolean
  key: string
}

// Map Electron's "named keys" to KeyboardEvent.key values we can compare against.
// We rely on event.key for character keys (which respects layout) and `.code`
// only as a fallback for the non-printable named keys below.
const NAMED_KEY_TO_EVENT_KEY: Record<string, string> = {
  return: 'enter',
  esc: 'escape',
  space: ' ',
  plus: '+',
  comma: ',',
}

const MODIFIERS: Record<string, keyof Omit<ParsedAccelerator, 'key'>> = {
  cmd: 'meta',
  command: 'meta',
  meta: 'meta',
  super: 'meta',
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  option: 'alt',
  shift: 'shift',
}

export const parseAccelerator = (accelerator: string): ParsedAccelerator => {
  const parsed: ParsedAccelerator = { meta: false, ctrl: false, alt: false, shift: false, key: '' }
  for (const part of accelerator.split('+')) {
    const token = part.trim().toLowerCase()
    if (!token) continue
    const modifier = MODIFIERS[token]
    if (modifier) {
      parsed[modifier] = true
      continue
    }
    parsed.key = NAMED_KEY_TO_EVENT_KEY[token] ?? token
  }
  return parsed
}

export const matchesAccelerator = (event: KeyboardEvent, parsed: ParsedAccelerator): boolean => {
  if (event.metaKey !== parsed.meta) return false
  if (event.ctrlKey !== parsed.ctrl) return false
  if (event.altKey !== parsed.alt) return false
  if (event.shiftKey !== parsed.shift) return false
  return event.key.toLowerCase() === parsed.key
}
