// agent_plugin_dev/llm-plugin/src/ui/config-panel.ts
import { computeAutoValues } from "./provider.js";
export function buildModelOptions(models, current) {
    return models.map((name) => ({ name, active: name === current }));
}
const STYLE_ID = 'llm-plugin-style';
function ensureStyle() {
    if (document.getElementById(STYLE_ID))
        return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.llm *{box-sizing:border-box;}
.llm{color:#18181b;font-size:13px;}
.llm .row-preset{display:flex;align-items:center;gap:8px;margin-bottom:12px;border:1px solid #e4e4e7;border-radius:8px;padding:6px 10px;background:#f4f4f5;}
.llm .row-preset select{flex:1;min-width:0;padding:7px 30px 7px 10px;font-size:13px;font-weight:500;border:none;background:transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;color:#18181b;outline:none;appearance:none;-webkit-appearance:none;cursor:pointer;}
.llm .row-preset .text-btn{padding:5px 9px;font-size:12px;border:1px solid transparent;border-radius:6px;background:transparent;color:#52525b;cursor:pointer;white-space:nowrap;}
.llm .row-preset .text-btn:hover{background:#fff;border-color:#d4d4d8;color:#18181b;}
.llm .row-actions{display:flex;gap:8px;margin-bottom:14px;}
.llm .row-actions button{flex:1;padding:8px 10px;font-size:12px;font-weight:500;border-radius:6px;border:1px solid #d4d4d8;background:#fff;color:#18181b;cursor:pointer;}
.llm .row-actions button:hover{background:#f4f4f5;}
.llm .row-actions button.primary{background:#18181b;color:#fff;border-color:#18181b;}
.llm .fg{display:flex;flex-direction:column;gap:4px;margin-bottom:12px;}
.llm .fg label{font-size:12px;font-weight:500;color:#18181b;}
.llm .iw{position:relative;display:flex;align-items:center;}
.llm .iw input{width:100%;padding:9px 12px;font-size:13px;font-family:inherit;border:1px solid #d4d4d8;border-radius:8px;background:#fff;color:#18181b;outline:none;}
.llm .iw select{width:100%;padding:9px 34px 9px 12px;font-size:13px;font-family:inherit;border:1px solid #d4d4d8;border-radius:8px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 14px center;color:#18181b;outline:none;appearance:none;-webkit-appearance:none;cursor:pointer;}
.llm .iw input:disabled,.llm .iw select:disabled{background:#f4f4f5;color:#a1a1aa;cursor:not-allowed;border-color:#e4e4e7;}
.llm .iw.has-prefix input{padding-left:70px;}
.llm .iw .prefix{position:absolute;left:12px;font-size:12px;color:#a1a1aa;pointer-events:none;}
.llm .iw .toggle{position:absolute;right:8px;background:none;border:none;color:#a1a1aa;font-size:14px;cursor:pointer;padding:5px;}
.llm .model-field{position:relative;width:100%;}
.llm .model-input-group{display:flex;align-items:stretch;border:1px solid #d4d4d8;border-radius:8px;background:#fff;overflow:hidden;}
.llm .model-input-group input{flex:1;min-width:0;border:none;padding:9px 12px;font-size:13px;font-family:inherit;outline:none;background:transparent;color:#18181b;}
.llm .model-fetch-btn{display:flex;align-items:center;gap:6px;padding:0 14px;border:none;border-left:1px solid #d4d4d8;background:#f4f4f5;color:#18181b;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;}
.llm .model-fetch-btn:hover{background:#e8e8ea;}
.llm .model-fetch-btn .arrow{font-size:10px;transition:transform .25s;}
.llm .model-fetch-btn .arrow.open{transform:rotate(180deg);}
.llm .model-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid #e4e4e7;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,0.08);max-height:200px;overflow:auto;z-index:30;display:none;padding:4px 0;}
.llm .model-dropdown.show{display:block;}
.llm .model-dropdown .item{display:flex;align-items:center;gap:8px;padding:8px 14px;font-size:13px;cursor:pointer;}
.llm .model-dropdown .item:hover{background:#f4f4f5;}
.llm .model-dropdown .item.active{background:#f0f0f0;}
.llm .model-dropdown .item .name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.llm .model-dropdown .item .check{color:#18181b;font-weight:600;}
.llm .model-dropdown .empty,.llm .model-dropdown .loading-item{padding:14px;text-align:center;color:#a1a1aa;font-size:13px;}
.llm .row-bottom{display:flex;align-items:center;gap:16px;margin-top:16px;border-top:1px solid #e4e4e7;padding-top:14px;}
.llm .btn-test{min-width:80px;padding:9px 16px;font-size:13px;font-weight:500;border:1px solid #d4d4d8;border-radius:8px;background:#fff;color:#18181b;cursor:pointer;}
.llm .btn-test:disabled{opacity:.6;cursor:not-allowed;}
.llm .indicator-wrap{display:flex;align-items:center;gap:8px;}
.llm .indicator{width:12px;height:12px;border-radius:50%;background:#d4d4d8;display:inline-block;}
.llm .indicator.success{background:#18181b;}
.llm .indicator.error{background:#d9534f;}
.llm .indicator-text{font-size:12px;color:#52525b;}
`;
    document.head.appendChild(style);
}
function el(tag, cls = '') {
    const e = document.createElement(tag);
    if (cls)
        e.className = cls;
    return e;
}
function setStatus(indicator, text, msg, type) {
    indicator.className = `indicator${type !== 'info' ? ' ' + type : ''}`;
    text.textContent = msg;
}
export function createConfigPanel(ui, api) {
    ensureStyle();
    const root = el('div', 'llm');
    // ---- current 状态 ----
    let currentId = 0;
    let hasKey = false;
    // ---- 预设区 ----
    const presetSelect = el('select');
    const renameBtn = el('button', 'text-btn');
    renameBtn.textContent = '改名';
    const presetRow = el('div', 'row-preset');
    presetRow.append(presetSelect, renameBtn);
    // ---- 操作按钮行 ----
    const newBtn = el('button');
    newBtn.textContent = '新建';
    const saveBtn = el('button', 'primary');
    saveBtn.textContent = '保存';
    const deleteBtn = el('button');
    deleteBtn.textContent = '删除';
    const actionRow = el('div', 'row-actions');
    actionRow.append(newBtn, saveBtn, deleteBtn);
    // ---- 表单 ----
    const fg = (label, wrap) => { const g = el('div', 'fg'); const l = document.createElement('label'); l.textContent = label; g.append(l, wrap); return g; };
    const formatSelect = el('select');
    for (const [v, t] of [['openai_compatible', 'OpenAI 兼容'], ['anthropic', 'Anthropic'], ['google', 'Google Gemini']]) {
        const o = document.createElement('option');
        o.value = v;
        o.textContent = t;
        formatSelect.appendChild(o);
    }
    const vendorSelect = el('select');
    for (const [v, t] of [['', '-- 请选择 --'], ['openai', 'OpenAI'], ['deepseek', 'DeepSeek'], ['zhipu', '智谱AI'], ['qwen', '通义千问'], ['anthropic', 'Anthropic'], ['google', 'Google']]) {
        const o = document.createElement('option');
        o.value = v;
        o.textContent = t;
        vendorSelect.appendChild(o);
    }
    const baseUrlInput = el('input');
    baseUrlInput.placeholder = 'api.example.com/v1';
    const baseWrap = el('div', 'iw has-prefix');
    const pre = el('span', 'prefix');
    pre.textContent = 'https://';
    baseWrap.append(pre, baseUrlInput);
    const modelInput = el('input');
    modelInput.placeholder = '输入或选择模型…';
    modelInput.autocomplete = 'off';
    const fetchBtn = el('button', 'model-fetch-btn');
    const arrow = el('span', 'arrow');
    arrow.textContent = '▼';
    const label = el('span');
    label.textContent = '拉取模型';
    fetchBtn.append(arrow, label);
    const modelGroup = el('div', 'model-input-group');
    modelGroup.append(modelInput, fetchBtn);
    const dropdown = el('div', 'model-dropdown');
    const modelField = el('div', 'model-field');
    modelField.append(modelGroup, dropdown);
    const keyInput = el('input');
    keyInput.type = 'password';
    keyInput.placeholder = 'sk-…';
    const toggleBtn = el('button', 'toggle');
    toggleBtn.textContent = '◉';
    const keyWrap = el('div', 'iw');
    keyWrap.append(keyInput, toggleBtn);
    const timeoutInput = el('input');
    timeoutInput.type = 'number';
    timeoutInput.value = '30';
    timeoutInput.min = '1';
    timeoutInput.max = '300';
    const nameInput = el('input');
    nameInput.placeholder = '给预设命名(如 默认)';
    const form = el('div');
    form.append(fg('预设名', nameInput), fg('格式', formatSelect), fg('厂商', vendorSelect), fg('API 地址', baseWrap), fg('模型', modelField), fg('密钥', keyWrap), fg('超时（秒）', timeoutInput));
    // ---- 底部:测试 + 指示灯 ----
    const testBtn = el('button', 'btn-test');
    testBtn.textContent = '测试';
    const indicator = el('span', 'indicator');
    const statusText = document.createElement('span');
    statusText.className = 'indicator-text';
    statusText.textContent = '就绪';
    const indicatorWrap = el('div', 'indicator-wrap');
    indicatorWrap.append(indicator, statusText);
    const bottomRow = el('div', 'row-bottom');
    bottomRow.append(testBtn, indicatorWrap);
    root.append(presetRow, actionRow, form, bottomRow);
    // ---- 函数:表单值收集/填充 ----
    function presetInput(presetId) {
        const key = keyInput.value.trim();
        return {
            presetName: nameInput.value.trim(), format: formatSelect.value, vendor: vendorSelect.value,
            baseUrl: baseUrlInput.value.trim(), model: modelInput.value.trim(), timeout: Number(timeoutInput.value) || 30,
            ...(key ? { apiKey: key } : {}),
        };
    }
    function fillForm(p) {
        nameInput.value = p.presetName;
        presetSelect.value = p.presetName;
        formatSelect.value = p.format;
        vendorSelect.value = p.vendor;
        applyVendorAuto();
        if (p.vendor) {
            baseUrlInput.value = p.baseUrl;
            baseUrlInput.disabled = true;
            formatSelect.disabled = true;
        }
        else {
            baseUrlInput.value = p.baseUrl;
            baseUrlInput.disabled = false;
            formatSelect.disabled = false;
        }
        modelInput.value = p.model;
        timeoutInput.value = String(p.timeout);
        keyInput.value = '';
        hasKey = p.hasKey;
        keyInput.placeholder = p.hasKey ? '留空保留原密钥' : 'sk-…';
    }
    function applyVendorAuto() {
        const { baseUrl, format } = computeAutoValues(vendorSelect.value);
        if (vendorSelect.value) {
            baseUrlInput.value = baseUrl;
            baseUrlInput.disabled = true;
            formatSelect.value = format;
            formatSelect.disabled = true;
        }
        else {
            baseUrlInput.value = '';
            baseUrlInput.disabled = false;
            formatSelect.disabled = false;
        }
    }
    // ---- 预设加载 ----
    async function loadPresets() {
        const rows = await api.listPresets();
        presetSelect.innerHTML = '';
        for (const r of rows) {
            const o = document.createElement('option');
            o.value = String(r.id);
            o.textContent = r.presetName;
            presetSelect.appendChild(o);
        }
        if (rows.length > 0) {
            const target = currentId > 0 && rows.some((r) => r.id === currentId) ? currentId : rows[0].id;
            await selectPreset(target);
        }
        else {
            currentId = 0;
            hasKey = false;
            resetForm();
        }
    }
    async function selectPreset(id) {
        currentId = id;
        const p = (await api.listPresets()).find((r) => r.id === id);
        if (p)
            fillForm(p);
    }
    function resetForm() {
        nameInput.value = '';
        presetSelect.value = '';
        vendorSelect.value = '';
        baseUrlInput.value = '';
        baseUrlInput.disabled = false;
        formatSelect.disabled = false;
        formatSelect.value = 'openai_compatible';
        modelInput.value = '';
        keyInput.value = '';
        timeoutInput.value = '30';
        hasKey = false;
        setStatus(indicator, statusText, '就绪', 'info');
    }
    presetSelect.addEventListener('change', () => void selectPreset(Number(presetSelect.value)));
    renameBtn.addEventListener('click', async () => {
        if (currentId === 0) {
            setStatus(indicator, statusText, '请先保存预设再改名', 'error');
            return;
        }
        const name = window.prompt('重命名预设', nameInput.value);
        if (name && name.trim() && name.trim() !== nameInput.value) {
            try {
                await api.updatePreset(currentId, { ...presetInput(currentId), presetName: name.trim() });
                ui.toast('已改名');
                await loadPresets();
                setStatus(indicator, statusText, '已改名', 'success');
            }
            catch (e) {
                setStatus(indicator, statusText, '改名失败: ' + e.message, 'error');
            }
        }
    });
    vendorSelect.addEventListener('change', () => { applyVendorAuto(); if (modelInput.value)
        modelInput.value = ''; });
    // ---- 保存 ----
    saveBtn.addEventListener('click', async () => {
        if (!nameInput.value.trim() || !baseUrlInput.value.trim() || !modelInput.value.trim()) {
            setStatus(indicator, statusText, '请完整填写预设名/地址/模型', 'error');
            return;
        }
        const input = presetInput(0);
        try {
            if (currentId === 0) {
                const { id } = await api.createPreset({ ...input, apiKey: keyInput.value.trim() });
                currentId = id;
            }
            else {
                await api.updatePreset(currentId, input);
            }
            ui.toast('已保存');
            setStatus(indicator, statusText, '已保存', 'success');
            await loadPresets();
        }
        catch (e) {
            setStatus(indicator, statusText, '保存失败: ' + e.message, 'error');
        }
    });
    // ---- 新建 / 删除 ----
    newBtn.addEventListener('click', () => {
        ui.modal({ title: '新建', desc: '新建将清空当前表单,是否继续?', onOk: () => { currentId = 0; resetForm(); setStatus(indicator, statusText, '请选择厂商并填写', 'info'); } });
    });
    deleteBtn.addEventListener('click', () => {
        if (currentId === 0) {
            setStatus(indicator, statusText, '无已选预设', 'error');
            return;
        }
        ui.modal({ title: '删除', desc: '确定删除当前预设?', onOk: async () => { await api.deletePreset(currentId); currentId = 0; await loadPresets(); } });
    });
    // ---- 模型拉取 ----
    function renderDropdown(models, current) {
        dropdown.innerHTML = '';
        const opts = buildModelOptions(models, current);
        if (opts.length === 0) {
            const e = el('div', 'empty');
            e.textContent = '没有可用模型';
            dropdown.appendChild(e);
            return;
        }
        for (const o of opts) {
            const item = el('div', 'item' + (o.active ? ' active' : ''));
            const name = el('span', 'name');
            name.textContent = o.name;
            item.appendChild(name);
            if (o.active) {
                const ck = el('span', 'check');
                ck.textContent = '✓';
                item.appendChild(ck);
            }
            item.addEventListener('click', () => { modelInput.value = o.name; dropdown.classList.remove('show'); arrow.classList.remove('open'); });
            dropdown.appendChild(item);
        }
    }
    async function openModels() {
        const willShow = !dropdown.classList.contains('show');
        dropdown.classList.toggle('show', willShow);
        arrow.classList.toggle('open', willShow);
        if (!willShow)
            return;
        const format = formatSelect.value;
        const baseUrl = baseUrlInput.value.trim();
        const apiKey = keyInput.value.trim();
        if (!baseUrl) {
            setStatus(indicator, statusText, '请先填 API 地址', 'error');
            return;
        }
        if (!apiKey) {
            setStatus(indicator, statusText, '请先填密钥', 'error');
            return;
        }
        try {
            const list = await api.fetchModelsByInput({ format, baseUrl, apiKey });
            renderDropdown(list, modelInput.value);
        }
        catch (e) {
            setStatus(indicator, statusText, '拉取失败: ' + e.message, 'error');
        }
    }
    fetchBtn.addEventListener('click', () => void openModels());
    // ---- 测试 ----
    testBtn.addEventListener('click', async () => {
        if (!currentId) {
            setStatus(indicator, statusText, '请先保存预设再测试', 'error');
            return;
        }
        testBtn.disabled = true;
        testBtn.textContent = '测试中…';
        try {
            const ok = await api.testPreset(currentId);
            setStatus(indicator, statusText, ok ? '连接成功' : '返回异常', ok ? 'success' : 'error');
        }
        catch (e) {
            setStatus(indicator, statusText, '测试失败: ' + e.message, 'error');
        }
        testBtn.disabled = false;
        testBtn.textContent = '测试';
    });
    // ---- 密钥显隐 ----
    toggleBtn.addEventListener('click', () => { keyInput.type = keyInput.type === 'password' ? 'text' : 'password'; });
    void loadPresets();
    return root;
}
