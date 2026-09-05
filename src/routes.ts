// agent_plugin_dev/ui-polish/src/routes.ts
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolveActive, readThemeFiles } from './files.ts'

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
export type Register = (o: { kind: 'exact' | 'prefix'; path: string; handler: Handler }) => () => void

const CURRENT = '/api/ui-polish/current'

export function registerRoutes(register: Register, dep: { stHome: string; config: { active?: string } | undefined }): () => void {
  const { stHome, config } = dep
  const disposers: Array<() => void> = []

  disposers.push(register({
    kind: 'exact',
    path: CURRENT,
    handler: (_req, res) => {
      const name = resolveActive(config, stHome)
      const files = name ? readThemeFiles(stHome, name) : { html: null, css: null, js: null }
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ ok: true, name, html: files.html, css: files.css, js: files.js }))
    },
  }))

  return () => { for (const d of disposers) d() }
}
