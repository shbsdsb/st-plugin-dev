export function initPresets(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    presetName TEXT NOT NULL,
    format TEXT NOT NULL,
    vendor TEXT NOT NULL DEFAULT '',
    baseUrl TEXT NOT NULL,
    model TEXT DEFAULT '',
    timeout INTEGER NOT NULL DEFAULT 30,
    updatedAt TEXT NOT NULL
  )`);
    db.exec(`CREATE TABLE IF NOT EXISTS active_preset (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    preset_id INTEGER NOT NULL
  )`);
}
function rowToPreset(r) {
    return {
        id: Number(r.id),
        presetName: String(r.presetName),
        format: String(r.format),
        vendor: String(r.vendor),
        baseUrl: String(r.baseUrl),
        model: String(r.model ?? ''),
        timeout: Number(r.timeout),
        hasKey: false,
        updatedAt: String(r.updatedAt),
    };
}
export function listPresets(db) {
    const rows = db.prepare('SELECT * FROM presets ORDER BY id').all();
    return rows.map(rowToPreset);
}
export function getPreset(db, id) {
    const r = db.prepare('SELECT * FROM presets WHERE id = ?').get(id);
    return r ? rowToPreset(r) : null;
}
export function createPreset(db, input) {
    const res = db.prepare('INSERT INTO presets (presetName, format, vendor, baseUrl, model, timeout, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(input.presetName, input.format, input.vendor, input.baseUrl, input.model, input.timeout, new Date().toISOString());
    return Number(res.lastInsertRowid);
}
export function updatePreset(db, id, input) {
    const res = db.prepare('UPDATE presets SET presetName=?, format=?, vendor=?, baseUrl=?, model=?, timeout=?, updatedAt=? WHERE id=?').run(input.presetName, input.format, input.vendor, input.baseUrl, input.model, input.timeout, new Date().toISOString(), id);
    return Number(res.changes) > 0;
}
export function deletePreset(db, id) {
    const res = db.prepare('DELETE FROM presets WHERE id=?').run(id);
    return Number(res.changes) > 0;
}
export function getActivePresetId(db) {
    const r = db.prepare('SELECT preset_id FROM active_preset WHERE id = 1').get();
    return r && typeof r.preset_id === 'number' ? r.preset_id : null;
}
export function setActivePresetId(db, id) {
    db.prepare('INSERT INTO active_preset (id, preset_id) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET preset_id = excluded.preset_id').run(id);
}
export function clearIfActivePreset(db, id) {
    db.prepare('DELETE FROM active_preset WHERE id = 1 AND preset_id = ?').run(id);
}
