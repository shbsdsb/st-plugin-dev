// agent_plugin_dev/web-module/tests/module-table.spec.ts
import { describe, expect, it } from 'vitest'
import { ModuleTable } from '../src/module-table.ts'

describe('ModuleTable', () => {
  it('模块表覆盖全部核心依赖(.cjs 产物)', () => {
    const t = new ModuleTable()
    expect(t.importmap).toEqual({
      react: '/shell/modules/react.cjs',
      'react-dom': '/shell/modules/react-dom-client.cjs',
      'react-dom/client': '/shell/modules/react-dom-client.cjs',
      cordis: '/shell/modules/cordis.cjs',
    })
  })

  it('modules 清单 = 模块表键', () => {
    expect(new ModuleTable().modules).toEqual(['react', 'react-dom', 'react-dom/client', 'cordis'])
  })

  it('resolveModule:已注册返回 URL,未注册 undefined', () => {
    const t = new ModuleTable()
    expect(t.resolveModule('react')).toBe('/shell/modules/react.cjs')
    expect(t.resolveModule('vue')).toBeUndefined()
  })

  it('build:react 产物是浏览器 CJS,exports 含 useState', async () => {
    const code = await new ModuleTable().build('react.cjs')
    expect(code).toBeDefined()
    expect(code).toContain('module.exports')
    expect(code).not.toContain('import ')
  })

  it('build:react-dom-client 产物 external react(含 require("react"),无 import)', async () => {
    const code = await new ModuleTable().build('react-dom-client.cjs')
    expect(code).toContain('require("react")')
    expect(code).not.toContain('import ')
  })

  it('build:cordis 产物是浏览器 CJS', async () => {
    const code = await new ModuleTable().build('cordis.cjs')
    expect(code).toBeDefined()
    expect(code).toContain('module.exports')
  })

  it('build:未知产物名返回 undefined', async () => {
    expect(await new ModuleTable().build('nope.cjs')).toBeUndefined()
  })

  it('build:相同产物名走内存缓存(引用相等)', async () => {
    const t = new ModuleTable()
    const a = await t.build('react.cjs')
    const b = await t.build('react.cjs')
    expect(b).toBe(a)
  })
})
