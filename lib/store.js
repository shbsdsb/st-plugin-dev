export function createChatStore(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK (role IN ('system','user','assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
    const toRow = (r) => ({
        id: Number(r.id),
        role: String(r.role),
        content: String(r.content),
        createdAt: String(r.created_at),
    });
    return {
        listMessages() {
            const rows = db.prepare('SELECT id, role, content, created_at FROM messages ORDER BY id ASC').all();
            return rows.map((r) => toRow(r));
        },
        append(role, content) {
            const now = new Date().toISOString();
            const info = db.prepare('INSERT INTO messages (role, content, created_at) VALUES (?, ?, ?)').run(role, content, now);
            return { id: Number(info.lastInsertRowid), role, content, createdAt: now };
        },
    };
}
