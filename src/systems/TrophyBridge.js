// Contract with the existing ASTATION OS. We only emit real gameplay events.
const SOURCE = 'astation-world-v4';
const allowed = new Set(['ready','started','collect','worldComplete','save','status','secret','enemyDodge','bossDefeated','error','exit','capture']);
export class TrophyBridge {
  constructor() { this.legacySave = {}; }
  updateLegacy(data) { if (data && typeof data === 'object') this.legacySave = data; }
  send(event, payload = {}) {
    if (!allowed.has(event)) throw new Error(`Unsupported ASTATION OS event: ${event}`);
    if (window.parent !== window) window.parent.postMessage({ source: SOURCE, event, ...payload }, location.origin);
  }
  save(nextgen) {
    // Retain old-world progress, trophy counters and collected items in the OS.
    const merged = { ...this.legacySave, nextgen, version: 6 };
    this.send('save', { save: merged });
  }
  completion() { this.send('worldComplete', { stage: 1 }); }
}
