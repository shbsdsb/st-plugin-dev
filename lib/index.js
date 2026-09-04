import { createJsonStore } from "./json.js";
import { createEnvStore } from "./env.js";
import { createDbStore } from "./db.js";
import { createCredentialStore } from "./credential.js";
export const name = 'persist';
// 显式「无配置」schema(cordis Standard Schema v1)
const EmptyConfigSchema = {
    '~standard': {
        version: 1,
        vendor: 'persist',
        validate: (value) => ({ value: value ?? {} }),
    },
};
export function apply(ctx, _config) {
    const stHome = process.env.ST_HOME ?? '';
    if (stHome.length === 0) {
        ctx.logger.warn('[persist] ST_HOME 未设置,文件类服务(persistJson/Env/Db)调用时将报错');
    }
    if (process.platform !== 'win32') {
        ctx.logger.warn('[persist] credential 仅在 Windows 可用,当前平台调用时将报错');
    }
    ctx.provide('persistJson', createJsonStore(stHome));
    ctx.provide('persistEnv', createEnvStore(stHome));
    ctx.provide('persistDb', createDbStore(stHome));
    // 凭据不依赖 stHome(走 OS 凭据管理器)
    ctx.provide('credential', createCredentialStore());
}
apply.provide = ['persistJson', 'persistEnv', 'persistDb', 'credential'];
apply.Config = EmptyConfigSchema;
export default apply;
