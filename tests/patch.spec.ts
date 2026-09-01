import { describe, expect, it, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parsePatch, readPatch, applyEntries, extractHeaderComments, writePatch } from '../src/patch.ts'

const dirs: string[] = []
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) })

function tmpDir(): string {
  const dir = mkdtempSync(resolve(tmpdir(), 'ps-patch-'))
  dirs.push(dir)
  return dir
}

describe('parsePatch', () => {
  it('解析 id + config 条目(config 可缺省)', () => {
    const list = parsePatch('- id: a\n  config:\n    port: 8080\n- id: b\n', 't')
    expect(list).toEqual([{ id: 'a', config: { port: 8080 } }, { id: 'b' }])
  })
  it('顶层非数组 → 抛错', () => {
    expect(() => parsePatch('a: 1\n', 't')).toThrow('顶层必须为数组')
  })
  it('条目含 id/config 之外字段 → 抛错', () => {
    expect(() => parsePatch('- id: a\n  name: x\n', 't')).toThrow('仅允许 id + config')
  })
  it('条目缺 id → 抛错', () => {
    expect(() => parsePatch('- config: {}\n', 't')).toThrow('缺少 id')
  })
})

describe('readPatch', () => {
  it('文件不存在 → []', async () => {
    await expect(readPatch(join(tmpDir(), 'nope.yml'))).resolves.toEqual([])
  })
})

describe('applyEntries(整行替换语义)', () => {
  it('存在 → 整行替换 config(未提交字段消失)', () => {
    expect(applyEntries([{ id: 'a', config: { port: 8080, open: true } }], [{ id: 'a', config: { port: 9090 } }]))
      .toEqual([{ id: 'a', config: { port: 9090 } }])
  })
  it('不存在 → 追加到末尾', () => {
    expect(applyEntries([{ id: 'a' }], [{ id: 'b', config: { x: 1 } }]))
      .toEqual([{ id: 'a' }, { id: 'b', config: { x: 1 } }])
  })
  it('config 为 null → 删除字段保留 id', () => {
    expect(applyEntries([{ id: 'a', config: { x: 1 } }], [{ id: 'a', config: null }]))
      .toEqual([{ id: 'a' }])
  })
})

describe('extractHeaderComments + writePatch', () => {
  it('提取顶部注释块(含紧随空行),条目行处停止', () => {
    expect(extractHeaderComments('# 注释一\n# 注释二\n\n- id: a\n')).toBe('# 注释一\n# 注释二\n')
    expect(extractHeaderComments('- id: a\n')).toBe('')
  })
  it('writePatch 保留注释 + dump 条目,可再读回', async () => {
    const dir = tmpDir()
    const file = join(dir, 'cordis.patch.yml')
    await writePatch(file, [{ id: 'a', config: { port: 8080 } }]) // 文件不存在 → 生成
    const text = await readFile(file, 'utf8')
    expect(text).toContain('- id: a')
    expect(text).toContain('port: 8080')
    // 带注释的既有文件:注释保留
    writeFileSync(file, '# 顶部注释\n')
    await writePatch(file, [{ id: 'a', config: { port: 8080 } }])
    const text2 = await readFile(file, 'utf8')
    expect(text2).toContain('# 顶部注释')
    expect(await readPatch(file)).toEqual([{ id: 'a', config: { port: 8080 } }])
  })
})
