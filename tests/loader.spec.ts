// agent_plugin_dev/web-module/tests/loader.spec.ts
import { describe, expect, it } from 'vitest'
import { buildLoaderSource, resolveSeed, executeCjs, isBareSpecifier } from '../src/loader.ts'

const TABLE = {
  react: '/shell/modules/react.cjs',
  'react-dom': '/shell/modules/react-dom-client.cjs',
  'react-dom/client': '/shell/modules/react-dom-client.cjs',
  cordis: '/shell/modules/cordis.cjs',
}

const BOOT = [
  { id: 'hello-web', url: '/hello-web/index.cjs', inject: [] as string[], immed: true },
  { id: 'lazy-web', url: '/lazy-web/index.cjs', inject: ['hello-web'] as string[], immed: false },
]

describe('isBareSpecifier', () => {
  it('裸说明符与 URL 判定', () => {
    expect(isBareSpecifier('react')).toBe(true)
    expect(isBareSpecifier('/a.cjs')).toBe(false)
    expect(isBareSpecifier('./a.cjs')).toBe(false)
    expect(isBareSpecifier('http://x/a.cjs')).toBe(false)
  })
})

describe('executeCjs', () => {
  it('new Function 执行 CJS,require 注入,exports 赋值', () => {
    const src = `var React = require('react'); module.exports = { name: 'x', hooks: typeof React.useState }`
    const exports = executeCjs(src, (spec) => (spec === 'react' ? { useState: function () {} } : (() => { throw new Error('unexpected ' + spec) })()))
    expect(exports.name).toBe('x')
    expect(exports.hooks).toBe('function')
  })

  it('module.exports 整体替换(module.exports = plugin)', () => {
    const exports = executeCjs(`module.exports = { mount: function () {} }`, () => ({}))
    expect(typeof exports.mount).toBe('function')
  })
})

describe('loader v3 工厂化', () => {
  it('resolveSeed:裸说明符查表/URL 原样/未注册抛错', () => {
    expect(resolveSeed('react', TABLE)).toBe('/shell/modules/react.cjs')
    expect(resolveSeed('/x.cjs', TABLE)).toBe('/x.cjs')
    expect(() => resolveSeed('vue', TABLE)).toThrow('未注册模块: vue')
  })

  it('buildLoaderSource:内嵌 TABLE/SEEDS/BOOT 与四层 require', () => {
    const src = buildLoaderSource(TABLE, ['react', 'react-dom', 'react-dom/client', 'cordis'], BOOT)
    expect(src.startsWith('window.__ModuleLoader__ = (() => {')).toBe(true)
    expect(src).toContain('"/hello-web/index.cjs"')
    expect(src).toContain('factories')
    expect(src).toContain('seedCache')
    expect(src).toContain('immed')
    expect(src).toContain('模块未注册')
    expect(src).toContain('bootstrap')
  })

  it('executeCjs:工厂源码经 new Function 执行,require 注入', () => {
    const src = `var React = require('react'); module.exports = { name: 'x', hooks: typeof React.useState }`
    const exports = executeCjs(src, (spec) => (spec === 'react' ? { useState: function () {} } : (() => { throw new Error('unexpected ' + spec) })()))
    expect(exports.name).toBe('x')
    expect(exports.hooks).toBe('function')
  })
})
