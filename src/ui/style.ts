// agent_plugin_dev/multi-session-plugin/src/ui/style.ts
const STYLE_ID = 'multi-session-style'
export function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
.multi-session { display: flex; flex-direction: column; height: 100%; min-height: 0; color: var(--ui-text, #444); }
.multi-session .ms-head { display: flex; align-items: center; justify-content: space-between; padding: 2px 0 8px; }
.multi-session .ms-title { font-size: 13px; font-weight: 600; }
.multi-session .ms-add { width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--ui-border-strong, #ccc); background: var(--ui-surface, #fff); color: var(--ui-text, #444); font-size: 15px; line-height: 1; cursor: pointer; }
.multi-session .ms-list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.multi-session .ms-item { position: relative; display: flex; flex-direction: column; gap: 2px; padding: 7px 8px; border-radius: var(--ui-radius-m, 6px); cursor: pointer; border: 1px solid transparent; }
.multi-session .ms-item:hover { background: var(--ui-accent-soft, #f0f0f0); }
.multi-session .ms-item.active { background: var(--ui-accent-soft, #f0f0f0); border-color: var(--ui-accent, #333); }
.multi-session .ms-item .ms-name { font-size: 12.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 18px; }
.multi-session .ms-item .ms-time { font-size: 11px; color: var(--ui-text-muted, #888); }
.multi-session .ms-item .ms-del { position: absolute; top: 6px; right: 6px; width: 16px; height: 16px; border: none; border-radius: 50%; background: transparent; color: var(--ui-text-muted, #888); font-size: 11px; line-height: 1; cursor: pointer; display: none; align-items: center; justify-content: center; }
.multi-session .ms-item:hover .ms-del { display: flex; }
.multi-session .ms-item .ms-del:hover { color: var(--ui-danger, #d9534f); }
.multi-session .ms-empty { color: var(--ui-text-muted, #888); font-size: 12px; text-align: center; padding: 12px 0; }
`
  document.head.appendChild(style)
}
