import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { diffLock } from "./diff.js";
import { reload } from "./reload.js";
import { createWatcher } from "./watcher.js";
export const name = 'hot-reload-plugin';
export function apply(ctx) {
    if (process.env.ST_HOT_RELOAD === '0')
        return;
    const stHome = process.env.ST_HOME;
    if (!stHome)
        return;
    const lockPath = join(stHome, 'pnpm-lock.yaml');
    if (!existsSync(lockPath))
        return;
    const interval = Number(process.env.ST_HOT_RELOAD_INTERVAL ?? 2000);
    let oldLock = readFileSync(lockPath, 'utf8');
    const disposeWatcher = createWatcher({
        lockPath,
        interval,
        onChange: () => {
            const newLock = readFileSync(lockPath, 'utf8');
            const { changed } = diffLock(oldLock, newLock);
            void reload(ctx, changed).then(() => {
                oldLock = newLock;
            });
        },
    });
    ctx.effect(() => () => disposeWatcher());
}
apply.inject = ['treeBuilder', 'loader'];
export default apply;
