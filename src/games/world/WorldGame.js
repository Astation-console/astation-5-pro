import * as THREE from 'three';
import { Engine } from '../../core/Engine.js';
import { Physics } from '../../core/Physics.js';
import { AnimationController } from '../../core/AnimationController.js';
import { CameraRig } from '../../core/CameraRig.js';
import { InputManager } from '../../input/InputManager.js';
import { AudioManager } from '../../audio/AudioManager.js';
import { MissionManager } from '../../systems/MissionManager.js';
import { SaveManager } from '../../systems/SaveManager.js';
import { TrophyBridge } from '../../systems/TrophyBridge.js';
import { GreenValley, canReachGoal } from './GreenValley.js';
import { UI } from '../../ui/GameUI.js';
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));

export class WorldGame {
  constructor() {
    this.bridge = new TrophyBridge();
    this.ui = new UI();this.saveManager = new SaveManager();
    this.engine = null;this.physics = null;this.level = null;
    this.audio = new AudioManager();this.anim = null;this.model = null;
    this.input = null;this.cameraRig = null;
    this.running = false;this.pendingStart = null;this.elapsed = 0;
    this.vert = 0;this.jumpCount = 0;this.dashUntil = 0;this.dashCooldown = 0;
    this.health = 3;this.invuln = 0;this.lastInput = null;
    this.progress = new MissionManager();this.osRestore = null;
    this.lastSaveTime = 0; this.legacySave = {};
    this.ready = false;this.completedShown = false;
  }
  async boot() {
    this.ui.status('Loading graphics engine...',12);
    this.engine = new Engine(document.getElementById('render'), {
      quality: localStorage.getItem('ASTATION_QUALITY') || 'balanced',
      onProgress: value => this.ui.status('Loading PIX model...', Math.min(89, Math.round(value*.55)+35))
    });
    this.ui.status('Initializing Rapier physics...',21);
    this.physics = await Physics.create();
    this.cameraRig = new CameraRig(this.engine.camera);
    this.input = new InputManager(this.engine.renderer.domElement, document.getElementById('stick'), document.getElementById('touchbuttons'));
    this.ui.status('Loading animated PIX...',40);
    const gltf = await this.engine.resources.model(import.meta.env.BASE_URL + 'models/pix.glb');
    this.model = gltf.scene;
    this.model.scale.setScalar(.83);
    this.engine.scene.add(this.model);
    this.anim = new AnimationController(this.model, gltf.animations);
    this.anim.set('Idle');
    this.ui.status('Generating Green Valley...',86);
    await this.saveManager.init();
    const saved = await this.saveManager.load();
    if(saved && saved.version===6) this.progress=new MissionManager(saved.mission || {});
    this.level = new GreenValley(this.engine.scene, this.physics, (event,data) => this.onLevelEvent(event,data));
    this.level.initialize(this.progress);
    this.respawn(false);
    this.engine.onTick = dt => this.tick(dt);
    this.engine.onFrame = dt => this.frame(dt);
    this.engine.start();this.engine.pause(true);
    this.ready=true;this.ui.status('READY',100);
    this.ui.menu(this.progress.played>0?'Continue PIX’s adventure':'Welcome to Dreambound',{
      onPlay: () => this.start(false), onNew: () => this.start(true), onClassic: () => this.classic()
    });
    this.bridge.send('ready',{stage:1});
    if(this.pendingStart){const p=this.pendingStart;this.pendingStart=null;this.start(Boolean(p.newGame));}
    document.addEventListener('visibilitychange',() => { if(document.hidden && this.running) this.pause(true); });
    return this;
  }
  classic(){window.location.href = import.meta.env.BASE_URL + 'games/world/classic.html';}
  receive({event,...data}) {
    switch(event) {
      case 'restore': this.bridge.updateLegacy(data.data);this.legacySave=data.data||{};
        if(data.data?.nextgen?.mission&&!this.running){this.progress=new MissionManager(data.data.nextgen.mission);this.applyMissionVisuals();this.ui.hud(this.progress,this.health);}break;
      case 'start': if(!this.ready)this.pendingStart=data;else this.start(Boolean(data.newGame));break;
      case 'pause': this.pause(true);break;
      case 'resume': this.pause(false);break;
      case 'quality':this.engine?.setQuality(data.mode||'balanced');break;
      case 'exit': this.exit();break;
      case 'capture':try{this.bridge.send('capture',{data:this.engine.photo('image/webp')})}catch(e){this.ui.toast('Photo unavailable')}break;
      case 'inputs':this.externalInputs=data.keys || {};break;
    }
  }
  applyMissionVisuals() {
    if(!this.level)return;
    for(const gem of this.level.crystals){gem.taken=this.progress.crystals.has(gem.id);gem.visual.visible=!gem.taken;}
    for(const terminal of this.level.terminals)terminal.active=this.progress.terminals.has(terminal.id);
  }
  async start(fresh=false) {
    if(!this.ready)return;
    if(fresh) {
      this.progress=new MissionManager();this.health=3;
      for(const crystal of this.level.crystals){crystal.taken=false;crystal.visual.visible=true;}
      for(const terminal of this.level.terminals)terminal.active=false;
      this.level.enemy.stunned=0;
      await this.saveManager.save({version:6,mission:this.progress.snapshot()});
    }
    this.respawn(false);this.running=true;
    this.engine.pause(false);this.ui.hideOverlay();
    this.anim.set('Idle');this.bridge.send('started',{stage:1});
    this.ui.toast('Mission: Restore both terminals and collect 6 crystals');
  }
  respawn(hurt=true) {
    const point=this.progress.checkpoint;
    this.physics.setPlayer(point);
    this.vert=0;this.jumpCount=0;this.health=3;
    this.invuln=1.8;
    if(hurt){this.progress.failures++;this.save();this.ui.toast('Back at checkpoint');}
  }
  onLevelEvent(event,data) {
    if(event==='crystal') {
      this.audio.play('gem');this.ui.toast('Crystal recovered');this.bridge.send('collect',{stage:1,total:this.progress.crystals.size});
      if(this.progress.crystals.size===this.level.crystals.length)this.bridge.send('secret',{type:'all-crystals'});
      this.save();
    } else if(event==='terminal') {
      this.audio.play('interact');this.ui.toast('Signal terminal activated');this.save();
    } else if(event==='checkpoint') {
      this.audio.play('checkpoint');this.ui.toast('Checkpoint saved');this.save();
    } else if(event==='enemyDodged') {
      this.bridge.send('enemyDodge',{});this.ui.toast('Guardian stunned');
    }
  }
  tick(dt) {
    if(!this.running||this.engine.paused)return;
    this.elapsed+=dt;this.progress.played+=dt;
    this.invuln=Math.max(0,this.invuln-dt);this.dashCooldown=Math.max(0,this.dashCooldown-dt);
    const input=this.input.read();this.lastInput=input;
    this.cameraRig.orbit(input.camX,input.camY);
    if(input.just.pause){this.pause(true);return;}
    if(input.just.jump && this.jumpCount<2){this.vert=this.jumpCount===0?9.5:8.35;this.jumpCount++;this.audio.play('jump');}
    if(input.just.dash && this.dashCooldown===0){this.dashCooldown=1.65;this.dashUntil=this.elapsed+.23;this.audio.play('dash');}
    const dashing=this.elapsed<this.dashUntil;
    if(input.just.interact){
      if(this.level.interact(this.physics.playerBody.translation(),this.progress)) this.save();
      else this.ui.toast('Get closer to a terminal');
    }
    const speed=dashing?11.4:input.sprint?7.3:5.1;
    // Gravity is integrated by a fixed 1/90s step, while Rapier resolves wall/ground collisions.
    this.vert=Math.max(-25,this.vert-21*dt);
    this.physics.animatePlatforms(this.elapsed);
    const result=this.physics.move(input.x*speed*dt,this.vert*dt,input.z*speed*dt);
    if(result.grounded && this.vert<=0){
      if(this.vert < -7) this.audio.play('land');
      this.vert=-.2;this.jumpCount=0;
    }
    if(result.movement.y < 0 && this.vert > 0) this.vert=0;
    const p=result;
    if(p.y < -8 || Math.abs(p.x) > 28){this.respawn(true);return;}
    const events=this.level.update(dt,this.elapsed,p,this.progress,dashing);
    if(events.danger && this.invuln===0){
      this.health--;this.invuln=1.45;this.audio.play('hit');this.ui.toast('PIX took damage');
      if(this.health<=0){this.respawn(true);return;}
    }
    if(canReachGoal(this.progress,p.z)) {this.finish();return;}
    this.model.position.set(p.x,p.y-.81,p.z);
    if(Math.abs(input.x)+Math.abs(input.z)>.07) {
      const desired=Math.atan2(input.x,-input.z);
      let current=this.model.rotation.y,diff=Math.atan2(Math.sin(desired-current),Math.cos(desired-current));
      this.model.rotation.y += diff*Math.min(1,dt*11);
    }
    if(this.anim){
      const movement=Math.hypot(input.x,input.z);
      this.anim.set(this.jumpCount>0?'Jump':movement>.12?'Walk':'Idle');
      const walk=this.anim.actions.get('walk');if(walk)walk.timeScale=input.sprint?1.35:1;
    }
    if(this.elapsed-this.lastSaveTime>8){this.lastSaveTime=this.elapsed;this.save();}
  }
  frame(dt) {
    const p=this.physics?.playerBody.translation();if(!p)return;
    this.cameraRig.update(p,dt,this.level?.obstacles||[],Boolean(this.lastInput?.sprint));
    this.anim?.tick(dt);
    this.ui.hud(this.progress,this.health);
  }
  async save() {
    const state={version:6,mission:this.progress.snapshot(),savedAt:Date.now()};
    this.bridge.save(state);
    await this.saveManager.save(state).catch(e=>console.warn('Autosave error',e));
    this.bridge.send('status',{stage:1,progress:this.progress.progress(),cores:this.progress.crystals.size,played:this.progress.played});
  }
  pause(flag=true){
    if(!this.running)return;
    this.engine.pause(flag);
    if(flag){this.save();this.ui.pause({
      onResume:()=>this.pause(false),
      onRestart:()=>{this.respawn(false);this.pause(false);},
      onSave:()=>{this.save();this.ui.toast('Progress saved');},
      onPhoto:()=>{try{this.ui.photo(this.engine.photo('image/png'),()=>this.pause(true))}catch{this.ui.toast('Photo mode unavailable');}},
      onClassic:()=>this.classic(),
      onExit:()=>this.exit()
    });}
    else{this.ui.hideOverlay();this.engine.pause(false);}
  }
  async finish(){
    if(this.completedShown)return;
    this.completedShown=true;this.running=false;this.engine.pause(true);
    this.progress.finish();await this.save();
    // Stage one completion is not misreported as finishing all five worlds.
    this.bridge.completion();this.audio.play('win');
    this.ui.complete(this.progress,{onReplay:()=>{this.completedShown=false;this.start(true)},onExit:()=>this.exit(),onClassic:()=>this.classic()});
  }
  async exit(){
    await this.save();this.bridge.send('exit',{});
    if(window.parent===window)this.ui.toast('Return to ASTATION OS using the console tab');
  }
  destroy(){this.running=false;this.anim?.dispose();this.input?.dispose();this.audio.dispose();this.level?.dispose();this.physics?.dispose();this.saveManager.close();this.engine?.destroy();}
}
