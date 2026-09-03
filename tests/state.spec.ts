import { describe, it, expect } from 'vitest'
import { createEmptyState, fromRow, applyVendor, checkSave, checkTest } from '../src/ui/state.ts'

describe('state', () => {
  it('createEmptyState 回到空白新预设', () => {
    const s = createEmptyState()
    expect(s).toEqual({ id: null, name: '新预设', format: 'openai_compatible', vendor: '', baseUrl: '', model: '', timeout: 30, hasKey: false })
  })
  it('fromRow 带 id/字段/hasKey', () => {
    const s = fromRow({ id: 7, presetName: '主', format: 'openai_compatible', vendor: 'deepseek', baseUrl: 'api.deepseek.com/v1', model: 'deepseek-chat', timeout: 30, hasKey: true })
    expect(s).toMatchObject({ id: 7, name: '主', vendor: 'deepseek', hasKey: true })
  })
  it('applyVendor 自动填 URL/格式', () => {
    const s = applyVendor(createEmptyState(), 'anthropic')
    expect(s.vendor).toBe('anthropic'); expect(s.format).toBe('anthropic'); expect(s.baseUrl).toBe('api.anthropic.com/v1')
  })
  it('checkSave: 空态无 key 拦截', () => {
    expect(checkSave({ ...createEmptyState(), baseUrl: 'a.com', model: 'm' }, '')).toEqual({ ok: false, field: 'apiKey' })
  })
  it('checkSave: 有 id 可留空 key', () => {
    expect(checkSave({ ...fromRow({ id: 1, presetName: 'p', format: 'openai_compatible', vendor: '', baseUrl: 'a.com', model: 'm', timeout: 30, hasKey: true }), baseUrl: 'a.com', model: 'm' }, '')).toEqual({ ok: true })
  })
  it('checkSave: 缺 baseUrl/model 拦截', () => {
    expect(checkSave({ ...createEmptyState(), model: 'm' }, 'k')).toEqual({ ok: false, field: 'baseUrl' })
    expect(checkSave({ ...createEmptyState(), baseUrl: 'a.com' }, 'k')).toEqual({ ok: false, field: 'model' })
  })
  it('checkTest: 有 id 无 key → id 模式', () => {
    const st = fromRow({ id: 2, presetName: 'p', format: 'openai_compatible', vendor: 'openai', baseUrl: 'a.com', model: 'm', timeout: 30, hasKey: true })
    expect(checkTest(st, { format: 'openai_compatible', baseUrl: 'a.com', model: 'm' }, '')).toEqual({ mode: 'id' })
  })
  it('checkTest: 无 id 有 key → fields 模式', () => {
    expect(checkTest(createEmptyState(), { format: 'openai_compatible', baseUrl: 'a.com', model: 'm' }, 'k')).toEqual({ mode: 'fields' })
  })
  it('checkTest: 空表单/无 key 无 id → missing', () => {
    expect(checkTest(createEmptyState(), { format: 'openai_compatible', baseUrl: '', model: '' }, '')).toEqual({ missing: 'baseUrl' })
    expect(checkTest(createEmptyState(), { format: 'openai_compatible', baseUrl: 'a.com', model: '' }, '')).toEqual({ missing: 'model' })
    expect(checkTest(createEmptyState(), { format: 'openai_compatible', baseUrl: 'a.com', model: 'm' }, '')).toEqual({ missing: 'apiKey' })
  })
})
