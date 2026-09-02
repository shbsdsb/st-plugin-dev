import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { resolvePersistPath } from "./path.js";
export function createDbStore(stHome) {
    return {
        async open(relativePath) {
            const p = resolvePersistPath(stHome, relativePath);
            await mkdir(dirname(p), { recursive: true });
            return new DatabaseSync(p);
        },
    };
}
