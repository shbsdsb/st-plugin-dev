import { describe, expect, it, afterEach } from 'vitest'
import { readClientConfig } from '../src/use-is-mobile.ts'

function setWindow(v: unknown): void {
  ;(globalThis as Record<string, unknown>).window = v
}

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window
})

describe('readClientConfig', () => {
  it('defaults to showCollapsedRail true when window/global config absent', () => {
    expect(readClientConfig('st-ui-slots')).toEqual({ showCollapsedRail: true })
  })
  it('reads config from window.__CLIENT_CONFIG__', () => {
    setWindow({ __CLIENT_CONFIG__: { 'st-ui-slots': { showCollapsedRail: false } } })
    expect(readClientConfig('st-ui-slots')).toEqual({ showCollapsedRail: false })
  })
  it('returns default when id missing from global config', () => {
    setWindow({ __CLIENT_CONFIG__: {} })
    expect(readClientConfig('st-ui-slots')).toEqual({ showCollapsedRail: true })
  })
})
