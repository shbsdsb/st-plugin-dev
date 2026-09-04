import { describe, it, expect } from 'vitest'
import { PROVIDER_BASE_URLS, PROVIDER_FORMATS, normalizeBase, buildModelRequest, parseModelList, buildTestRequest, isOk, sendChat } from '../src/format.ts'

describe('format', () => {
  it('厂商固定 URL / 格式映射', () => {
    expect(PROVIDER_BASE_URLS.deepseek).toBe('api.deepseek.com/v1')
    expect(PROVIDER_FORMATS.deepseek).toBe('openai_compatible')
    expect(PROVIDER_FORMATS.anthropic).toBe('anthropic')
    expect(PROVIDER_FORMATS.google).toBe('google')
  })

  it('normalizeBase 去尾 /', () => {
    expect(normalizeBase('api.deepseek.com/v1/')).toBe('api.deepseek.com/v1')
  })

  it('openai 模型请求 + 解析', () => {
    const r = buildModelRequest('openai_compatible', 'api.deepseek.com/v1', 'sk-x')
    expect(r.url).toBe('https://api.deepseek.com/v1/models')
    expect(r.headers.Authorization).toBe('Bearer sk-x')
    expect(parseModelList('openai_compatible', { data: [{ id: 'deepseek-chat' }, { id: 'deepseek-reasoner' }] })).toEqual(['deepseek-chat', 'deepseek-reasoner'])
  })

  it('anthropic / google 模型解析 + 去前缀', () => {
    expect(parseModelList('anthropic', { data: [{ id: 'claude-3-5' }] })).toEqual(['claude-3-5'])
    expect(parseModelList('google', { models: [{ name: 'models/gemini-1.5-flash' }] })).toEqual(['gemini-1.5-flash'])
  })

  it('测试请求体三种格式', () => {
    const o = buildTestRequest('openai_compatible', { baseUrl: 'api.deepseek.com/v1', key: 'k', model: 'deepseek-chat' })
    expect(o.url).toBe('https://api.deepseek.com/v1/chat/completions')
    expect(JSON.parse(o.body).messages[0].content).toBe('ping')
    expect(JSON.parse(o.body).model).toBe('deepseek-chat')
    const an = buildTestRequest('anthropic', { baseUrl: 'api.anthropic.com/v1', key: 'k', model: 'claude' })
    expect(an.headers['x-api-key']).toBe('k')
    expect(JSON.parse(an.body).max_tokens).toBe(8)
    const g = buildTestRequest('google', { baseUrl: 'generativelanguage.googleapis.com/v1beta', key: 'k', model: 'gemini-pro' })
    expect(g.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=k')
  })

  it('isOk 判定', () => {
    expect(isOk('openai_compatible', { choices: [{}] })).toBe(true)
    expect(isOk('anthropic', { content: [{}] })).toBe(true)
    expect(isOk('google', { candidates: [{}] })).toBe(true)
    expect(isOk('openai_compatible', {})).toBe(false)
  })
})

describe('sendChat', () => {
  it('openai_compatible: POST {base}/chat/completions, Bearer, body=messages 透传', async () => {
    let got: { url?: string; init?: RequestInit } = {}
    const fetchImpl = (async (url: string, init?: RequestInit) => { got = { url, init }; return new Response(JSON.stringify({ choices: [{ message: { content: 'hi' } }] }), { status: 200 }) }) as unknown as typeof fetch
    const r = await sendChat('openai_compatible', { baseUrl: 'api.deepseek.com/v1', key: 'k', model: 'm1', messages: [{ role: 'user', content: '你好' }] }, 30, fetchImpl)
    expect(got.url).toBe('https://api.deepseek.com/v1/chat/completions')
    expect((got.init?.headers as Record<string, string>).Authorization).toBe('Bearer k')
    expect(JSON.parse(String(got.init?.body))).toEqual({ model: 'm1', messages: [{ role: 'user', content: '你好' }] })
    expect(r.json).toEqual({ choices: [{ message: { content: 'hi' } }] })
  })
  it('anthropic: POST {base}/messages, x-api-key + anthropic-version, body 含 max_tokens', async () => {
    let got: { url?: string; init?: RequestInit } = {}
    const fetchImpl = (async (url: string, init?: RequestInit) => { got = { url, init }; return new Response('{"content":[{"text":"ok"}]}', { status: 200 }) }) as unknown as typeof fetch
    const r = await sendChat('anthropic', { baseUrl: 'api.anthropic.com/v1', key: 'k', model: 'claude', messages: [{ role: 'user', content: 'hi' }] }, 30, fetchImpl)
    expect(got.url).toBe('https://api.anthropic.com/v1/messages')
    expect((got.init?.headers as Record<string, string>)['x-api-key']).toBe('k')
    expect(JSON.parse(String(got.init?.body))).toMatchObject({ model: 'claude', messages: [{ role: 'user', content: 'hi' }] })
  })
  it('google: POST {base}/models/{model}:generateContent?key=, body contents 映射 role user|model', async () => {
    let got: { url?: string; init?: RequestInit } = {}
    const fetchImpl = (async (url: string, init?: RequestInit) => { got = { url, init }; return new Response('{"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}', { status: 200 }) }) as unknown as typeof fetch
    const r = await sendChat('google', { baseUrl: 'generativelanguage.googleapis.com/v1beta', key: 'k', model: 'gemini', messages: [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }] }, 30, fetchImpl)
    expect(got.url).toContain(':generateContent?key=k')
    expect(JSON.parse(String(got.init?.body)).contents).toEqual([{ role: 'user', parts: [{ text: 'a' }] }, { role: 'model', parts: [{ text: 'b' }] }])
  })
})
