// agent_plugin_dev/chat-plugin/src/ui/style.ts —— 对话页样式(全部 var(--ui-*) token,与 ui-polish 一致)
const STYLE_ID = 'chat-plugin-style';
export function injectChatStyle() {
    if (document.getElementById(STYLE_ID))
        return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.chat-page { display: flex; flex-direction: column; height: 100%; min-height: 0; font-family: system-ui, "Microsoft YaHei", sans-serif; color: var(--ui-text, #444); }
.chat-page .chat-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; font-size: 14px; font-weight: 600; border-bottom: 1px solid var(--ui-border, #e0e0e0); }
.chat-page .chat-head .chat-badge { font-size: 11px; font-weight: 400; color: var(--ui-text-muted, #888); border: 1px solid var(--ui-border, #e0e0e0); border-radius: 999px; padding: 1px 8px; }
.chat-page .chat-list { flex: 1; min-height: 0; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.chat-page .msg-row { display: flex; width: 100%; }
.chat-page .msg-row.ai { justify-content: flex-start; }
.chat-page .msg-row.user { justify-content: flex-end; }
.chat-page .msg-row .bubble { max-width: 78%; padding: 8px 12px; line-height: 1.6; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
.chat-page .msg-row.ai .bubble { background: var(--ui-accent-soft, #f0f0f0); color: var(--ui-text, #444); border-radius: var(--ui-radius-m, 6px); border-top-left-radius: var(--ui-radius-s, 4px); }
.chat-page .msg-row.user .bubble { background: var(--ui-accent, #333); color: var(--ui-on-accent, #fff); border-radius: var(--ui-radius-m, 6px); border-top-right-radius: var(--ui-radius-s, 4px); }
.chat-page .msg-empty { margin: auto; color: var(--ui-text-muted, #888); font-size: 13px; text-align: center; }
.chat-page .msg-error { justify-content: center; color: var(--ui-danger, #d9534f); font-size: 12px; text-align: center; }
.chat-page .chat-composer { border-top: 1px solid var(--ui-border, #e0e0e0); padding: 10px 12px; display: flex; gap: 8px; align-items: flex-end; }
.chat-page .chat-composer textarea { flex: 1; resize: none; height: 64px; padding: 8px 10px; font: inherit; font-size: 13px; line-height: 1.5; color: var(--ui-text, #444); background: var(--ui-surface, #fff); border: 1px solid var(--ui-border, #e0e0e0); border-radius: var(--ui-radius-m, 6px); outline: none; box-sizing: border-box; }
.chat-page .chat-composer textarea:focus { border-color: var(--ui-accent, #333); box-shadow: 0 0 0 3px var(--ui-accent-ring, rgba(51,51,51,.15)); }
.chat-page .chat-composer textarea::placeholder { color: var(--ui-text-muted, #888); }
.chat-page .chat-composer .send-btn { padding: 8px 16px; font-size: 13px; cursor: pointer; background: var(--ui-accent, #333); color: var(--ui-on-accent, #fff); border: none; border-radius: var(--ui-radius-m, 6px); }
.chat-page .chat-composer .send-btn:disabled { opacity: .5; cursor: default; }
`;
    document.head.appendChild(style);
}
