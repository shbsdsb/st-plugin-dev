import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { resolvePersistPath } from "./path.js";
export function createJsonStore(stHome) {
    return {
        async read(relativePath) {
            const p = resolvePersistPath(stHome, relativePath);
            let raw;
            try {
                raw = await readFile(p, 'utf8');
            }
            catch (e) {
                if (e.code === 'ENOENT')
                    return null;
                throw e;
            }
            return JSON.parse(raw);
        },
        async write(relativePath, data) {
            const p = resolvePersistPath(stHome, relativePath);
            await mkdir(dirname(p), { recursive: true });
            await writeFile(p, JSON.stringify(data, null, 2), 'utf8');
        },
    };
}
