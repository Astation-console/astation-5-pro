export class EventBus {
  #listeners = new Map();
  on(type, fn) {
    let handlers = this.#listeners.get(type);
    if (!handlers) this.#listeners.set(type, handlers = new Set());
    handlers.add(fn);
    return () => this.off(type, fn);
  }
  off(type, fn) { this.#listeners.get(type)?.delete(fn); }
  emit(type, detail = {}) {
    for (const callback of this.#listeners.get(type) ?? []) callback(detail);
  }
  clear() { this.#listeners.clear(); }
}
