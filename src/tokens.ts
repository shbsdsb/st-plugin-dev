// agent_plugin_dev/ui-polish/src/tokens.ts
// UI-token 默认表(值提炼自 ui-tool-plugin 现状黑白灰观感)+ :root 生成器。
// token 表唯一权威:ui-polish README 契约文档与此同步。

export const DEFAULT_TOKENS: Record<string, string> = {
  '--ui-bg': '#f5f5f5',
  '--ui-surface': '#ffffff',
  '--ui-border': '#e0e0e0',
  '--ui-border-strong': '#ccc',
  '--ui-text': '#444444',
  '--ui-text-muted': '#888888',
  '--ui-accent': '#333333',
  '--ui-accent-soft': '#f0f0f0',
  '--ui-on-accent': '#ffffff',
  '--ui-danger': '#d9534f',
  '--ui-warning': '#e6a23c',
  '--ui-success': '#52c41a',
  '--ui-overlay': 'rgba(0, 0, 0, 0.28)',
  '--ui-radius-s': '4px',
  '--ui-radius-m': '6px',
  '--ui-shadow-m': '0 4px 16px rgba(0, 0, 0, 0.12)',
}

/** 生成 :root token 层 css(供前端注入 style#ui-polish-tokens) */
export function buildTokenCss(tokens: Record<string, string>): string {
  const lines = Object.entries(tokens).map(([k, v]) => `  ${k}: ${v};`)
  if (lines.length === 0) return ':root {\n}'
  return `:root {\n${lines.join('\n')}\n}`
}
