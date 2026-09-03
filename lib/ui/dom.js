// agent_plugin_dev/llm-plugin/src/ui/dom.ts — 纯 DOM 工具(无状态)
export function el(tag, cls = '') {
    const e = document.createElement(tag);
    if (cls)
        e.className = cls;
    return e;
}
export function buildModelOptions(models, current) {
    return models.map((name) => ({ name, active: name === current }));
}
export function setStatus(indicator, text, msg, type, timer) {
    indicator.className = 'indicator' + (type !== 'info' ? ' ' + type : '');
    text.textContent = msg;
    if (timer?.ref) {
        clearTimeout(timer.ref);
        timer.ref = null;
    }
    if ((type === 'success' || type === 'info') && timer) {
        timer.ref = setTimeout(() => { indicator.className = 'indicator'; text.textContent = '就绪'; }, 3500);
    }
}
