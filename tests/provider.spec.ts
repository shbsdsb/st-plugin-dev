import { describe, it, expect } from 'vitest'
import { VENDOR_BASE_URLS, VENDOR_FORMATS, computeAutoValues } from '../src/ui/provider.ts'

describe('provider', () => {
  it('常量与后端一致', () => {
    expect(VENDOR_BASE_URLS.deepseek).toBe('api.deepseek.com/v1')
    expect(VENDOR_FORMATS.anthropic).toBe('anthropic')
    expect(VENDOR_FORMATS.google).toBe('google')
  })
  it('computeAutoValues', () => {
    expect(computeAutoValues('google')).toEqual({ baseUrl: 'generativelanguage.googleapis.com/v1beta', format: 'google' })
    expect(computeAutoValues('')).toEqual({ baseUrl: '', format: '' })
  })
})
