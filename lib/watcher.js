import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
/** 轮询 lock 文件 sha256,变化触发 onChange;返回 dispose */
export function createWatcher(opts) {
    let lastHash = null;
    const interval = opts.interval ?? 2000;
    const timer = setInterval(() => {
        if (!existsSync(opts.lockPath))
            return;
        const hash = createHash('sha256').update(readFileSync(opts.lockPath)).digest('hex');
        if (lastHash === null) {
            lastHash = hash;
            return;
        }
        if (hash !== lastHash) {
            lastHash = hash;
            opts.onChange();
        }
    }, interval);
    return () => clearInterval(timer);
}
