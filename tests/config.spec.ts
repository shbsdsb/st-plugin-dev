import { describe, expect, it } from 'vitest'
import apply, { name, configSchema } from '../src/index.ts'

describe('st-ui-slots config', () => {
  it('exposes name and config schema', () => {
    expect(name).toBe('st-ui-slots')
    expect(apply.Config).toBe(configSchema)
  })
  it('schema defaults showCollapsedRail to true when config missing', () => {
    const v = (apply.Config as { '~standard': { validate: (x: unknown) => { value: unknown } } })['~standard']
    const out = v.validate(undefined)
    expect(out.value).toEqual({ showCollapsedRail: true })
  })
  it('schema passes through user showCollapsedRail=false', () => {
    const v = (apply.Config as { '~standard': { validate: (x: unknown) => { value: unknown } } })['~standard']
    const out = v.validate({ showCollapsedRail: false })
    expect(out.value).toEqual({ showCollapsedRail: false })
  })
})
