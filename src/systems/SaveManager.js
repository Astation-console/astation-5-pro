const DB = 'ASTATION_GAME_ENGINE_6', STORE = 'game_saves', KEY = 'world:green-valley:v1';
export class SaveManager {
  constructor() { this.db = null; }
  async init() {
    if (!('indexedDB' in globalThis)) return this;
    try { this.db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }); } catch(e) { console.warn('IndexedDB unavailable, using local fallback', e); }
    return this;
  }
  async load() {
    if (this.db) {
      try { return await new Promise((resolve, reject) => {
        const req = this.db.transaction(STORE).objectStore(STORE).get(KEY);
        req.onsuccess = () => resolve(req.result?.data ?? null);
        req.onerror = () => reject(req.error);
      }); } catch(e) { console.warn('Save read fallback',e); }
    }
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
  }
  async save(data) {
    const snapshot = structuredClone(data);
    const record = { schema: 1, savedAt: Date.now(), data: snapshot };
    if (this.db) {
      try { await new Promise((resolve, reject) => {
        const tx = this.db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(record, KEY);
        tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
      }); return; } catch(e) { console.warn('Save write fallback',e); }
    }
    try { localStorage.setItem(KEY, JSON.stringify(snapshot)); } catch(e) { console.warn('Local save storage full',e); }
  }
  async reset() { await this.save({}); }
  close() { this.db?.close(); }
}
