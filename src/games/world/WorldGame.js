import * as THREE from 'three';
import { Engine } from '../../core/Engine.js';
import { Physics } from '../../core/Physics.js';
import { AnimationController } from '../../core/AnimationController.js';
import { selectPixLocomotion, pixLean } from '../../core/AnimationState.js';
import { CameraRig } from '../../core/CameraRig.js';
import { InputManager } from '../../input/InputManager.js';
import { AudioManager } from '../../audio/AudioManager.js';
import { MissionManager } from '../../systems/MissionManager.js';
import { SaveManager } from '../../systems/SaveManager.js';
import { TrophyBridge } from '../../systems/TrophyBridge.js';
import { GreenValley, canReachGoal } from './GreenValley.js';
import { UI } from '../../ui/GameUI.js';
import { cameraRelativeMovement, JumpAssist } from './Movement.js';
import { ImpactEffects } from './ImpactEffects.js';
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));

export class WorldGame {
  constructor() {
    this.bridge = new TrophyBridge();
    this.ui = new UI();this.saveManager = new SaveManager();
    this.onGlobalKey = event => {if(event.code==='Escape' && this.running && this.engine?.paused && !event.repeat){event.preventDefault();this.pause(false)}};
    window.addEventListener('keydown',this.onGlobalKey);
    this.engine = null;this.physics = null;this.level = null;
    this.audio = new AudioManager();this.anim = null;this.model = null;
    this.input = null;this.cameraRig = null;
    this.running = false;this.pendingStart = null;this.elapsed = 0;
    this.vert = 0;this.jumpCount = 0;this.dashUntil = 0;this.dashCooldown = 0;
    this.health = 3;this.invuln = 0;this.lastInput = null;
    this.progress = new MissionManager();this.osRestore = null;
    this.lastSaveTime = 0; this.legacySave = {};
    this.ready = false;this.completedShown = false;
    this.jumpAssist = new JumpAssist();this.effects = null;this.trailTimer = 0;
    this.record = null; this.landTimer = 0; this.lastGrounded = false;
    this.turnLean=0;this.forwardLean=0;
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
    this.ui.status('Loading PIX Pro Animation Rig...',40);
    let gltf;
    try{gltf=await this.engine.resources.model(import.meta.env.BASE_URL + 'models/pix_cinematic_6_4.glb')}
    catch(error){
      console.warn('PIX 6.4 rig unavailable; using detailed 6.3 model',error);
      try{gltf=await this.engine.resources.model(import.meta.env.BASE_URL + 'models/pix_mk2.glb')}
      catch(err){console.warn('PIX detailed GLB unavailable; original fallback',err);gltf=await this.engine.resources.model(import.meta.env.BASE_URL + 'models/pix.glb')}
    }
    this.model = gltf.scene;
    this.model.scale.setScalar(.83);
    this.model.rotation.order='YXZ';
    this.engine.scene.add(this.model);
    this.anim = new AnimationController(this.model, gltf.animations);
    document.documentElement.dataset.pixModel=gltf.parser.json?.asset?.extras?.animationRevision==='6.4.0'?'cinematic':gltf.parser.json?.asset?.extras?.revision==='6.3.0'?'mk2':'classic';
    document.documentElement.dataset.pixAnimationClips=String(gltf.animations.length);
    this.modelEmissive=[];
    this.model.traverse(obj=>{if(!obj.isMesh)return;const materials=Array.isArray(obj.material)?obj.material:[obj.material];for(const mat of materials){if(mat?.emissive && mat.emissive.r+mat.emissive.g+mat.emissive.b>.15)this.modelEmissive.push({mat,baseline:mat.emissiveIntensity??1});}});
    this.effects = new ImpactEffects(this.engine.scene, this.engine.quality);
    this.anim.set('Idle');
    this.ui.status('Generating Green Valley...',86);
    await this.saveManager.init();
    const saved = await this.saveManager.load();
    if(saved && saved.version===6){ this.progress=new MissionManager(saved.mission || {});this.record=saved.bestTime||null; }
    this.level = new GreenValley(this.engine.scene, this.physics, (event,data) => this.onLevelEvent(event,data));
    this.level.initialize(this.progress);
    this.ui.status('Loading guardian and forest models...',94);
    await this.level.upgradeModels(this.engine.resources, import.meta.env.BASE_URL).catch(error => console.warn('Model upgrade fallback',error));
    document.documentElement.dataset.guardianModel=this.level.guardianModel?'mk2':'classic';
    this.respawn(false);
    this.engine.onTick = dt => this.tick(dt);
    this.engine.onFrame = dt => this.frame(dt);
    this.engine.start();this.engine.pause(true);
    this.ready=true;this.ui.status('READY',100);
    this.ui.menu(this.progress.played>0?'Continue PIX’s Pro Animation Adventure':'Welcome to PIX Adventure 6.4' ,{
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
    for(const terminal of this.level.terminals){terminal.active=this.progress.terminals.has(terminal.id);terminal.screen.material=terminal.active?this.level.materials.gold:this.level.materials.crystal;}
  }
  async start(fresh=false) {
    if(!this.ready)return;
    if(fresh) {
      this.progress=new MissionManager();this.health=3;
      for(const crystal of this.level.crystals){crystal.taken=false;crystal.visual.visible=true;}
      for(const terminal of this.level.terminals){terminal.active=false;terminal.screen.material=this.level.materials.crystal;}
      this.level.enemy.stunned=0;this.completedShown=false;this.record=this.record||null;
      await this.saveManager.save({version:6,mission:this.progress.snapshot()});
    }
    if(fresh||!this.elapsed)this.elapsed=0;this.respawn(false);this.running=true;
    this.engine.pause(false);this.ui.hideOverlay();
    this.anim.set('Idle',.1,{force:true});this.bridge.send('started',{stage:1});
    this.ui.toast('Mission: Restore both terminals and collect 6 crystals');
  }
  respawn(hurt=true) {
    const point=this.progress.checkpoint;
    this.physics.setPlayer(point);
    this.vert=0;this.jumpCount=0;this.health=3;this.jumpAssist.reset();this.lastGrounded=false;this.landTimer=0;
    this.invuln=1.8;this.turnLean=0;this.forwardLean=0;
    if(this.model){this.model.rotation.x=0;this.model.rotation.z=0;this.model.scale.setScalar(.83);}
    if(hurt){this.progress.failures++;this.save();this.ui.toast('Back at checkpoint');}
  }
  onLevelEvent(event,data) {
    if(event==='crystal') {
      this.audio.play('gem');const gem=this.level.crystals.find(c=>c.id===data.id);if(gem)this.effects?.spawn(gem.x,gem.y,gem.z,0x86ffed,15,1.3);this.ui.toast('Crystal recovered');this.bridge.send('collect',{stage:1,total:this.progress.crystals.size});
      if(this.progress.crystals.size===this.level.crystals.length)this.bridge.send('secret',{type:'all-crystals'});
      this.save();
    } else if(event==='terminal') {
      this.audio.play('interact');const term=this.level.terminals.find(t=>t.id===data.id);if(term)this.effects?.spawn(term.x,term.y+1,term.z,0xffdf88,22,1.1);this.ui.toast('Signal terminal activated');this.save();
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
    this.jumpAssist.update(dt,this.physics.grounded,input.just.jump);
    if(this.jumpAssist.canGroundJump() || this.jumpAssist.canAirJump(this.jumpCount)){
      const first=this.jumpAssist.canGroundJump();
      this.vert=first?10.1:9.1;this.jumpCount=first?1:2;this.jumpAssist.consume();this.audio.play('jump');
      this.anim?.trigger(first?'Jump':'DoubleJump',{fade:.10,lock:first?.16:.38});
      const pos=this.physics.playerBody.translation();this.effects?.spawn(pos.x,pos.y-.7,pos.z,first?0x90edff:0xffdf9e,10,1.1);
    }
    if(input.just.dash && this.dashCooldown===0){this.dashCooldown=1.65;this.dashUntil=this.elapsed+.23;this.audio.play('dash');
      this.anim?.trigger('Dash',{fade:.09,lock:.25});
      const p=this.physics.playerBody.translation();this.effects?.spawn(p.x,p.y,p.z,0x70dfff,18,1.4);}
    const dashing=this.elapsed<this.dashUntil;
    if(input.just.interact){
      this.anim?.trigger('Interact',{fade:.12,lock:.48});
      if(this.level.interact(this.physics.playerBody.translation(),this.progress)) this.save();
      else this.ui.toast('Get closer to a terminal');
    }
    const speed=dashing?12.2:input.sprint?7.3:5.3;
    const movement=cameraRelativeMovement(input.x,input.z,this.cameraRig.yaw);
    // Gravity is integrated by a fixed 1/90s step, while Rapier resolves wall/ground collisions.
    this.vert=Math.max(-25,this.vert-21*dt);
    this.physics.animatePlatforms(this.elapsed);
    const result=this.physics.move(movement.x*speed*dt,this.vert*dt,movement.z*speed*dt);
    if(result.grounded && this.vert<=0){
      if(!this.lastGrounded && this.vert < -6){this.audio.play('land');this.effects?.spawn(result.x,result.y-.77,result.z,0xe7ffff,9,.48);this.landTimer=.23;this.anim?.trigger('Land',{fade:.10,lock:.23});}
      this.vert=-.2;this.jumpCount=0;
    }
    this.lastGrounded=result.grounded;
    this.landTimer=Math.max(0,this.landTimer-dt);
    if(result.movement.y < 0 && this.vert > 0) this.vert=0;
    const p=result;
    if(p.y < -8 || Math.abs(p.x) > 28){this.respawn(true);return;}
    const events=this.level.update(dt,this.elapsed,p,this.progress,dashing);
    if(events.bounce && this.vert<=0){this.vert=15.5;this.jumpCount=1;this.anim?.trigger('Jump',{fade:.09,lock:.2});this.audio.play('jump');this.effects?.spawn(p.x,p.y-.65,p.z,0xffcf74,13,1.5);this.ui.toast('SPRING PAD!');}
    if(dashing){this.trailTimer+=dt;if(this.trailTimer>.025){this.trailTimer=0;this.effects?.trail(p.x,p.y-.6,p.z);}}
    if(events.danger && this.invuln===0){
      this.health--;this.invuln=1.45;this.anim?.trigger('Stumble',{fade:.08,lock:.30});this.audio.play('hit');this.ui.toast('PIX took damage');
      if(this.health<=0){this.respawn(true);return;}
    }
    if(canReachGoal(this.progress,p.z)) {this.finish();return;}
    this.model.position.set(p.x,p.y-.81,p.z);
    // Subtle landing response, on top of the real GLB animation.
    const squash=1-Math.sin(this.landTimer/.23*Math.PI)*.075;
    this.model.scale.set(.83/squash,.83*squash,.83/squash);
    let turn=0;
    const moving=Math.hypot(input.x,input.z);
    if(moving>.07){
      const desired=Math.atan2(movement.x,-movement.z);
      const current=this.model.rotation.y;
      const diff=Math.atan2(Math.sin(desired-current),Math.cos(desired-current));
      this.model.rotation.y+=diff*(1-Math.exp(-12*dt));
      turn=diff;
    }
    // Inertial leaning is separate from the authored animated rig: the clip
    // animates limbs and chest, while the whole avatar leans into motion.
    const airborne=!(result.grounded && this.vert<=0);
    const lean=pixLean({move:moving,sprint:input.sprint,dashing,airborne,turn});
    this.forwardLean+=(lean.forward-this.forwardLean)*(1-Math.exp(-7*dt));
    this.turnLean+=(lean.bank-this.turnLean)*(1-Math.exp(-9*dt));
    this.model.rotation.x=this.forwardLean;
    this.model.rotation.z=this.turnLean;
    if(this.anim){
      const requested=selectPixLocomotion({grounded:!airborne,verticalSpeed:this.vert,move:moving,sprint:input.sprint,dashing});
      this.anim.set(requested,.19);
      document.documentElement.dataset.pixAnimation=this.anim.currentName;
    }
    if(this.elapsed-this.lastSaveTime>8){this.lastSaveTime=this.elapsed;this.save();}
  }
  frame(dt) {
    const p=this.physics?.playerBody.translation();if(!p)return;
    this.cameraRig.update(p,dt,this.level?.obstacles||[],Boolean(this.lastInput?.sprint));
    this.anim?.tick(dt);
    if(this.modelEmissive){const pulse=1+Math.sin(this.elapsed*3.6)*.10, dashBoost=this.elapsed<this.dashUntil?1.65:1;for(const e of this.modelEmissive)e.mat.emissiveIntensity=e.baseline*pulse*dashBoost;}
    this.effects?.update(dt);
    this.ui.hud(this.progress,this.health,{dash:this.dashCooldown,position:p,level:this.level,record:this.record,elapsed:this.elapsed});
  }
  async save() {
    const state={version:6,mission:this.progress.snapshot(),bestTime:this.record,savedAt:Date.now()};
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
      onQuality:(mode)=>{this.engine.setQuality(mode);localStorage.setItem('ASTATION_QUALITY',mode);this.ui.toast('Graphics: '+mode.toUpperCase());this.pause(true);},
      onClassic:()=>this.classic(),
      onExit:()=>this.exit()
    });}
    else{this.ui.hideOverlay();this.engine.pause(false);}
  }
  async finish(){
    if(this.completedShown)return;
    this.completedShown=true;this.running=false;this.engine.pause(true);
    this.progress.finish();if(!this.record||this.elapsed<this.record)this.record=this.elapsed;await this.save();
    // Stage one completion is not misreported as finishing all five worlds.
    this.bridge.completion();this.audio.play('win');
    this.anim?.trigger('Victory',{fade:.18,lock:1.9});
    this.engine.pause(false); // continue only the victory pose; physics tick sees running=false
    this.ui.complete(this.progress,{record:this.record,onReplay:()=>{this.completedShown=false;this.start(true)},onExit:()=>this.exit(),onClassic:()=>this.classic()});
  }
  async exit(){
    await this.save();this.running=false;this.engine?.pause(true);this.bridge.send('exit',{});
    if(window.parent===window)this.ui.toast('Return to ASTATION OS using the console tab');
  }
  destroy(){window.removeEventListener('keydown',this.onGlobalKey);this.running=false;this.anim?.dispose();this.input?.dispose();this.effects?.dispose();this.audio.dispose();this.level?.dispose();this.physics?.dispose();this.saveManager.close();this.engine?.destroy();}
}
