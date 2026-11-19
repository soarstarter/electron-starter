import { describe, expect, it } from 'vitest'
import { parseArgvForIntents } from './argv-intents'

describe('parseArgvForIntents', () => {
  it('parses --route= flags into validated navigate intents', () => {
    const intents = parseArgvForIntents(['/path/to/electron', '.', '--route=/settings'])
    expect(intents).toEqual([{ type: 'navigate', route: '/settings' }])
  })

  it('preserves the order of multiple intent flags', () => {
    const intents = parseArgvForIntents(['--route=/about', '--route=/home'])
    expect(intents).toEqual([
      { type: 'navigate', route: '/about' },
      { type: 'navigate', route: '/home' },
    ])
  })

  it.each([
    ['--route=/admin'],
    ['--route=https://example.com'],
    ['--route='],
    ['--ROUTE=/settings'],
    ['route=/settings'],
  ])('rejects unsupported or malformed argv entry %s', (entry) => {
    expect(parseArgvForIntents([entry])).toEqual([])
  })

  it('ignores unrelated arguments', () => {
    expect(parseArgvForIntents(['/path/to/electron', '.', '--inspect=5858', 'unrelated'])).toEqual([])
  })

  it.each([
    ['electron-starter://settings', '/settings'],
    ['electron-starter://about', '/about'],
    ['electron-starter://home', '/home'],
    // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
    ['electron-starter://showcase', '/showcase'],
    ['electron-starter://showcase/components', '/showcase/components'],
    ['electron-starter://showcase/file', '/showcase/file'],
    ['electron-starter:///settings', '/settings'],
    ['electron-starter://settings/', '/settings'],
    ['electron-starter://settings?ref=launchpad', '/settings'],
    ['electron-starter://settings#section', '/settings'],
  ])('parses %s into a validated navigate intent', (entry, expectedRoute) => {
    expect(parseArgvForIntents([entry])).toEqual([{ type: 'navigate', route: expectedRoute }])
  })

  it.each([
    ['electron-starter://'],
    ['electron-starter://unknown'],
    ['electron-starter://account'],
    ['electron-starter://settings/extra'],
    ['ELECTRON-STARTER://settings'],
    ['other://settings'],
  ])('rejects malformed or unsupported protocol url %s', (entry) => {
    expect(parseArgvForIntents([entry])).toEqual([])
  })

  it('mixes --route and electron-starter:// argv entries while preserving order', () => {
    expect(parseArgvForIntents(['--route=/home', 'electron-starter://about', '--route=/settings'])).toEqual([
      { type: 'navigate', route: '/home' },
      { type: 'navigate', route: '/about' },
      { type: 'navigate', route: '/settings' },
    ])
  })
})
