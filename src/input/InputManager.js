const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export class InputManager {
  constructor(canvas, stick, buttons) {
    this.keys = new Set(); this.buttons = new Set(); this.pressed = new Set(); this.last = new Set();
    this.x = 0; this.z = 0; this.camX = 0; this.camY = 0;
    this.canvas = canvas; this.stick = stick; this.touchX = 0; this.touchZ = 0;
    this.listeners = []; this.padPrev = { start: false }; this.lastPointer = null;
    this.listen(window, 'keydown', e => { if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); this.keys.add(e.code); });
    this.listen(window, 'keyup', e => this.keys.delete(e.code));
    this.listen(window, 'blur', () => { this.keys.clear(); this.buttons.clear(); });
    if (stick) {
      this.listen(stick, 'pointerdown', e => { e.preventDefault(); stick.setPointerCapture(e.pointerId); this.stickId = e.pointerId; this.updateStick(e); });
      this.listen(stick, 'pointermove', e => { if (e.pointerId === this.stickId) this.updateStick(e); });
      for (const kind of ['pointerup', 'pointercancel']) this.listen(stick, kind, e => { if (e.pointerId === this.stickId) { this.stickId = null; this.touchX = this.touchZ = 0; stick.querySelector('.nub')?.style.setProperty('transform', 'translate(0px,0px)'); } });
    }
    buttons?.querySelectorAll('[data-input]')?.forEach(button => {
      const key = button.dataset.input;
      this.listen(button, 'pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); this.buttons.add(key); });
      for (const kind of ['pointerup', 'pointercancel', 'lostpointercapture']) this.listen(button, kind, () => this.buttons.delete(key));
    });
    this.listen(canvas, 'pointerdown', e => { if (e.pointerType === 'touch' && e.clientX < innerWidth * .45) return; this.lastPointer = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
    this.listen(canvas, 'pointermove', e => { if (!this.lastPointer || this.lastPointer.id !== e.pointerId) return; this.camX += e.clientX - this.lastPointer.x; this.camY += e.clientY - this.lastPointer.y; this.lastPointer.x = e.clientX; this.lastPointer.y = e.clientY; });
    this.listen(canvas, 'pointerup', () => this.lastPointer = null);
    this.listen(canvas, 'pointercancel', () => this.lastPointer = null);
  }
  listen(target, name, fn) { target.addEventListener(name, fn); this.listeners.push([target, name, fn]); }
  updateStick(e) {
    const r = this.stick.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const magnitude = Math.max(1, Math.hypot(dx, dy)), strength = Math.min(1, magnitude / (r.width * .4));
    this.touchX = dx / magnitude * strength; this.touchZ = dy / magnitude * strength;
    this.stick.querySelector('.nub')?.style.setProperty('transform', `translate(${this.touchX * 34}px, ${this.touchZ * 34}px)`);
  }
  read() {
    let x = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    let z = (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) - (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0);
    let jump = this.keys.has('Space') || this.buttons.has('jump');
    let dash = this.keys.has('KeyQ') || this.buttons.has('dash');
    let interact = this.keys.has('KeyE') || this.buttons.has('interact');
    let pause = this.keys.has('Escape') || this.buttons.has('pause');
    let sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const pad = [...(navigator.getGamepads?.() || [])].find(Boolean);
    if (pad) {
      if (Math.abs(pad.axes[0] || 0) > .14) x = pad.axes[0];
      if (Math.abs(pad.axes[1] || 0) > .14) z = pad.axes[1];
      this.camX += Math.abs(pad.axes[2] || 0) > .18 ? pad.axes[2] * 6 : 0;
      this.camY += Math.abs(pad.axes[3] || 0) > .18 ? pad.axes[3] * 4 : 0;
      jump ||= Boolean(pad.buttons[0]?.pressed);
      dash ||= Boolean(pad.buttons[1]?.pressed);
      interact ||= Boolean(pad.buttons[2]?.pressed);
      pause ||= Boolean(pad.buttons[9]?.pressed);
      sprint ||= Boolean(pad.buttons[5]?.pressed);
    }
    if (Math.abs(this.touchX) > .08 || Math.abs(this.touchZ) > .08) { x = this.touchX; z = this.touchZ; }
    const magnitude = Math.max(1, Math.hypot(x, z)); x /= magnitude; z /= magnitude;
    const actions = { jump, dash, interact, pause };
    const just = Object.fromEntries(Object.entries(actions).map(([k,v]) => [k, v && !this.last.has(k)]));
    this.last = new Set(Object.keys(actions).filter(k => actions[k]));
    const result = { x, z, sprint, ...actions, just, camX: this.camX, camY: this.camY };
    this.camX = 0; this.camY = 0;
    return result;
  }
  dispose() { for (const [target, name, fn] of this.listeners) target.removeEventListener(name, fn); this.listeners.length = 0; }
}
