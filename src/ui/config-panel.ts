// agent_plugin_dev/llm-plugin/src/ui/config-panel.ts
import { computeAutoValues } from './provider.ts'
import { ensureStyle } from './style.ts'
import { el, buildModelOptions, setStatus } from './dom.ts'

export interface UiToolsLike {
  pluginModal(opts: { title?: string; content: string | ((el: HTMLElement) => void); actions?: Array<{ label: string; variant?: string; onClick?: () => void }> }): void
  modal(opts: { title: string; desc?: string; onOk?: () => void; onCancel?: () => void }): void
  toast(msg: string, opts?: { icon?: string }): void
}

export function createConfigPanel(ui: UiToolsLike, api: typeof import('./api.ts')): HTMLElement {
  ensureStyle()
  const root = el('div', 'llm')

  // ---- current 状态 ----
  let currentId = 0
  let hasKey = false

  // ---- 预设区 ----
  const presetSelect = el('select')
  const renameBtn = el('button', 'text-btn'); renameBtn.textContent = '改名'
  const presetRow = el('div', 'row-preset'); presetRow.append(presetSelect, renameBtn)

  // ---- 操作按钮行 ----
  const newBtn = el('button'); newBtn.textContent = '新建'
  const saveBtn = el('button', 'primary'); saveBtn.textContent = '保存'
  const deleteBtn = el('button'); deleteBtn.textContent = '删除'
  const actionRow = el('div', 'row-actions'); actionRow.append(newBtn, saveBtn, deleteBtn)

  // ---- 表单 ----
  const fg = (label: string, wrap: HTMLElement) => { const g = el('div', 'fg'); const l = document.createElement('label'); l.textContent = label; g.append(l, wrap); return g }
  const formatSelect = el('select')
  for (const [v, t] of [['openai_compatible', 'OpenAI 兼容'], ['anthropic', 'Anthropic'], ['google', 'Google Gemini']] as const) {
    const o = document.createElement('option'); o.value = v; o.textContent = t; formatSelect.appendChild(o)
  }
  const vendorSelect = el('select')
  for (const [v, t] of [['', '-- 请选择 --'], ['openai', 'OpenAI'], ['deepseek', 'DeepSeek'], ['zhipu', '智谱AI'], ['qwen', '通义千问'], ['anthropic', 'Anthropic'], ['google', 'Google']] as const) {
    const o = document.createElement('option'); o.value = v; o.textContent = t; vendorSelect.appendChild(o)
  }
  const baseUrlInput = el('input'); baseUrlInput.placeholder = 'api.example.com/v1'
  const baseWrap = el('div', 'iw has-prefix'); const pre = el('span', 'prefix'); pre.textContent = 'https://'; baseWrap.append(pre, baseUrlInput)

  const modelInput = el('input'); modelInput.placeholder = '输入或选择模型…'; modelInput.autocomplete = 'off'
  const fetchBtn = el('button', 'model-fetch-btn'); const arrow = el('span', 'arrow'); arrow.textContent = '▼'; const label = el('span', 'label-text'); label.textContent = '拉取模型'; fetchBtn.append(arrow, label)
  const modelGroup = el('div', 'model-input-group'); modelGroup.append(modelInput, fetchBtn)
  const dropdown = el('div', 'model-dropdown')
  const modelField = el('div', 'model-field'); modelField.append(modelGroup, dropdown)

  const keyInput = el('input'); keyInput.type = 'password'; keyInput.placeholder = 'sk-…'
  const toggleBtn = el('button', 'toggle'); toggleBtn.textContent = '◉'
  const keyWrap = el('div', 'iw'); keyWrap.append(keyInput, toggleBtn)

  const timeoutInput = el('input'); timeoutInput.type = 'number'; timeoutInput.value = '30'; timeoutInput.min = '1'; timeoutInput.max = '300'

  const form = el('div'); form.append(
    fg('格式', formatSelect), fg('厂商', vendorSelect), fg('API 地址', baseWrap),
    fg('模型', modelField), fg('密钥', keyWrap), fg('超时（秒）', timeoutInput),
  )

  // ---- 底部:测试 + 指示灯 ----
  const testBtn = el('button', 'btn-test'); testBtn.textContent = '测试'
  const indicator = el('span', 'indicator')
  const statusText = document.createElement('span'); statusText.className = 'indicator-text'; statusText.textContent = '就绪'
  const indicatorWrap = el('div', 'indicator-wrap'); indicatorWrap.append(indicator, statusText)
  const bottomRow = el('div', 'row-bottom'); bottomRow.append(testBtn, indicatorWrap)

  root.append(presetRow, actionRow, form, bottomRow)

  // ---- 函数:表单值收集/填充 ----
  function presetInput(presetId: number): Record<string, unknown> {
    const key = keyInput.value.trim()
    return {
      presetName: presetSelect.value, format: formatSelect.value, vendor: vendorSelect.value,
      baseUrl: baseUrlInput.value.trim(), model: modelInput.value.trim(), timeout: Number(timeoutInput.value) || 30,
      ...(key ? { apiKey: key } : {}),
    }
  }
  function fillForm(p: { presetName: string; format: string; vendor: string; baseUrl: string; model: string; timeout: number; hasKey: boolean }): void {
    presetSelect.value = p.presetName
    formatSelect.value = p.format
    vendorSelect.value = p.vendor
    applyVendorAuto()
    if (p.vendor) { baseUrlInput.value = p.baseUrl; baseUrlInput.disabled = true; formatSelect.disabled = true }
    else { baseUrlInput.value = p.baseUrl; baseUrlInput.disabled = false; formatSelect.disabled = false }
    modelInput.value = p.model
    timeoutInput.value = String(p.timeout)
    keyInput.value = ''
    hasKey = p.hasKey
    keyInput.placeholder = p.hasKey ? '留空保留原密钥' : 'sk-…'
  }
  function applyVendorAuto(): void {
    const { baseUrl, format } = computeAutoValues(vendorSelect.value)
    if (vendorSelect.value) {
      baseUrlInput.value = baseUrl; baseUrlInput.disabled = true
      formatSelect.value = format; formatSelect.disabled = true
    } else {
      baseUrlInput.value = ''; baseUrlInput.disabled = false; formatSelect.disabled = false
    }
  }

  // ---- 预设加载 ----
  async function loadPresets(): Promise<void> {
    const rows = await api.listPresets()
    presetSelect.innerHTML = ''
    for (const r of rows) { const o = document.createElement('option'); o.value = String(r.id); o.textContent = r.presetName; presetSelect.appendChild(o) }
    if (rows.length > 0) {
      const target = currentId > 0 && rows.some((r) => r.id === currentId) ? currentId : rows[0].id
      await selectPreset(target)
    } else { currentId = 0; hasKey = false; resetForm() }
  }
  async function selectPreset(id: number): Promise<void> {
    currentId = id
    const p = (await api.listPresets()).find((r) => r.id === id)
    if (p) fillForm(p)
  }
  function resetForm(): void {
    let o = Array.from(presetSelect.options).find((x) => x.value === '新预设')
    if (!o) { o = document.createElement('option'); o.value = '新预设'; o.textContent = '新预设'; presetSelect.appendChild(o) }
    presetSelect.value = '新预设'
    vendorSelect.value = ''
    baseUrlInput.value = ''; baseUrlInput.disabled = false; formatSelect.disabled = false
    formatSelect.value = 'openai_compatible'
    modelInput.value = ''; keyInput.value = ''; timeoutInput.value = '30'; hasKey = false
    setStatus(indicator, statusText, '就绪', 'info')
  }

  presetSelect.addEventListener('change', () => void selectPreset(Number(presetSelect.value)))
  renameBtn.addEventListener('click', async () => {
    if (currentId === 0) { setStatus(indicator, statusText, '请先保存预设再改名', 'error'); return }
    const name = window.prompt('重命名预设', presetSelect.value)
    if (name && name.trim() && name.trim() !== presetSelect.value) {
      try {
        await api.updatePreset(currentId, { ...presetInput(currentId), presetName: name.trim() })
        ui.toast('已改名')
        await loadPresets()
        setStatus(indicator, statusText, '已改名', 'success')
      } catch (e) { setStatus(indicator, statusText, '改名失败: ' + (e as Error).message, 'error') }
    }
  })
  vendorSelect.addEventListener('change', () => { applyVendorAuto(); if (modelInput.value) modelInput.value = '' })

  // ---- 保存 ----
  saveBtn.addEventListener('click', async () => {
    if (!presetSelect.value || !baseUrlInput.value.trim() || !modelInput.value.trim()) { setStatus(indicator, statusText, '请完整填写预设名/地址/模型', 'error'); return }
    const input = presetInput(0)
    try {
      if (currentId === 0) { const { id } = await api.createPreset({ ...input, apiKey: keyInput.value.trim() }); currentId = id }
      else { await api.updatePreset(currentId, input) }
      ui.toast('已保存')
      setStatus(indicator, statusText, '已保存', 'success')
      await loadPresets()
    } catch (e) { setStatus(indicator, statusText, '保存失败: ' + (e as Error).message, 'error') }
  })

  // ---- 新建 / 删除 ----
  newBtn.addEventListener('click', () => {
    ui.modal({ title: '新建', desc: '新建将清空当前表单,是否继续?', onOk: () => { currentId = 0; resetForm(); setStatus(indicator, statusText, '请选择厂商并填写', 'info') } })
  })
  deleteBtn.addEventListener('click', () => {
    if (currentId === 0) { setStatus(indicator, statusText, '无已选预设', 'error'); return }
    ui.modal({ title: '删除', desc: '确定删除当前预设?', onOk: async () => { await api.deletePreset(currentId); currentId = 0; await loadPresets() } })
  })

  // ---- 模型拉取 ----
  function renderDropdown(models: string[], current: string): void {
    dropdown.innerHTML = ''
    const opts = buildModelOptions(models, current)
    if (opts.length === 0) { const e = el('div', 'empty'); e.textContent = '没有可用模型'; dropdown.appendChild(e); return }
    for (const o of opts) {
      const item = el('div', 'item' + (o.active ? ' active' : ''))
      const name = el('span', 'name'); name.textContent = o.name
      item.appendChild(name)
      if (o.active) { const ck = el('span', 'check'); ck.textContent = '✓'; item.appendChild(ck) }
      item.addEventListener('click', () => { modelInput.value = o.name; dropdown.classList.remove('show'); arrow.classList.remove('open') })
      dropdown.appendChild(item)
    }
  }
  async function openModels(): Promise<void> {
    const willShow = !dropdown.classList.contains('show')
    dropdown.classList.toggle('show', willShow)
    arrow.classList.toggle('open', willShow)
    if (!willShow) return
    const format = formatSelect.value
    const baseUrl = baseUrlInput.value.trim()
    const apiKey = keyInput.value.trim()
    if (!baseUrl) { setStatus(indicator, statusText, '请先填 API 地址', 'error'); return }
    if (!apiKey) { setStatus(indicator, statusText, '请先填密钥', 'error'); return }
    try {
      const list = await api.fetchModelsByInput({ format, baseUrl, apiKey })
      renderDropdown(list, modelInput.value)
    } catch (e) { setStatus(indicator, statusText, '拉取失败: ' + (e as Error).message, 'error') }
  }
  fetchBtn.addEventListener('click', () => void openModels())

  // ---- 测试 ----
  testBtn.addEventListener('click', async () => {
    if (!currentId) { setStatus(indicator, statusText, '请先保存预设再测试', 'error'); return }
    testBtn.disabled = true; testBtn.textContent = '测试中…'
    try {
      const ok = await api.testPreset({ id: currentId })
      setStatus(indicator, statusText, ok ? '连接成功' : '返回异常', ok ? 'success' : 'error')
    } catch (e) { setStatus(indicator, statusText, '测试失败: ' + (e as Error).message, 'error') }
    testBtn.disabled = false; testBtn.textContent = '测试'
  })

  // ---- 密钥显隐 ----
  toggleBtn.addEventListener('click', () => { keyInput.type = keyInput.type === 'password' ? 'text' : 'password' })

  void loadPresets()
  return root
}
