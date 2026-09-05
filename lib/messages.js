export function isGroup(e) { return e.kind === 'group'; }
export function isChild(e) { return typeof e.base === 'string'; }
export function isPlain(e) { return !isGroup(e) && !isChild(e); }
/** 普通条目或子条目的可发送文本(trim 语义在调用方) */
export function entryText(e) {
    return typeof e.text === 'string' ? e.text : '';
}
/** 占位符子条:由 registered-entry 创建、带 placeholder 关联字段(见 spec D10/D11) */
export function isPlaceholder(e) {
    return isChild(e) && e.placeholder !== undefined;
}
