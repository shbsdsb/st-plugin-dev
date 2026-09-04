// style.ts —— 注入一次面板样式(黑白灰,对齐 llm-plugin demo)
const STYLE_ID = 'prompt-plugin-style'
const CSS = `
.prp .row-preset{display:flex;align-items:center;gap:8px;margin-bottom:14px;border:1px solid #e4e4e7;border-radius:8px;padding:4px 10px;background:#f4f4f5;flex-wrap:wrap}
.prp .row-preset select{flex:1;min-width:0;padding:7px 26px 7px 8px;font-size:13px;font-weight:500;border:none;background:transparent;color:#18181b;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none}
.prp .row-preset input{flex:1;min-width:0;padding:7px 10px;font-size:13px;border:1px solid #d4d4d8;border-radius:6px;background:#fff;color:#18181b;outline:none}
.prp .text-btn{padding:5px 9px;font-size:12px;font-weight:500;border:1px solid transparent;border-radius:6px;background:transparent;color:#52525b;cursor:pointer;white-space:nowrap}
.prp .text-btn:hover{background:#fff;border-color:#d4d4d8;color:#18181b}
.prp .text-btn.danger{color:#d9534f}
.prp .text-btn.danger:hover{background:#fef3f2;border-color:#f1b6b3}
.prp .pid{font-size:11px;color:#a1a1aa;background:#fff;padding:3px 8px;border-radius:20px;border:1px solid #e4e4e7;font-family:monospace;white-space:nowrap}
.prp .row-actions{display:flex;gap:8px;margin-bottom:12px}
.prp .row-actions button{flex:1;padding:8px 10px;font-size:12px;font-weight:500;border-radius:6px;border:1px solid #d4d4d8;background:#fff;color:#18181b;cursor:pointer}
.prp .row-actions button:hover{background:#f4f4f5}
.prp .row-actions button.danger{color:#d9534f}
.prp .row-actions button.danger:hover{background:#fef3f2;border-color:#f1b6b3}
.prp .row-actions button:disabled{opacity:.5;cursor:not-allowed}
.prp .fg{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
.prp .fg>label{font-size:13px;font-weight:500;color:#18181b}
.prp .fg input,.prp .fg select,.prp .fg textarea{width:100%;padding:10px 14px;font-size:13px;font-family:inherit;border:1px solid #d4d4d8;border-radius:8px;background:#fff;color:#18181b;outline:none;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.prp .fg textarea{resize:vertical;min-height:120px;line-height:1.6}
.prp .entry-item{display:flex;align-items:center;gap:8px;border:1px solid #e4e4e7;border-radius:8px;padding:6px 10px;background:#fff}
.prp .entry-item:hover{border-color:#d4d4d8}
.prp .entry-name{font-size:13.5px;font-weight:500;color:#18181b;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prp .entry-role{font-size:11px;color:#a1a1aa;background:#f4f4f5;border:1px solid #e4e4e7;padding:2px 8px;border-radius:20px;flex-shrink:0;font-family:monospace}
.prp .entry-spacer{flex:1}
.prp .row-bottom{display:flex;align-items:center;gap:10px;margin-top:18px;border-top:1px solid #e4e4e7;padding-top:16px}
.prp .send-btn{padding:9px 18px;font-size:13px;font-weight:600;border:1px solid #18181b;border-radius:8px;background:#18181b;color:#fff;cursor:pointer}
.prp .send-btn:hover{background:#3f3f46}
.prp .send-btn:disabled{opacity:.45;cursor:not-allowed}
.prp .empty-state{text-align:center;padding:28px 12px;color:#a1a1aa;font-size:13px}
.prp.overlay{position:fixed;inset:0;background:rgba(0,0,0,.28);z-index:10020;display:flex;align-items:center;justify-content:center;padding:20px}
.prp .float-modal{background:#fff;border:1px solid #e0e0e0;box-shadow:0 4px 16px rgba(0,0,0,.12);border-radius:6px;width:min(480px,94vw);display:flex;flex-direction:column;max-height:86vh;overflow:hidden}
.prp .float-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eee}
.prp .float-head b{font-size:14px;color:#18181b}
.prp .float-head .x{width:22px;height:22px;border-radius:50%;border:none;background:#f0f0f0;color:#888;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center}
.prp .float-body{padding:16px;overflow:auto;flex:1;font-size:13px;color:#334155;line-height:1.7}
.prp .float-foot{display:flex;gap:10px;justify-content:flex-end;padding:12px 16px;border-top:1px solid #eee}
.prp .float-foot button{border:none;border-radius:40px;padding:9px 22px;font-size:12px;font-weight:600;cursor:pointer}
.prp .float-foot .s{background:#fff;color:#666;border:1px solid #ccc}
.prp .float-foot .p{background:#333;color:#fff;border:1px solid #333}
.prp .float-foot .d{background:#fff;color:#d9534f;border:1px solid #f1b6b3}
.prp .confirm-t{text-align:center;font-size:14px;font-weight:600;color:#18181b}
.prp .confirm-d{text-align:center;font-size:12.5px;color:#71717a;line-height:1.7;margin-top:6px;word-break:break-all}
.prp .result-meta{background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:8px 12px;font-size:12px;line-height:1.7;color:#52525b;white-space:pre-wrap;word-break:break-all;max-height:130px;overflow:auto;margin-bottom:12px}
.prp .result-body{background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:12px 14px;font-family:ui-monospace,Consolas,monospace;font-size:12px;line-height:1.6;color:#18181b;overflow:auto;white-space:pre-wrap;word-break:break-all;min-height:180px;flex:1}
.prp .status-row{display:flex;align-items:center;gap:8px;margin-left:auto}
.prp .status-dot{width:10px;height:10px;border-radius:50%;background:#d4d4d8;transition:background .2s}
.prp .status-dot.success{background:#18181b}
.prp .status-dot.error{background:#d9534f}
.prp .status-text{font-size:12px;color:#52525b}
.prp .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.prp .entry-list{display:block;position:relative;min-height:0}
.prp .entry-wrap{position:absolute;left:0;right:0;top:0;transition:top .3s cubic-bezier(.22,.61,.36,1),box-shadow .2s ease,border-color .2s ease;will-change:top}
.prp .entry-wrap.prp-dragging{z-index:100;box-shadow:0 12px 40px rgba(31,38,135,.25);border-color:rgba(124,109,246,.6);cursor:grabbing;transition:box-shadow .2s ease,border-color .2s ease}
.prp .entry-head{display:flex;align-items:center;gap:8px;border:1px solid #e4e4e7;border-radius:8px;padding:6px 10px;background:#fff}
.prp .entry-head:hover{border-color:#d4d4d8}
.prp .drag-handle{cursor:grab;color:#c9c9cf;font-size:12px;user-select:none;flex-shrink:0;padding:0 2px}
.prp .drag-handle:hover{color:#7c6df6}
.prp .drag-handle:active{cursor:grabbing}
.prp .entry-wrap.prp-dragging .drag-handle,.prp .block-row.prp-dragging .drag-handle{color:#7c6df6}
.prp .pid-empty{flex-shrink:0}
.prp .entry-detail{margin:2px 0 8px 22px;padding:8px 10px;background:#fafafa;border:1px solid #ececec;border-radius:8px}
.prp .detail-label{display:block;font-size:12px;color:#8a8a92;margin:4px 0}
.prp .detail-text{font-size:12px;color:#6b6b73;white-space:pre-wrap;word-break:break-all;max-height:96px;overflow:auto;background:#fff;border:1px solid #efefef;border-radius:6px;padding:6px 8px;margin-bottom:6px}
.prp .block-list{display:block;position:relative;min-height:0}
.prp .block-row{position:absolute;left:0;right:0;top:0;display:flex;align-items:flex-start;gap:6px;background:#fff;border:1px solid #f0f0f0;border-radius:6px;padding:4px;transition:top .3s cubic-bezier(.22,.61,.36,1),box-shadow .2s ease,border-color .2s ease;will-change:top}
.prp .block-row:hover{border-color:#e0e0e0}
.prp .block-row.prp-dragging{z-index:100;box-shadow:0 12px 40px rgba(31,38,135,.25);border-color:rgba(124,109,246,.6);cursor:grabbing;transition:box-shadow .2s ease,border-color .2s ease}
.prp .prp-drop-indicator{position:absolute;left:0;right:0;height:3px;border-radius:3px;background:#7c6df6;opacity:0;transition:opacity .15s ease;pointer-events:none;box-shadow:0 0 10px rgba(124,109,246,.5);z-index:101}
.prp .prp-drop-indicator.visible{opacity:1}
.prp .block-textarea{flex:1;min-height:44px;resize:vertical;font-family:inherit;font-size:12px;line-height:1.6;border:1px solid #e4e4e9;border-radius:6px;padding:5px 7px;background:#fff}
.prp .block-textarea:focus{outline:none;border-color:#b9b9c2}
.prp .dashed-btn{border:1px dashed #c9c9cf;background:none;color:#6b6b73;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;margin-top:6px}
.prp .dashed-btn:hover{background:#f4f4f5;color:#18181b}
.prp .block-empty{font-size:12px;color:#a1a1aa;padding:8px 4px;text-align:center}
.prp .wizard-tip{font-size:12px;color:#8a8a92;margin-bottom:8px}
.prp .wizard-opt{display:block;width:100%;text-align:left;border:1px solid #e4e4e9;background:#fff;border-radius:8px;padding:10px 12px;cursor:pointer;font-size:13px;color:#333;margin-bottom:6px}
.prp .wizard-opt:hover{border-color:#b9b9c2;background:#fafafa}
.prp .save-order-btn{margin-left:0;padding:9px 18px;font-size:13px;font-weight:600;border:1px dashed #71717a;border-radius:8px;background:#fff;color:#52525b;cursor:pointer}
.prp .save-order-btn:hover:not(:disabled){background:#f4f4f5;border-style:solid}
.prp .save-order-btn:disabled{opacity:.45;cursor:not-allowed}
.prp .child-preview{flex:1;min-width:0;font-size:12px;color:#71717a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.6;padding-top:6px}
.prp .block-row .entry-name{flex-shrink:0;max-width:140px}
`
export function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = CSS
  document.head.appendChild(s)
}
