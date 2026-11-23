import { AnimationMixer } from 'three';
/** Supports transform-animated GLB and skinned rigs alike. */
export class AnimationController {
  constructor(model, clips) {
    this.mixer = new AnimationMixer(model);
    this.actions = new Map(clips.map(c => [c.name.toLowerCase(), this.mixer.clipAction(c)]));
    this.current = null;
    this.currentName = '';
  }
  set(name, fade = .18) {
    const next = this.actions.get(name.toLowerCase());
    if (!next || next === this.current) return Boolean(next);
    next.enabled = true;
    next.reset();
    next.setEffectiveWeight(1);
    next.fadeIn(fade).play();
    this.current?.fadeOut(fade);
    this.current = next;
    this.currentName = name;
    return true;
  }
  tick(dt) { this.mixer.update(dt); }
  dispose() { this.mixer.stopAllAction(); this.actions.clear(); }
}
