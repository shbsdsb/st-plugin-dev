// agent_plugin_dev/chat-plugin/src/history.ts —— history 注入条目:完整历史文本化(无上限)
export function formatHistoryRows(rows: readonly { role: string; content: string }[]): string {
  if (rows.length === 0) return '暂无历史对话。'
  return rows.map((r) => `[${r.role}]\n${r.content}`).join('\n\n')
}

export function createHistoryText(list: () => { role: string; content: string }[]): () => string {
  return () => formatHistoryRows(list())
}
