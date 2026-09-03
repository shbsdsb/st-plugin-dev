import { describe, it, expect, beforeEach } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { initPresets, createPreset, listPresets, getPreset, updatePreset, deletePreset, type PresetInput } from '../src/db.ts'

const input: PresetInput = { presetName: '默认', format: 'openai_compatible', vendor: 'deepseek', baseUrl: 'api.deepseek.com/v1', model: 'deepseek-chat', timeout: 30 }

describe('db', () => {
  let db: DatabaseSync
  beforeEach(() => { db = new DatabaseSync(':memory:'); initPresets(db) })

  it('createPreset 返回自增 id(=rowid)', () => {
    const id = createPreset(db, input)
    expect(typeof id).toBe('number')
    expect(id).toBeGreaterThan(0)
    const id2 = createPreset(db, { ...input, presetName: 'b' })
    expect(id2).toBe(id + 1)
  })

  it('listPresets 返回全部包含 id', () => {
    createPreset(db, input)
    createPreset(db, { ...input, presetName: 'b' })
    const rows = listPresets(db)
    expect(rows).toHaveLength(2)
    expect(rows[0].id).toBe(1)
    expect(rows[0].presetName).toBe('默认')
  })

  it('getPreset / update / delete', () => {
    const id = createPreset(db, input)
    expect(getPreset(db, id)?.model).toBe('deepseek-chat')
    expect(updatePreset(db, id, { ...input, model: 'glm-4' })).toBe(true)
    expect(getPreset(db, id)?.model).toBe('glm-4')
    expect(deletePreset(db, id)).toBe(true)
    expect(getPreset(db, id)).toBeNull()
  })

  it('update/delete 不存在的 id 返回 false', () => {
    expect(updatePreset(db, 999, input)).toBe(false)
    expect(deletePreset(db, 999)).toBe(false)
  })
})
