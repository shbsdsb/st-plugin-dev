/** Kahn 拓扑排序:依赖在前;环/缺失依赖 → 警告 + 剩余置末尾(不中断) */
export function topoSort(items) {
    const byId = new Map(items.map((i) => [i.id, i]));
    const indegree = new Map();
    const dependents = new Map();
    const warnings = [];
    for (const item of items) {
        indegree.set(item.id, item.deps.length);
        for (const dep of item.deps) {
            if (!byId.has(dep)) {
                warnings.push(`缺失依赖: ${item.id} → ${dep}(不在清单中)`);
            }
            const list = dependents.get(dep) ?? [];
            list.push(item.id);
            dependents.set(dep, list);
        }
    }
    const queue = items.filter((i) => indegree.get(i.id) === 0).map((i) => i.id);
    const order = [];
    while (queue.length) {
        const id = queue.shift();
        order.push(id);
        for (const next of dependents.get(id) ?? []) {
            const nextInd = (indegree.get(next) ?? 1) - 1;
            indegree.set(next, nextInd);
            if (nextInd === 0)
                queue.push(next);
        }
    }
    if (order.length < items.length) {
        warnings.push(`检测到依赖环,以下条目置于末尾: ${items.filter((i) => !order.includes(i.id)).map((i) => i.id).join(', ')}`);
        for (const item of items) {
            if (!order.includes(item.id))
                order.push(item.id);
        }
    }
    return { order, warnings };
}
/** 依赖-立即性一致性:immed true 条目依赖 immed false 条目 → 黄色警告(性能/依赖警告,不阻断) */
export function checkImmedConsistency(entries) {
    const warnings = [];
    const immedBy = new Map(entries.map((e) => [e.id, e.immed]));
    for (const entry of entries) {
        if (!entry.immed)
            continue;
        for (const dep of entry.inject) {
            if (immedBy.get(dep) === false) {
                warnings.push(`依赖-立即性不一致: ${entry.id}(immed: true) 依赖 ${dep}(immed: false),依赖将在首次 require 时同步物化产生延迟,建议 ${dep} 标 immed: true`);
            }
        }
    }
    return warnings;
}
