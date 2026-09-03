// agent_plugin_dev/llm-plugin/src/ui/style.ts — llm 面板样式(demo 定稿唯一一份,全部 .llm 作用域)
const STYLE_ID = 'llm-plugin-style';
const CSS = `
.llm *{box-sizing:border-box;}
.llm .row-preset{display:flex;align-items:center;gap:8px;margin-bottom:14px;border:1px solid #e4e4e7;border-radius:8px;padding:6px 10px;background:#f4f4f5;}
.llm .row-preset select{flex:1;min-width:0;padding:7px 28px 7px 10px;font-size:13px;font-weight:500;border:none;background:transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;color:#18181b;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;}
.llm .preset-rename-inline{display:none;flex:1;align-items:center;gap:6px;min-width:0;}
.llm .preset-rename-inline.active{display:flex;}
.llm .preset-rename-inline input{flex:1;min-width:0;padding:6px 10px;font-size:13px;border:1px solid #d4d4d8;border-radius:6px;outline:none;background:#fff;}
.llm .preset-rename-inline input:focus{border-color:#18181b;}
.llm .preset-rename-inline button{padding:5px 10px;font-size:12px;border-radius:6px;cursor:pointer;white-space:nowrap;}
.llm .preset-rename-inline .ok{border:1px solid #18181b;background:#18181b;color:#fff;}
.llm .preset-rename-inline .cancel{border:1px solid #d4d4d8;background:#fff;color:#52525b;}
.llm .text-btn{padding:5px 9px;font-size:12px;font-weight:500;border:1px solid transparent;border-radius:6px;background:transparent;color:#52525b;cursor:pointer;white-space:nowrap;}
.llm .text-btn:hover{background:#fff;border-color:#d4d4d8;color:#18181b;}
.llm .row-actions{display:flex;gap:8px;margin-bottom:16px;}
.llm .row-actions button{flex:1;padding:8px 10px;font-size:12px;font-weight:500;border-radius:6px;border:1px solid #d4d4d8;background:#fff;color:#18181b;cursor:pointer;}
.llm .row-actions button:hover{background:#f4f4f5;}
.llm .row-actions button.primary{background:#18181b;color:#fff;border-color:#18181b;}
.llm .row-actions button.primary:hover{background:#3f3f46;}
.llm .fg{display:flex;flex-direction:column;gap:4px;margin-bottom:14px;}
.llm .fg label{font-size:13px;font-weight:500;color:#18181b;}
.llm .iw{position:relative;display:flex;align-items:center;}
.llm .iw input{width:100%;padding:10px 14px;font-size:14px;font-family:inherit;border:1px solid #d4d4d8;border-radius:8px;background:#fff;color:#18181b;outline:none;box-shadow:0 1px 2px rgba(0,0,0,0.04);}
.llm .iw select{width:100%;padding:10px 36px 10px 14px;font-size:14px;font-family:inherit;border:1px solid #d4d4d8;border-radius:8px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 14px center;color:#18181b;outline:none;appearance:none;-webkit-appearance:none;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.04);}
.llm .fg select{width:100%;padding:10px 36px 10px 14px;font-size:14px;font-family:inherit;border:1px solid #d4d4d8;border-radius:8px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 14px center;color:#18181b;outline:none;appearance:none;-webkit-appearance:none;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.04);}
.llm .iw input:focus,.llm .iw select:focus{border-color:#18181b;}
.llm .iw input:disabled,.llm .iw select:disabled{background:#f4f4f5;color:#a1a1aa;cursor:not-allowed;border-color:#e4e4e7;}
.llm .iw.has-prefix input{padding-left:78px;}
.llm .iw .prefix{position:absolute;left:14px;font-size:13px;color:#a1a1aa;pointer-events:none;}
.llm .iw .toggle{position:absolute;right:10px;background:none;border:none;color:#a1a1aa;font-size:14px;cursor:pointer;padding:5px;border-radius:6px;}
.llm .row-bottom{display:flex;align-items:center;gap:16px;margin-top:18px;border-top:1px solid #e4e4e7;padding-top:16px;}
.llm .btn-test{min-width:80px;padding:9px 16px;font-size:13px;font-weight:500;border:1px solid #d4d4d8;border-radius:8px;background:#fff;color:#18181b;cursor:pointer;}
.llm .btn-test:hover{background:#f4f4f5;}
.llm .btn-test:disabled{opacity:.6;cursor:not-allowed;}
.llm .indicator-wrap{display:flex;align-items:center;gap:8px;}
.llm .indicator{width:12px;height:12px;border-radius:50%;background:#d4d4d8;display:inline-block;transition:background .2s;}
.llm .indicator.success{background:#18181b;}
.llm .indicator.error{background:#d9534f;}
.llm .indicator.info{background:#71717a;}
.llm .indicator-text{font-size:12px;color:#52525b;}

/* 模型字段:组合输入框 + 内嵌下拉 */
.llm .model-field{position:relative;width:100%;}
.llm .model-input-group{display:flex;align-items:stretch;border:1px solid #d4d4d8;border-radius:8px;background:#fff;transition:border-color .2s,box-shadow .2s;overflow:hidden;}
.llm .model-input-group:focus-within{border-color:#18181b;box-shadow:0 0 0 3px rgba(24,24,27,.08);}
.llm .model-input-group input{flex:1;min-width:0;border:none;padding:10px 14px;font-size:14px;font-family:inherit;color:#18181b;background:transparent;outline:none;}
.llm .model-input-group input::placeholder{color:#a1a1aa;}
.llm .model-fetch-btn{display:flex;align-items:center;gap:6px;padding:0 16px;border:none;border-left:1px solid #d4d4d8;background:#f4f4f5;color:#18181b;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .15s,transform .1s;user-select:none;flex-shrink:0;}
.llm .model-fetch-btn .arrow{display:inline-block;font-size:10px;transition:transform .25s ease;}
.llm .model-fetch-btn .arrow.open{transform:rotate(180deg);}
.llm .model-fetch-btn:hover{background:#e8e8ea;}
.llm .model-fetch-btn:active{transform:scale(.96);}
.llm .model-fetch-btn .label-text{font-size:12px;}
@media (max-width:480px){.llm .model-fetch-btn .label-text{font-size:11px;}.llm .model-fetch-btn{padding:0 10px;gap:4px;}}
@media (max-width:380px){.llm .model-fetch-btn .label-text{display:none;}.llm .model-fetch-btn{padding:0 12px;}}
.llm .model-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid #e4e4e7;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.08);max-height:200px;overflow:auto;z-index:30;display:none;padding:4px 0;}
.llm .model-dropdown.show{display:block;animation:dropIn .18s ease;}
@keyframes dropIn{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
.llm .model-dropdown .item{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;font-size:13px;color:#334155;cursor:pointer;transition:background .1s;gap:8px;}
.llm .model-dropdown .item:hover{background:#f4f4f5;}
.llm .model-dropdown .item:active{background:#e8e8ea;}
.llm .model-dropdown .item .name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.llm .model-dropdown .item .check{color:#18181b;font-weight:600;font-size:13px;flex-shrink:0;}
.llm .model-dropdown .item.active{background:#f0f0f0;}
.llm .model-dropdown .item.active .name{color:#18181b;font-weight:500;}
.llm .model-dropdown .empty{padding:20px 14px;text-align:center;color:#a1a1aa;font-size:13px;}
.llm .model-dropdown .loading-item{padding:14px;text-align:center;color:#a1a1aa;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;}
.llm .model-dropdown .loading-item .spinner{display:inline-block;width:16px;height:16px;border:2px solid #e4e4e7;border-top-color:#18181b;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.llm .model-dropdown .no-match{padding:16px 14px;text-align:center;color:#a1a1aa;font-size:13px;}
@media (max-width:768px){.llm .row-bottom{flex-direction:column;align-items:stretch;}.llm .indicator-wrap{justify-content:flex-start;}.llm .iw.has-prefix input{padding-left:62px;}.llm .iw .prefix{left:10px;}}
.llm .model-dropdown::-webkit-scrollbar{width:4px;}
.llm .model-dropdown::-webkit-scrollbar-track{background:transparent;}
.llm .model-dropdown::-webkit-scrollbar-thumb{background:#d4d4d8;border-radius:4px;}
.llm .model-dropdown::-webkit-scrollbar-thumb:hover{background:#a1a1aa;}
`;
export function ensureStyle() {
    if (document.getElementById(STYLE_ID))
        return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
}
