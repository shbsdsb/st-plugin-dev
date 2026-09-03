// agent_plugin_dev/llm-plugin/src/format.ts
export type ProviderFormat = 'openai_compatible' | 'anthropic' | 'google'

export const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'api.openai.com/v1',
  deepseek: 'api.deepseek.com/v1',
  zhipu: 'open.bigmodel.cn/api/paas/v4',
  qwen: 'dashscope.aliyuncs.com/compatible-mode/v1',
  anthropic: 'api.anthropic.com/v1',
  google: 'generativelanguage.googleapis.com/v1beta',
}
export const PROVIDER_FORMATS: Record<string, string> = {
  openai: 'openai_compatible',
  deepseek: 'openai_compatible',
  zhipu: 'openai_compatible',
  qwen: 'openai_compatible',
  anthropic: 'anthropic',
  google: 'google',
}

export function normalizeBase(url: string): string {
  return url.replace(/\/+$/, '')
}

function withProtocol(base: string): string {
  return /^https?:\/\//i.test(base) ? base : `https://${base}`
}

interface ModelRequest { method: 'GET'; url: string; headers: Record<string, string> }
interface TestRequest { method: 'POST'; url: string; headers: Record<string, string>; body: string }

export function buildModelRequest(format: string, baseUrl: string, key: string): ModelRequest {
  const base = withProtocol(normalizeBase(baseUrl))
  if (format === 'anthropic') {
    return { method: 'GET', url: `${base}/models`, headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } }
  }
  if (format === 'google') {
    return { method: 'GET', url: `${base}/models?key=${encodeURIComponent(key)}`, headers: {} }
  }
  return { method: 'GET', url: `${base}/models`, headers: { Authorization: `Bearer ${key}` } }
}

export function parseModelList(format: string, json: unknown): string[] {
  const j = json as Record<string, unknown> | null
  if (!j) return []
  if (format === 'google') {
    const rows = (j.models ?? []) as { name?: string }[]
    return rows.map((m) => String(m.name ?? '').replace(/^models\//, '')).filter(Boolean)
  }
  const rows = (j.data ?? []) as { id?: string }[]
  return rows.map((m) => String(m.id ?? '')).filter(Boolean)
}

export function buildTestRequest(format: string, opts: { baseUrl: string; key: string; model: string }): TestRequest {
  const base = withProtocol(normalizeBase(opts.baseUrl))
  if (format === 'anthropic') {
    return {
      method: 'POST',
      url: `${base}/messages`,
      headers: { 'x-api-key': opts.key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: opts.model, max_tokens: 8, messages: [{ role: 'user', content: 'ping' }] }),
    }
  }
  if (format === 'google') {
    const body = JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] })
    return {
      method: 'POST',
      url: `${base}/models/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(opts.key)}`,
      headers: { 'content-type': 'application/json' },
      body,
    }
  }
  return {
    method: 'POST',
    url: `${base}/chat/completions`,
    headers: { Authorization: `Bearer ${opts.key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: opts.model, messages: [{ role: 'user', content: 'ping' }] }),
  }
}

export interface FetchInit { method: string; url: string; headers: Record<string, string>; body?: string }

export async function sendJson(req: FetchInit, timeout: number): Promise<{ status: number; json: unknown }> {
  const res = await fetch(req.url, {
    method: req.method,
    headers: req.headers,
    body: req.body,
    signal: AbortSignal.timeout(timeout * 1000),
  })
  const text = await res.text()
  let json: unknown = null
  try { json = text ? JSON.parse(text) : null } catch { json = null }
  return { status: res.status, json }
}

export function isOk(format: string, json: unknown): boolean {
  const j = json as Record<string, unknown> | null
  if (!j) return false
  if (format === 'google') return Array.isArray(j.candidates) && j.candidates.length > 0
  if (format === 'anthropic') return Array.isArray(j.content) && j.content.length > 0
  return Array.isArray(j.choices) && j.choices.length > 0
}
