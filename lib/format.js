function pad2(n) {
    return n < 10 ? '0' + n : String(n);
}
export function makeTime(d, fmt = 'HH:mm:ss.SSS') {
    const base = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    if (fmt === 'HH:mm:ss')
        return base;
    return `${base}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}
export function truncate(s, max) {
    if (s.length <= max)
        return s;
    return s.slice(0, max) + `…(截断 ${s.length - max} 字符)`;
}
export function jsonArgs(args, max = 120) {
    const parts = [];
    for (const a of args) {
        let s;
        try {
            s = JSON.stringify(a) ?? String(a);
        }
        catch {
            s = String(a); // 循环引用等
        }
        parts.push(truncate(s, max));
    }
    return parts.join(', ');
}
export function renderLine(line) {
    const head = `[${line.time}] [${line.kind}] ${line.plugin}`;
    return line.detail ? `${head} ${line.detail}` : head;
}
