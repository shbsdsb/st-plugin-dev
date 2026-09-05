// agent_plugin_dev/chat-plugin/src/extract.ts —— 三格式模型回复抽取(openai_compatible/anthropic/google)
export function extractAssistant(json: unknown): string {
  const j = json as Record<string, unknown> | null
  if (j && Array.isArray(j.choices) && (j.choices[0] as Record<string, unknown> | undefined)) {
    const msg = (j.choices[0] as Record<string, unknown>).message as Record<string, unknown> | undefined
    if (msg && typeof msg.content === 'string') return msg.content
  }
  if (j && Array.isArray(j.content) && (j.content[0] as Record<string, unknown> | undefined)) {
    const t = (j.content[0] as Record<string, unknown>).text
    if (typeof t === 'string') return t
  }
  if (j && Array.isArray(j.candidates) && (j.candidates[0] as Record<string, unknown> | undefined)) {
    const content = (j.candidates[0] as Record<string, unknown>).content as { parts?: { text?: unknown }[] } | undefined
    if (content && Array.isArray(content.parts)) {
      const text = content.parts.map((p) => (p && typeof p.text === 'string' ? p.text : '')).join('')
      if (text !== '') return text
    }
  }
  throw new Error('无法解析模型回复')
}
