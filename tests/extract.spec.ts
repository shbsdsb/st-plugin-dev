import { describe, it, expect } from 'vitest'
import { extractAssistant } from '../src/extract.ts'

describe('extractAssistant', () => {
  it('openai_compatible: choices[0].message.content', () => {
    const json = { choices: [{ message: { content: '回复A' } }] }
    expect(extractAssistant(json)).toBe('回复A')
  })
  it('anthropic: content[0].text', () => {
    const json = { content: [{ type: 'text', text: '回复B' }] }
    expect(extractAssistant(json)).toBe('回复B')
  })
  it('google: candidates[0].content.parts[].text 逐段 join', () => {
    const json = { candidates: [{ content: { parts: [{ text: '前' }, { text: '后' }] } }] }
    expect(extractAssistant(json)).toBe('前后')
  })
  it('结构不匹配 → throw 无法解析模型回复', () => {
    expect(() => extractAssistant({ foo: 1 })).toThrow('无法解析模型回复')
    expect(() => extractAssistant({ choices: [] })).toThrow('无法解析模型回复')
    expect(() => extractAssistant(null)).toThrow('无法解析模型回复')
  })
})
