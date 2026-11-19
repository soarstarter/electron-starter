import { afterEach, describe, expect, it, vi } from 'vitest'

const originalEnv = { ...process.env }

const loadMainFeatures = async () => {
  vi.resetModules()
  return import('./feature-flags')
}

afterEach(() => {
  process.env = { ...originalEnv }
  vi.resetModules()
})

describe('mainFeatures', () => {
  it('defaults showcase on for the template build', async () => {
    delete process.env.MAIN_VITE_SHOWCASE_ENABLED
    delete process.env.VITE_SHOWCASE_ENABLED

    const { mainFeatures } = await loadMainFeatures()

    expect(mainFeatures.showcase).toBe(true)
  })

  it('prefers MAIN_VITE_SHOWCASE_ENABLED over the renderer fallback', async () => {
    process.env.MAIN_VITE_SHOWCASE_ENABLED = 'false'
    process.env.VITE_SHOWCASE_ENABLED = 'true'

    const { mainFeatures } = await loadMainFeatures()

    expect(mainFeatures.showcase).toBe(false)
  })

  it('falls back to VITE_SHOWCASE_ENABLED when the main flag is unset', async () => {
    delete process.env.MAIN_VITE_SHOWCASE_ENABLED
    process.env.VITE_SHOWCASE_ENABLED = 'false'

    const { mainFeatures } = await loadMainFeatures()

    expect(mainFeatures.showcase).toBe(false)
  })
})
