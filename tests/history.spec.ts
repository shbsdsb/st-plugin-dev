import { describe, it, expect } from 'vitest'
import { formatHistoryRows, createHistoryText } from '../src/history.ts'

describe('chat history 注入', () => {
  it('完整历史逐条 [role]\ncontent,条目间空行', () => {
    const out = formatHistoryRows([
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '你好!' },
    ])
    expect(out).toBe('[user]\n你好\n\n[assistant]\n你好!')
  })

  it('空库 → 非空兜底文案(不得返回空串)', () => {
    const out = formatHistoryRows([])
    expect(out.length).toBeGreaterThan(0)
    expect(out).toBe('暂无历史对话。')
  })

  it('createHistoryText 闭包每次读最新 list 结果', () => {
    let rows: { role: string; content: string }[] = []
    const fn = createHistoryText(() => rows)
    expect(fn()).toBe('暂无历史对话。')
    rows = [{ role: 'user', content: 'x' }]
    expect(fn()).toContain('[user]\nx')
  })
})
