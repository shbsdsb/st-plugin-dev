import { verifyEntry } from "./verify.js";
/** 保守热更新:新树构建 + 变更插件隔离验证全部通过 → loader 替换;任一失败保持旧状态 */
export async function reload(ctx, changed) {
    if (changed.length === 0)
        return;
    const stHome = process.env.ST_HOME ?? '';
    const profile = process.env.ST_PROFILE ?? 'default';
    let entries;
    try {
        entries = await ctx.treeBuilder.build({ stHome, profile });
    }
    catch (error) {
        ctx.logger.warn(`[hot-reload] 新树构建失败,保持旧插件: ${error.message}`);
        return;
    }
    // 变更插件逐个隔离验证(新 bundle 在 entries 里匹配)
    // diff 的 changed 是 lock 依赖名(如 'hello-web-plugin'),而 entry.id 是 patch insert id(如 'hello-web'),
    // 故匹配规则为:id 相等 或 entry.name URL 含 '/<包名>/' 段
    for (const id of changed) {
        const entry = entries.find((e) => e.id === id || e.name.includes('/' + id + '/'));
        if (!entry) {
            ctx.logger.warn(`[hot-reload] ${id} 未在树中找到,跳过验证`);
            continue;
        }
        try {
            await verifyEntry(entry);
        }
        catch (error) {
            ctx.logger.warn(`[hot-reload] ${id} 隔离验证失败,保持旧插件: ${error.message}`);
            return;
        }
    }
    try {
        await ctx.loader.root.update(entries);
        ctx.logger.info(`[hot-reload] 已更新: ${changed.join(', ')}`);
    }
    catch (error) {
        ctx.logger.warn(`[hot-reload] loader 更新失败: ${error.message}`);
    }
}
