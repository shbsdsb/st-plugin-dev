// agent_plugin_dev/web-module/src/loader.ts
// 浏览器端 CJS 模块运行时 v3:工厂化 + CLIENT_BOOT 消费。
// 机制:
//   1. 启动物化种子模块(SEEDS 串行)→ 预注册全部清单条目工厂(预取源码 + new Function 包装,不执行)
//      → immed: true 的条目立即物化(执行工厂,exports 进 cache);
//   2. require(id) 同步四层搜索:种子(seedCache)→ 缓存(cache)→ 工厂(factories 物化)→ 启动清单(防御兜底)→ 未命中抛错;
//   3. require 同步语义 → fetch 异步 → 工厂必须启动全部预注册(源码就绪),immed 差异 = 是否启动物化。
// buildLoaderSource 生成浏览器端 loader;resolveSeed/executeCjs 为同逻辑纯函数供测试(保持同步)。
export const BARE_SPEC_RE = /^(\/|\.\/|\.\.\/|[a-zA-Z][a-zA-Z0-9+.-]*:)/;
export function isBareSpecifier(spec) {
    return !BARE_SPEC_RE.test(spec);
}
/** 种子查表:裸说明符 → TABLE URL;URL 原样;未注册抛错 */
export function resolveSeed(spec, table) {
    if (!isBareSpecifier(spec))
        return spec;
    const mapped = table[spec];
    if (!mapped)
        throw new Error('web-module: 未注册模块: ' + spec);
    return mapped;
}
/** new Function 执行 CJS 源码,返回 module.exports(require 由调用方注入) */
export function executeCjs(src, requireFn) {
    const module = { exports: {} };
    new Function('require', 'module', 'exports', src)(requireFn, module, module.exports);
    return module.exports;
}
/** 生成浏览器端 loader 源码(内嵌 TABLE/SEEDS/BOOT;逻辑与纯函数保持同步) */
export function buildLoaderSource(table, seedNames, boot) {
    const tableJson = JSON.stringify(table);
    const seedsJson = JSON.stringify(seedNames);
    const bootJson = JSON.stringify(boot);
    return `window.__ModuleLoader__ = (() => {
  const TABLE = ${tableJson}
  const SEEDS = ${seedsJson}
  const BOOT = ${bootJson}
  const BARE_RE = /^(\\/|\\.\\/|\\.\\.\\/|[a-zA-Z][a-zA-Z0-9+.-]*:)/
  const seedCache = new Map()
  const cache = new Map()
  const factories = new Map()
  function resolveSeed(spec) {
    if (!BARE_RE.test(spec)) {
      const mapped = TABLE[spec]
      if (!mapped) throw new Error('web-module: 未注册模块: ' + spec)
      return mapped
    }
    return spec
  }
  async function fetchText(url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error('web-module: 模块加载失败 ' + url + ' (' + res.status + ')')
    return res.text()
  }
  async function preloadSeed(spec) {
    if (!BARE_RE.test(spec) && !(spec in TABLE)) {
      // 清单 id 未命中种子表 → 跳过(require 四层搜索会走工厂/缓存)
      if (BOOT.some((m) => m.id === spec)) return
      throw new Error('web-module: 未注册模块: ' + spec)
    }
    const url = resolveSeed(spec)
    if (seedCache.has(url)) return seedCache.get(url)
    const src = await fetchText(url)
    const module = { exports: {} }
    new Function('require', 'module', 'exports', src)((s) => require(s), module, module.exports)
    seedCache.set(url, module.exports)
    return module.exports
  }
  async function registerFactory(entry) {
    if (factories.has(entry.id)) return
    const src = await fetchText(entry.url)
    factories.set(entry.id, { url: entry.url, fn: new Function('require', 'module', 'exports', src) })
  }
  function materialize(id) {
    if (cache.has(id)) return cache.get(id)   // immed 物化幂等(重复 bootstrap 不重跑工厂)
    const entry = factories.get(id)
    if (!entry) throw new Error('web-module: 工厂未注册: ' + id)
    const module = { exports: {} }
    entry.fn((s) => require(s), module, module.exports)
    cache.set(id, module.exports)
    return module.exports
  }
  function require(spec) {
    // 1 种子模块(容错:裸说明符 TABLE 命中且已物化才返回;URL 已物化才返回;均未命中继续向下搜索)
    if (!BARE_RE.test(spec)) {
      const url = TABLE[spec]
      if (url !== undefined && seedCache.has(url)) return seedCache.get(url)
    } else if (seedCache.has(spec)) {
      return seedCache.get(spec)
    }
    // 2 缓存(已物化工厂)
    if (cache.has(spec)) return cache.get(spec)
    // 3 工厂函数(已注册未物化 → 物化)
    if (factories.has(spec)) return materialize(spec)
    // 4 启动清单(防御兜底:启动已全部注册,理论不可达;命中则提示注册失败)
    if (BOOT.some((m) => m.id === spec)) {
      throw new Error('web-module: 工厂未注册: ' + spec + '(清单条目,启动注册失败)')
    }
    throw new Error('web-module: 模块未注册: ' + spec)
  }
  async function bootstrap(extraSeeds) {
    for (const s of SEEDS.concat(extraSeeds || [])) {
      await preloadSeed(s)
    }
    for (const entry of BOOT) {
      await registerFactory(entry)
    }
    for (const entry of BOOT) {
      if (entry.immed) materialize(entry.id)
    }
  }
  return {
    table: TABLE,
    require: require,
    bootstrap: bootstrap,
    preloadSeed: preloadSeed
  }
})()`;
}
