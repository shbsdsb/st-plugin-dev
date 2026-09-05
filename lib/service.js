export function createSessionService(store) {
    const tick = () => new Promise((r) => setTimeout(r, 0));
    return {
        async listSessions() { await tick(); return store.listSessions(); },
        async createSession() { await tick(); const { id } = store.createSession(); return { id, title: store.getSession(id).title }; },
        async deleteSession(id) { await tick(); store.deleteSession(id); },
        async getActiveSessionId() { await tick(); return store.getActive(); },
        async setActiveSessionId(id) { await tick(); store.getSession(id); store.setActive(id); },
        async listMessages(sessionId) { await tick(); return store.listMessages(sessionId); },
        async appendMessage(sessionId, role, content) { await tick(); store.appendMessage(sessionId, role, content); },
    };
}
