import { describe, expect, it } from 'vitest'
import { isAllowedInternalNavigation, type NavigationContext } from './navigation-guard'

const devContext = (overrides: Partial<NavigationContext> = {}): NavigationContext => ({
  loadedUrl: 'http://localhost:5173/',
  devRendererUrl: 'http://localhost:5173',
  isPackaged: false,
  ...overrides,
})

const prodContext = (overrides: Partial<NavigationContext> = {}): NavigationContext => ({
  loadedUrl: 'file:///app/out/renderer/index.html',
  devRendererUrl: undefined,
  isPackaged: true,
  ...overrides,
})

describe('isAllowedInternalNavigation', () => {
  it('allows navigation back to the dev renderer origin in development', () => {
    expect(isAllowedInternalNavigation('http://localhost:5173/foo', devContext())).toBe(true)
  })

  it('rejects cross-origin navigation in development', () => {
    expect(isAllowedInternalNavigation('https://example.com/', devContext())).toBe(false)
    expect(isAllowedInternalNavigation('http://localhost:9999/', devContext())).toBe(false)
  })

  it('allows reloading the same file:// document in packaged builds', () => {
    const url = 'file:///app/out/renderer/index.html'
    expect(isAllowedInternalNavigation(url, prodContext({ loadedUrl: url }))).toBe(true)
  })

  it('rejects navigation to a different file:// path in packaged builds', () => {
    const context = prodContext({ loadedUrl: 'file:///app/out/renderer/index.html' })
    expect(isAllowedInternalNavigation('file:///etc/passwd', context)).toBe(false)
  })

  it.each(['https://example.com/', 'javascript:alert(1)', 'about:blank', 'not-a-url'])(
    'rejects %s in packaged builds',
    (url) => {
      expect(isAllowedInternalNavigation(url, prodContext())).toBe(false)
    }
  )

  it('rejects navigation before the first document load completes', () => {
    expect(isAllowedInternalNavigation('https://example.com/', prodContext({ loadedUrl: null }))).toBe(false)
  })
})
