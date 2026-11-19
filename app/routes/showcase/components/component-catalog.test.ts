// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { describe, expect, it } from 'vitest'
import { COMPONENT_CATALOG, COMPONENT_GROUPS, componentsIn } from './component-catalog'

describe('COMPONENT_CATALOG', () => {
  it('has unique ids', () => {
    const ids = COMPONENT_CATALOG.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses known groups and import aliases', () => {
    const groups = new Set(COMPONENT_GROUPS)
    for (const entry of COMPONENT_CATALOG) {
      expect(groups.has(entry.group)).toBe(true)
      expect(entry.importPath).toMatch(/^@\/app\//)
    }
  })

  it('groups entries without inventing records', () => {
    expect(componentsIn('inputs').map((entry) => entry.id)).toEqual(
      COMPONENT_CATALOG.filter((entry) => entry.group === 'inputs').map((entry) => entry.id)
    )
  })
})
