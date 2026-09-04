/** 按序组装 messages:跳过 text 为空/纯空白的条目 */
export function buildMessages(entries) {
    const out = [];
    for (const e of entries) {
        if (!e)
            continue;
        if (typeof e.text !== 'string' || e.text.trim() === '')
            continue;
        out.push({ role: e.role, content: e.text });
    }
    return out;
}
