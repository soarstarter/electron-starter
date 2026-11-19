import { describe, expect, it } from 'vitest'
import { matchesAccelerator, parseAccelerator } from './accelerator'

const createEvent = (init: Partial<KeyboardEvent>): KeyboardEvent =>
  ({
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    key: '',
    ...init,
  }) as KeyboardEvent

describe('parseAccelerator', () => {
  it('parses platform-resolved Cmd+K into modifier flags + key', () => {
    expect(parseAccelerator('Cmd+K')).toEqual({ meta: true, ctrl: false, alt: false, shift: false, key: 'k' })
  })

  it('parses Ctrl+Shift+P', () => {
    expect(parseAccelerator('Ctrl+Shift+P')).toEqual({
      meta: false,
      ctrl: true,
      alt: false,
      shift: true,
      key: 'p',
    })
  })

  it('translates named keys (Comma, Space, Esc, Return, Plus)', () => {
    expect(parseAccelerator('Cmd+Comma').key).toBe(',')
    expect(parseAccelerator('Space').key).toBe(' ')
    expect(parseAccelerator('Esc').key).toBe('escape')
    expect(parseAccelerator('Return').key).toBe('enter')
    expect(parseAccelerator('Plus').key).toBe('+')
  })
})

describe('matchesAccelerator', () => {
  it('matches when modifiers and key align case-insensitively', () => {
    expect(matchesAccelerator(createEvent({ metaKey: true, key: 'K' }), parseAccelerator('Cmd+K'))).toBe(true)
    expect(matchesAccelerator(createEvent({ metaKey: true, key: 'k' }), parseAccelerator('Cmd+K'))).toBe(true)
  })

  it('rejects when an extra modifier is held', () => {
    expect(
      matchesAccelerator(createEvent({ metaKey: true, shiftKey: true, key: 'k' }), parseAccelerator('Cmd+K'))
    ).toBe(false)
  })

  it('rejects when the key differs', () => {
    expect(matchesAccelerator(createEvent({ metaKey: true, key: 'p' }), parseAccelerator('Cmd+K'))).toBe(false)
  })
})
