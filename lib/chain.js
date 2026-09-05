import { isGroup, isPlain, isPlaceholder } from "./messages.js";
function seg(s) {
    return typeof s === 'string' && s.trim() !== '' ? s.trim() : '';
}
async function injectText(reg, parentName) {
    let raw;
    try {
        raw = await reg.fn();
    }
    catch (e) {
        throw new Error(`动态注入失败(${parentName}): ${e instanceof Error ? e.message : String(e)}`);
    }
    if (typeof raw !== 'string')
        throw new Error(`动态注入失败(${parentName}): 注入函数必须返回字符串`);
    const text = seg(raw);
    if (!text)
        throw new Error(`动态注入失败(${parentName}): 注入内容为空`);
    return text;
}
export async function buildMessages(formId, deps) {
    const { reader, registry } = deps;
    const { top, childrenByParent } = await reader.readTree(formId);
    const out = [];
    for (const e of top) {
        if (isGroup(e)) {
            const g = e;
            if (g.enabled === false)
                continue; // 顶层开关;子条无开关跟随父
            const children = childrenByParent[g.id] ?? [];
            const hasPh = children.some(isPlaceholder);
            const reg = hasPh ? registry.get(g.id) : undefined;
            if (hasPh && !reg) {
                throw new Error(`条目 "${g.name}" 依赖的插件未加载,请加载对应插件或手动删除该条目`);
            }
            const parts = [];
            for (const c of children) {
                if (isPlaceholder(c)) {
                    parts.push(await injectText(reg, g.name)); // 占位符段位 = 注入文本(仅出现一次,见 D10)
                }
                else {
                    const t = seg(c.text);
                    if (t)
                        parts.push(t);
                }
            }
            const content = parts.join('\n\n');
            if (content === '')
                continue;
            out.push({ role: g.role, content });
        }
        else if (isPlain(e)) {
            const p = e;
            if (p.enabled === false)
                continue; // 顶层开关
            const content = seg(p.text);
            if (content === '')
                continue;
            out.push({ role: p.role, content });
        }
        // 顶层游离子条(异常数据)跳过
    }
    return out;
}
