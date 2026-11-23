import { AnimationMixer, LoopOnce, LoopRepeat } from 'three';

/**
 * Smooth stateful GLB animation blending.
 * Works with transform-rigged meshes and with future skinned GLB avatars.
 * Short actions hold their pose; looping locomotion can resume after an action lock.
 */
const ONESHOTS = new Set(['jump', 'doublejump', 'land', 'dash', 'interact', 'victory', 'stumble']);
const FALLBACK = { run: 'walk', doublejump: 'jump', fall: 'jump', land: 'idle', dash: 'walk', interact: 'idle', victory: 'idle', stumble: 'idle' };

export class AnimationController {
  constructor(model, clips) {
    this.mixer = new AnimationMixer(model);
    this.actions = new Map();
    for (const clip of clips) {
      const key=clip.name.toLowerCase();
      const action=this.mixer.clipAction(clip);
      action.setLoop(ONESHOTS.has(key)?LoopOnce:LoopRepeat, ONESHOTS.has(key)?1:Infinity);
      action.clampWhenFinished=ONESHOTS.has(key);
      action.enabled=true;
      this.actions.set(key,action);
    }
    this.current=null;
    this.currentName='';
    this.locked=0;
    this.crossfade=.22;
  }

  available(name) { return this.actions.has(name.toLowerCase()); }
  resolve(name) {
    let key=name.toLowerCase();
    if (!this.actions.has(key)) key=FALLBACK[key] || 'idle';
    return this.actions.has(key)?key:null;
  }

  set(name, fade=this.crossfade, {force=false, speed=1, restart=false, lock=0}={}) {
    const key=this.resolve(name);
    if (!key) return false;
    const next=this.actions.get(key);
    if (this.locked>0 && !force && next!==this.current) return false;
    if (next===this.current && !restart) {
      next.setEffectiveTimeScale(speed);
      return true;
    }
    const prior=this.current;
    // Remove weights on old inactive clips to prevent accumulating blended poses
    // after several fast consecutive state transitions.
    for (const action of this.actions.values()) {
      if (action!==next && action!==prior && action.isRunning()) action.fadeOut(Math.max(.08,fade));
    }
    next.reset();
    next.enabled=true;
    next.setEffectiveTimeScale(speed);
    next.setEffectiveWeight(1);
    next.fadeIn(Math.max(.02,fade));
    next.play();
    if (prior && prior!==next) prior.fadeOut(Math.max(.02,fade));
    this.current=next;
    this.currentName=key;
    this.locked=lock;
    return true;
  }

  trigger(name,{fade=.12,lock=.22,speed=1}={}){
    return this.set(name,fade,{force:true,restart:true,speed,lock});
  }

  updateLocomotion({grounded,verticalSpeed=0,move=0,sprint=false,dashing=false}={}){
    if(dashing) return this.set('Dash',.12);
    if(!grounded) return this.set(verticalSpeed<-.9?'Fall':'Jump',.2);
    if(move>.22) return this.set(sprint?'Run':'Walk',.21,{speed:.8+Math.min(1,move)*.2});
    return this.set('Idle',.29);
  }

  tick(dt){
    const delta=Math.min(.08,Math.max(0,dt));
    this.locked=Math.max(0,this.locked-delta);
    this.mixer.update(delta);
  }
  dispose(){this.mixer.stopAllAction();this.actions.clear();this.mixer.uncacheRoot(this.mixer.getRoot());}
}
