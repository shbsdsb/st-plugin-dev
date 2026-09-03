// agent_plugin_dev/llm-plugin/src/routes.ts
import type { DatabaseSync } from 'node:sqlite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { listPresets, getPreset, createPreset, updatePreset, deletePreset, type PresetInput } from './db.ts'
import { buildModelRequest, parseModelList, buildTestRequest, sendJson, isOk } from './format.ts'

export interface CredLike {
  set(name: string, secret: string): Promise<void>
  get(name: string): Promise<string | null>
  delete(name: string): Promise<void>
}

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
type Register = (o: { kind: 'exact' | 'prefix'; path: string; handler: Handler }) => () => void

export function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c: Buffer | string) => { raw += c })
    req.on('end', () => resolve(raw))
  })
}

function ok(res: ServerResponse, data: unknown): void {
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify({ ok: true, data }))
}
function fail(res: ServerResponse, message: string): void {
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify({ ok: false, message }))
}

function toPresetInput(b: Record<string, unknown>): PresetInput {
  return {
    presetName: String(b.presetName ?? ''),
    format: String(b.format ?? 'openai_compatible'),
    vendor: String(b.vendor ?? ''),
    baseUrl: String(b.baseUrl ?? ''),
    model: String(b.model ?? ''),
    timeout: Number(b.timeout ?? 30),
  }
}

export function registerRoutes(register: Register, dep: { db: DatabaseSync; cred: CredLike; fetchImpl?: typeof fetch }): () => void {
  const { db, cred } = dep
  const fetchFn = dep.fetchImpl ?? fetch
  const disposers: Array<() => void> = []

  const add = (kind: 'exact' | 'prefix', path: string, handler: Handler) => disposers.push(register({ kind, path, handler }))

  // /api/llm/presets : GET list / POST create
  add('exact', '/api/llm/presets', async (req, res) => {
    try {
      if (req.method === 'GET') {
        const rows = listPresets(db)
        const withKey = await Promise.all(rows.map(async (r) => ({ ...r, hasKey: (await cred.get(`llm:${r.id}`)) != null })))
        return ok(res, withKey)
      }
      // POST
      const b = JSON.parse(await readBody(req)) as Record<string, unknown>
      const input = toPresetInput(b)
      if (!input.baseUrl || !input.presetName) return fail(res, 'presetName/baseUrl 必填')
      const key = String(b.apiKey ?? '')
      if (!key) return fail(res, '新建必须提供 apiKey')
      const id = createPreset(db, input)
      await cred.set(`llm:${id}`, key)
      ok(res, { id })
    } catch (e) { fail(res, (e as Error).message) }
  })

  // /api/llm/presets/<id> : PUT update / DELETE remove
  add('prefix', '/api/llm/presets/', async (req, res) => {
    try {
      const id = Number(String(req.url ?? '').split('/').pop())
      if (!Number.isFinite(id)) return fail(res, '非法 id')
      if (req.method === 'DELETE') {
        deletePreset(db, id)
        await cred.delete(`llm:${id}`)
        return ok(res, { id })
      }
      // PUT
      const b = JSON.parse(await readBody(req)) as Record<string, unknown>
      const input = toPresetInput(b)
      if (!updatePreset(db, id, input)) return fail(res, '预设不存在')
      const key = String(b.apiKey ?? '')
      if (key) await cred.set(`llm:${id}`, key)
      ok(res, { id })
    } catch (e) { fail(res, (e as Error).message) }
  })

  // /api/llm/models : 拉取模型(已存预设 id 或 当前表单字段)
  add('exact', '/api/llm/models', async (req, res) => {
    try {
      const b = JSON.parse(await readBody(req)) as { id?: number; format?: string; baseUrl?: string; apiKey?: string; timeout?: number }
      let format: string, baseUrl: string, key: string, timeout = 30
      if (b.id) {
        const p = getPreset(db, Number(b.id))
        if (!p) return fail(res, '预设不存在')
        key = (await cred.get(`llm:${p.id}`)) ?? ''
        if (!key) return fail(res, '未保存密钥')
        format = p.format; baseUrl = p.baseUrl; timeout = p.timeout
      } else {
        format = String(b.format ?? ''); baseUrl = String(b.baseUrl ?? ''); key = String(b.apiKey ?? '')
        if (!format || !baseUrl || !key) return fail(res, '请提供 format/baseUrl/apiKey(或已保存的 id)')
        timeout = Number(b.timeout) || 30
      }
      const r = buildModelRequest(format, baseUrl, key)
      const { status, json } = await sendJson({ method: r.method, url: r.url, headers: r.headers }, timeout, fetchFn)
      if (status < 200 || status >= 300) return fail(res, `拉取失败: HTTP ${status}`)
      ok(res, { models: parseModelList(format, json) })
    } catch (e) { fail(res, (e as Error).message) }
  })

  // /api/llm/test : 真实测试
  add('exact', '/api/llm/test', async (req, res) => {
    try {
      const b = JSON.parse(await readBody(req)) as { id: number }
      const p = getPreset(db, Number(b.id))
      if (!p) return fail(res, '预设不存在')
      const key = await cred.get(`llm:${p.id}`)
      if (!key) return fail(res, '未保存密钥')
      const r = buildTestRequest(p.format, { baseUrl: p.baseUrl, key, model: p.model })
      const { status, json } = await sendJson({ method: r.method, url: r.url, headers: r.headers, body: r.body }, p.timeout, fetchFn)
      if (status < 200 || status >= 300) return fail(res, `请求失败: HTTP ${status}`)
      ok(res, { ok: isOk(p.format, json) })
    } catch (e) { fail(res, '请求失败: ' + (e as Error).message) }
  })

  return () => disposers.forEach((d) => d())
}
