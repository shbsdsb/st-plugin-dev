// agent_plugin_dev/web-module/src/shell-page.ts
import type { WebModuleService, ClientBootEntry } from './types.ts'
import { buildLoaderSource } from './loader.ts'

export function renderShellPage(service: WebModuleService, boot: ClientBootEntry[], defaultPlugin?: string): string {
  const modules = JSON.stringify(service.modules)
  const version = JSON.stringify(service.version)
  const loader = buildLoaderSource(service.importmap, ['react', 'react-dom', 'react-dom/client', 'cordis'], boot)
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>Web Shell</title>
<link rel="icon" href="data:,">
<style>
  html, body { margin: 0; padding: 0; height: 100%; }
  body { font-family: system-ui, sans-serif; background: #f6f7f9; }
  #shell-error { display: none; position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 9999; max-width: 80%; color: #c0392b; background: #fdecea; border: 1px solid #f5c6c2; padding: 12px 16px; border-radius: 6px; white-space: pre-wrap; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
  #shell-root { height: 100vh; overflow: hidden; }
</style>
</head>
<body>
<div id="shell-error"></div>
<div id="shell-root"></div>
<script>
window.CLIENT_BOOT = ${JSON.stringify(boot).replace(/</g, '\\u003c')}
</script>
<script>
${loader}
</script>
<script type="module">
const errorEl = document.getElementById('shell-error')
const root = document.getElementById('shell-root')
function showError(msg) {
  errorEl.textContent = String(msg)
  errorEl.style.display = 'block'
}
async function load(entryUrl) {
  root.innerHTML = ''
  errorEl.style.display = 'none'
  try {
    // 启动:种子物化 + 全部注册工厂 + immed 物化(幂等);再物化入口(URL/裸种子;清单 id 未命中种子则跳过)
    await window.__ModuleLoader__.bootstrap()
    await window.__ModuleLoader__.preloadSeed(entryUrl)
    const plugin = window.__ModuleLoader__.require(entryUrl)   // 四层搜索(同步;清单 id 走工厂/缓存)
    if (!plugin || typeof plugin.mount !== 'function') {
      throw new Error('插件入口导出缺少 mount(需为 WebPlugin)')
    }
    await plugin.mount(root)
    console.log('[web-module] loaded:', plugin.name || entryUrl)
    // 挂载其余 boot 插件(辅助插件:页面级视觉/脚本插件;mount 忽略 root 或自行处理容器)
    // require 按 id 索引工厂/缓存(entry.id);入口跳过比较需兼容 id 与 url 两种 entryUrl 形态
    for (const entry of window.CLIENT_BOOT) {
      if (entry.id === entryUrl || entry.url === entryUrl) continue
      const aux = window.__ModuleLoader__.require(entry.id)
      if (aux && typeof aux.mount === 'function') {
        await aux.mount(root)
        console.log('[web-module] mounted auxiliary:', aux.name || entry.id)
      }
    }
  } catch (e) {
    showError('插件加载失败: ' + (e && e.message ? e.message : e))
    console.error('[web-module] load failed:', e)
  }
}
window.__webShell__ = {
  version: ${version},
  modules: ${modules},
  importmap: ${JSON.stringify(service.importmap).replace(/</g, '\\u003c')},
  load: load
}
const params = new URLSearchParams(location.search)
const pluginId = params.get('plugin') ?? ${JSON.stringify(defaultPlugin ?? '')}
if (pluginId) window.__webShell__.load(pluginId)
</script>
</body>
</html>`
}
