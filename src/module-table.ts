// agent_plugin_dev/web-module/src/module-table.ts
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import type { ModuleName, WebModuleService } from './types.ts'

const require = createRequire(import.meta.url)

interface ModuleDef {
  /** 模块表键(importmap 映射名) */
  importNames: string[]
  /** 产物文件名(URL 用,.cjs) */
  out: string
  /** 打包入口(node_modules 解析) */
  entry: string
  /** 打包时 external 的裸说明符 */
  external: string[]
}

export const MODULE_DEFS: Record<ModuleName, ModuleDef> = {
  react: {
    importNames: ['react'],
    out: 'react.cjs',
    entry: require.resolve('react'),
    external: [],
  },
  'react-dom/client': {
    importNames: ['react-dom', 'react-dom/client'],
    out: 'react-dom-client.cjs',
    entry: require.resolve('react-dom/client'),
    external: ['react'],
  },
  cordis: {
    importNames: ['cordis'],
    out: 'cordis.cjs',
    entry: require.resolve('cordis'),
    external: [],
  },
}

export class ModuleTable implements WebModuleService {
  readonly version = '0.1.0'
  private cache = new Map<string, string>()

  get modules(): string[] {
    return Object.values(MODULE_DEFS).flatMap((d) => d.importNames)
  }

  get importmap(): Record<string, string> {
    const map: Record<string, string> = {}
    for (const def of Object.values(MODULE_DEFS)) {
      for (const name of def.importNames) map[name] = '/shell/modules/' + def.out
    }
    return map
  }

  resolveModule(name: string): string | undefined {
    for (const def of Object.values(MODULE_DEFS)) {
      if (def.importNames.includes(name)) return '/shell/modules/' + def.out
    }
    return undefined
  }

  /** out: 'react.cjs' | 'react-dom-client.cjs' | 'cordis.cjs';返回浏览器 CJS 代码,未知返回 undefined */
  async build(out: string): Promise<string | undefined> {
    const def = Object.values(MODULE_DEFS).find((d) => d.out === out)
    if (!def) return undefined
    const cached = this.cache.get(def.out)
    if (cached !== undefined) return cached
    const result = await build({
      entryPoints: [def.entry],
      bundle: true,
      format: 'cjs',
      platform: 'browser',
      write: false,
      external: [...def.external, 'node:*'],   // node 内置模块(如 cordis 内 node:fs)浏览器端 external,避免打包解析失败
      logLevel: 'silent',
    })
    const code = result.outputFiles[0].text
    this.cache.set(def.out, code)
    return code
  }
}
