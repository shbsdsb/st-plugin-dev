export function createSessionAdapter(multi) {
    return {
        async getActive() {
            return multi.getActiveSessionId();
        },
        async getMessages() {
            const id = await multi.getActiveSessionId();
            if (!id)
                return [];
            const rows = await multi.listMessages(id);
            return rows.map((r) => ({ role: r.role, content: r.content }));
        },
        async append(role, content) {
            const id = await multi.getActiveSessionId();
            if (!id)
                throw new Error('请先在右侧新建或选择会话');
            await multi.appendMessage(id, role, content);
        },
    };
}
