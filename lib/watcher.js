import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
/** 轮询监听:lock 变化 → onChange;任一 patch 变化 → onPatchChange;初次快照不触发;返回 dispose */
export function createWatcher(opts) {
    const interval = opts.interval ?? 2000;
    const hashOf = (path) => existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex') : '';
    const last = new Map();
    const timer = setInterval(() => {
        if (existsSync(opts.lockPath)) {
            const lockHash = hashOf(opts.lockPath);
            if (!last.has(opts.lockPath)) {
                last.set(opts.lockPath, lockHash);
            }
            else if (lockHash !== last.get(opts.lockPath)) {
                last.set(opts.lockPath, lockHash);
                opts.onChange();
            }
        }
        for (const p of opts.patchPaths ?? []) {
            if (!existsSync(p))
                continue;
            const h = hashOf(p);
            if (!last.has(p)) {
                last.set(p, h);
            }
            else if (h !== last.get(p)) {
                last.set(p, h);
                opts.onPatchChange?.();
            }
        }
    }, interval);
    return () => clearInterval(timer);
}
