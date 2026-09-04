// agent_plugin_dev/host-plugin/src/web-server.ts
import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http'
import { ipInWhitelist } from './config.ts'

export type RouteHandler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>

export interface RegisterOptions {
  kind: 'exact' | 'prefix'
  path: string
  handler: RouteHandler
}

export interface FallbackOptions {
  handler: RouteHandler
}

interface Entry {
  kind: 'exact' | 'prefix'
  path: string
  handler: RouteHandler
}

export class WebServerService {
  private entries: Entry[] = []
  private fallbackHandler: RouteHandler | null = null
  private _server: Server

  constructor(public whitelist: string[] = []) {
    this._server = createServer((req, res) => void this.dispatch(req, res))
  }

  get server() {
    return this._server
  }

  get listening(): boolean {
    return this._server.listening
  }

  register(opts: RegisterOptions): () => void {
    if (typeof opts !== 'object' || opts === null) throw err(400, 'register 参数必须是对象')
    if (opts.kind !== 'exact' && opts.kind !== 'prefix') throw err(400, "kind 必须是字面量 'exact' 或 'prefix'")
    if (typeof opts.path !== 'string' || opts.path.length === 0) throw err(400, 'path 必须是非空字符串')
    if (typeof opts.handler !== 'function') throw err(400, 'handler 必须是函数')
    if (this.entries.some((e) => e.path === opts.path)) {
      throw err(409, `路由路径已注册: ${opts.path}`)
    }
    const entry: Entry = { kind: opts.kind, path: opts.path, handler: opts.handler }
    this.entries.push(entry)
    let disposed = false
    return () => {
      if (disposed) return
      disposed = true
      this.entries = this.entries.filter((e) => e !== entry)
    }
  }

  registerFallback(opts: FallbackOptions): () => void {
    if (typeof opts !== 'object' || opts === null) throw err(400, 'registerFallback 参数必须是对象')
    if (typeof opts.handler !== 'function') throw err(400, 'handler 必须是函数')
    if (this.fallbackHandler) throw err(409, 'fallback 已注册,全局唯一')
    this.fallbackHandler = opts.handler
    let disposed = false
    return () => {
      if (disposed) return
      disposed = true
      this.fallbackHandler = null
    }
  }

  async dispatch(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // 来源 IP 白名单过滤(whitelist 非空时启用;精确 IP 或 CIDR 匹配,不匹配返回 403)
    if (this.whitelist.length > 0) {
      const remote = req.socket.remoteAddress ?? ''
      if (!ipInWhitelist(remote, this.whitelist)) {
        res.writeHead(403, { 'content-type': 'text/plain' })
        res.end('403 Forbidden')
        return
      }
    }
    let pathname: string
    try {
      pathname = new URL(req.url ?? '/', 'http://localhost').pathname
    } catch {
      res.writeHead(400, { 'content-type': 'text/plain' })
      res.end('400 Bad Request')
      return
    }
    const exact = this.entries.find((e) => e.kind === 'exact' && e.path === pathname)
    if (exact) {
      await this.runHandler(exact.handler, pathname, req, res)
      return
    }
    let best: Entry | null = null
    for (const e of this.entries) {
      if (e.kind !== 'prefix') continue
      // prefix 按路径段边界匹配;兼容注册 path 自带/不带尾斜杠两种写法('/api/x/' 与 '/api/x' 等价)
      const base = e.path.endsWith('/') ? e.path.slice(0, -1) : e.path
      if (pathname === base || pathname.startsWith(base + '/')) {
        if (!best || e.path.length > best.path.length) best = e
      }
    }
    if (best) {
      await this.runHandler(best.handler, pathname, req, res)
      return
    }
    if (this.fallbackHandler) {
      await this.runHandler(this.fallbackHandler, pathname, req, res)
      return
    }
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('404 Not Found')
  }

  private async runHandler(
    handler: RouteHandler,
    pathname: string,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      await handler(req, res)
    } catch (error) {
      console.error(`[webServer] route ${pathname} error:`, error)
      if (res.headersSent) {
        res.destroy()
      } else {
        res.writeHead(500, { 'content-type': 'text/plain' })
        res.end('500 Internal Server Error')
      }
    }
  }

  start(port: number, host: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const onError = (err: Error) => {
        this._server.off('listening', onListening)
        reject(err)
      }
      const onListening = () => {
        this._server.off('error', onError)
        resolve()
      }
      this._server.once('error', onError)
      this._server.once('listening', onListening)
      this._server.listen(port, host)
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this._server.listening) {
        resolve()
        return
      }
      this._server.close((err) => (err ? reject(err) : resolve()))
    })
  }
}

function err(code: number, message: string): Error {
  return Object.assign(new Error(message), { code })
}
