// agent_plugin_dev/host-plugin/src/index.ts(改造)
import { execFileSync } from 'node:child_process'
import { Context } from 'cordis'
import { resolveListenTarget, HostConfigSchema, type HostConfig } from './config.ts'
import { WebServerService } from './web-server.ts'

declare module 'cordis' {
  interface Context {
    host: { config: HostConfig }
    webServer: WebServerService
  }
}

export const name = 'host'

export function apply(ctx: Context, config: HostConfig) {
  // config 来自覆盖层 patch(经 HostConfigSchema 校验 + 默认值),不再旁路读文件
  ctx.provide('host', { config })

  const webserver = new WebServerService(config.listenWhitelist)
  ctx.provide('webServer', webserver)
  ctx.effect(() => async () => {
    await webserver.stop()
  })

  if (process.env.ST_HOST_START === 'true') {
    return (async () => {
      // bind 地址:listen=true → 0.0.0.0(监听所有接口,手机等局域网设备可连);否则 config.host
      const bindTarget = resolveListenTarget(config)
      // 访问/打开地址:固定 127.0.0.1(本机回环,始终可访问;与 bind 地址是两回事)
      const accessHost = '127.0.0.1'
      try {
        await webserver.start(config.port, bindTarget)
      } catch (error) {
        console.error(`Host 启动失败: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
      }
      ctx.logger.info(`Host listening on http://${bindTarget}:${config.port},本机访问 http://${accessHost}:${config.port}`)
      if (config.open) {
        try {
          execFileSync('cmd', ['/c', 'start', '', `http://${accessHost}:${config.port}`], { stdio: 'ignore' })
        } catch {
          // 浏览器打开失败不阻塞服务
        }
      }
    })()
  }
}

apply.Config = HostConfigSchema
export default apply
