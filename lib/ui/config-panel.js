// agent_plugin_dev/llm-plugin/src/ui/config-panel.ts
import { createEmptyState, fromRow, applyVendor, checkSave, checkTest } from "./state.js";
import { ensureStyle } from "./style.js";
import { el, setStatus } from "./dom.js";
export function createConfigPanel(ui, api) {
    ensureStyle();
    const root = el('div', 'llm');
    // ===== 内存态(唯一真源;apiKey 只活在表单) =====
    let state = createEmptyState();
    let rows = [];
    const statusTimer = { ref: null };
    const setStatusNow = (msg, type) => setStatus(indicator, statusText, msg, type, statusTimer);
    // ===== DOM 骨架 =====
    // 预设条:下拉 + 改名触发器 + 内联改名条
    const presetSelect = el('select');
    const renameTrigger = el('button', 'text-btn');
    renameTrigger.textContent = '改名';
    const renameWrap = el('div', 'preset-rename-inline');
    const renameInput = el('input');
    renameInput.placeholder = '名称';
    renameInput.maxLength = 50;
    const renameOk = el('button', 'ok');
    renameOk.textContent = '确认';
    const renameCancel = el('button', 'cancel');
    renameCancel.textContent = '取消';
    renameWrap.append(renameInput, renameOk, renameCancel);
    const presetRow = el('div', 'row-preset');
    presetRow.append(presetSelect, renameWrap, renameTrigger);
    // 动作行
    const newBtn = el('button');
    newBtn.textContent = '新建';
    const saveBtn = el('button', 'primary');
    saveBtn.textContent = '保存';
    const deleteBtn = el('button');
    deleteBtn.textContent = '删除';
    const actionRow = el('div', 'row-actions');
    actionRow.append(newBtn, saveBtn, deleteBtn);
    // 表单
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
    const label = el('span', 'label-text');
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
    const timeoutWrap = el('div', 'iw');
    timeoutWrap.appendChild(timeoutInput);
    const form = el('div');
    form.append(fg('格式', formatSelect), fg('厂商', vendorSelect), fg('API 地址', baseWrap), fg('模型', modelField), fg('密钥', keyWrap), fg('超时（秒）', timeoutWrap));
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
    // ===== 状态 → 表单 / 表单 → 状态 =====
    function applyStateToForm() {
        formatSelect.value = state.format;
        vendorSelect.value = state.vendor;
        baseUrlInput.value = state.baseUrl;
        modelInput.value = state.model;
        timeoutInput.value = String(state.timeout);
        keyInput.value = '';
        keyInput.placeholder = state.hasKey ? '留空保留原密钥' : 'sk-…';
        const locked = !!state.vendor;
        baseUrlInput.disabled = locked;
        formatSelect.disabled = locked;
    }
    function collectFormIntoState() {
        state.format = formatSelect.value;
        state.vendor = vendorSelect.value;
        state.baseUrl = baseUrlInput.value.trim();
        state.model = modelInput.value.trim();
        state.timeout = Number(timeoutInput.value) || 30;
    }
    // ===== 预设下拉(仅导航:id 驱动,永不写文本) =====
    function syncOptions() {
        const keep = state.id !== null ? String(state.id) : '';
        presetSelect.innerHTML = '';
        if (state.id === null) {
            const o = document.createElement('option');
            o.value = '';
            o.textContent = state.name;
            presetSelect.appendChild(o);
        }
        for (const r of rows) {
            const o = document.createElement('option');
            o.value = String(r.id);
            o.textContent = r.presetName;
            presetSelect.appendChild(o);
        }
        presetSelect.value = keep;
    }
    // 载入已存预设后上报激活(fire-and-forget;失败静默;空态不触发)
    const activateCurrent = () => { if (state.id != null)
        void api.setActive(state.id).catch(() => { }); };
    presetSelect.addEventListener('change', () => {
        const v = presetSelect.value;
        if (!v)
            return;
        const row = rows.find((r) => r.id === Number(v));
        if (row) {
            state = fromRow(row);
            applyStateToForm();
            setStatusNow('已加载', 'info');
            activateCurrent();
        }
    });
    // ===== 内联改名(demo 行为;无 window.prompt) =====
    function enterRename() {
        renameInput.value = state.name;
        presetRow.classList.add('renaming');
        presetSelect.style.display = 'none';
        renameTrigger.style.display = 'none';
        renameWrap.classList.add('active');
        renameInput.focus();
        renameInput.select();
    }
    function exitRename(save) {
        presetRow.classList.remove('renaming');
        presetSelect.style.display = '';
        renameTrigger.style.display = '';
        renameWrap.classList.remove('active');
        if (!save)
            return;
        const next = renameInput.value.trim();
        if (!next || next === state.name)
            return;
        const old = state.name;
        state.name = next;
        if (state.id === null) {
            syncOptions();
            setStatusNow('已改名(保存后生效)', 'info');
            return;
        }
        syncOptions();
        api.updatePreset(state.id, { ...state, presetName: state.name })
            .then(() => {
            const row = rows.find((r) => r.id === state.id);
            if (row)
                row.presetName = state.name;
            syncOptions();
            setStatusNow('已改名', 'success');
        })
            .catch((e) => { state.name = old; syncOptions(); setStatusNow('改名失败: ' + e.message, 'error'); });
    }
    renameTrigger.addEventListener('click', enterRename);
    renameOk.addEventListener('click', () => exitRename(true));
    renameCancel.addEventListener('click', () => exitRename(false));
    renameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')
            exitRename(true);
        else if (e.key === 'Escape')
            exitRename(false);
    });
    // ===== 新建(无弹窗,直进空态) =====
    function newPreset() {
        state = createEmptyState();
        applyStateToForm();
        syncOptions();
        setStatusNow('已新建', 'info');
    }
    newBtn.addEventListener('click', newPreset);
    // ===== 保存(按钮锁 + rowid 覆盖) =====
    async function save() {
        collectFormIntoState();
        const key = keyInput.value.trim();
        const chk = checkSave(state, key);
        if (!chk.ok) {
            const target = chk.field === 'baseUrl' ? baseUrlInput : chk.field === 'model' ? modelInput : keyInput;
            target.focus();
            setStatusNow(chk.field === 'apiKey' ? '请先输入 API Key' : '请完整填写地址/模型', 'error');
            return;
        }
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中…';
        try {
            if (state.id === null) {
                const body = { ...state, presetName: state.name, apiKey: key };
                const { id } = await api.createPreset(body);
                state.id = id;
                state.hasKey = !!key;
                activateCurrent(); // 新建保存成功即停留激活(决策:新建须先保存一次才可激活)
            }
            else {
                await api.updatePreset(state.id, { ...state, presetName: state.name, ...(key ? { apiKey: key } : {}) });
                if (key)
                    state.hasKey = true;
            }
            rows = await api.listPresets();
            syncOptions();
            setStatusNow('已保存', 'success');
            ui.toast('已保存');
        }
        catch (e) {
            setStatusNow('保存失败: ' + e.message, 'error');
        }
        finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '保存';
        }
    }
    saveBtn.addEventListener('click', () => void save());
    // ===== 删除(宿主 modal 确认;空态提示) =====
    function removeCurrent() {
        if (state.id === null) {
            setStatusNow('没有可删除的预设', 'error');
            return;
        }
        const id = state.id;
        const name = state.name;
        ui.modal({
            title: '删除预设', desc: `确定删除「${name}」?`,
            onOk: () => {
                api.deletePreset(id)
                    .then(async () => {
                    rows = (await api.listPresets()).filter((r) => r.id !== id);
                    if (rows.length > 0) {
                        state = fromRow(rows[0]);
                        applyStateToForm();
                        activateCurrent();
                    }
                    else {
                        state = createEmptyState();
                        applyStateToForm();
                    }
                    syncOptions();
                    setStatusNow('已删除', 'info');
                })
                    .catch((e) => setStatusNow('删除失败: ' + e.message, 'error'));
            },
        });
    }
    deleteBtn.addEventListener('click', removeCurrent);
    // ===== 拉取模型(当前表单;key 空回退 credential) =====
    function renderDropdown(models, current) {
        dropdown.innerHTML = '';
        const opts = models.map((name) => ({ name, active: name === current }));
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
        collectFormIntoState();
        const willShow = !dropdown.classList.contains('show');
        dropdown.classList.toggle('show', willShow);
        arrow.classList.toggle('open', willShow);
        if (!willShow)
            return;
        if (!state.baseUrl) {
            setStatusNow('请先填 API 地址', 'error');
            return;
        }
        const key = keyInput.value.trim();
        fetchBtn.disabled = true;
        fetchBtn.style.opacity = '0.6';
        try {
            const list = key
                ? await api.fetchModelsByInput({ format: state.format, baseUrl: state.baseUrl, apiKey: key, timeout: state.timeout })
                : state.id !== null
                    ? await api.fetchModels(state.id)
                    : (() => { throw new Error('API_KEY_NEEDED'); })();
            renderDropdown(list, modelInput.value);
        }
        catch (e) {
            dropdown.classList.remove('show');
            arrow.classList.remove('open');
            const msg = e.message;
            setStatusNow(msg === 'API_KEY_NEEDED' || /密钥/.test(msg) ? '请先输入 API Key' : '拉取失败: ' + msg, 'error');
        }
        finally {
            fetchBtn.disabled = false;
            fetchBtn.style.opacity = '';
        }
    }
    fetchBtn.addEventListener('click', () => void openModels());
    // ===== 测试(指示灯;error 常驻) =====
    async function runTest() {
        collectFormIntoState();
        const key = keyInput.value.trim();
        const chk = checkTest(state, { format: state.format, baseUrl: state.baseUrl, model: state.model }, key);
        if ('missing' in chk) {
            const target = chk.missing === 'baseUrl' ? baseUrlInput : chk.missing === 'model' ? modelInput : keyInput;
            target.focus();
            setStatusNow(chk.missing === 'apiKey' ? '请先输入 API Key 或保存预设' : '请填写有效信息', 'error');
            return;
        }
        testBtn.disabled = true;
        testBtn.textContent = '测试中…';
        try {
            const ok = await (chk.mode === 'id'
                ? api.testPreset({ id: state.id })
                : api.testPreset({ format: state.format, baseUrl: state.baseUrl, model: state.model, apiKey: key, timeout: state.timeout }));
            setStatusNow(ok ? '连接成功' : '返回异常', ok ? 'success' : 'error');
        }
        catch (e) {
            setStatusNow('测试失败: ' + e.message, 'error');
        }
        finally {
            testBtn.disabled = false;
            testBtn.textContent = '测试';
        }
    }
    testBtn.addEventListener('click', () => void runTest());
    // 厂商联动:自动 URL/格式 + 锁输入 + 清模型
    vendorSelect.addEventListener('change', () => {
        state = applyVendor(state, vendorSelect.value);
        baseUrlInput.value = state.baseUrl;
        formatSelect.value = state.format;
        const locked = !!state.vendor;
        baseUrlInput.disabled = locked;
        formatSelect.disabled = locked;
        if (modelInput.value)
            modelInput.value = '';
        state.model = '';
    });
    toggleBtn.addEventListener('click', () => { keyInput.type = keyInput.type === 'password' ? 'text' : 'password'; });
    // ===== 初始化(先恢复持久化 active;取不到则 fallback rows[0];空表走空态不激活) =====
    void (async () => {
        try {
            rows = await api.listPresets();
            if (rows.length === 0) {
                state = createEmptyState();
                applyStateToForm();
            }
            else {
                const activeId = await api.getActive().catch(() => null);
                const target = rows.find((r) => r.id === activeId) ?? rows[0];
                state = fromRow(target);
                applyStateToForm();
                activateCurrent();
            }
        }
        catch (e) {
            setStatusNow('加载失败: ' + e.message, 'error');
        }
        syncOptions();
    })();
    return root;
}
