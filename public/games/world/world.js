// ASTATION WORLD: DREAMBOUND — original playable five-world Three.js platformer.
// Only game data and game mechanics live here. OS communicates via postMessage.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {solvePlatformCollision,carryPlatform,platformSurface,footprintOverlaps} from './collision.js';
const $=s=>document.querySelector(s), clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), PI=Math.PI;
const worldNames=['GREEN VALLEY','CANDY GALAXY','FROZEN KINGDOM','MECHANICAL FACTORY','SKY ISLANDS'];
const worlds=[
  {sky:'#76c4f9',fog:'#b9ebff',ground:'#4bb47e',top:'#82eb99',accent:'#ffe58d',decor:'#43ae78'},
  {sky:'#5a3198',fog:'#9974d6',ground:'#d47cdb',top:'#ffc5e7',accent:'#9afff7',decor:'#fb85bf'},
  {sky:'#6bb1c8',fog:'#cceafc',ground:'#6fbed4',top:'#e6faff',accent:'#ffeaa1',decor:'#85d5f4'},
  {sky:'#464763',fog:'#777990',ground:'#616b86',top:'#d0a66e',accent:'#7efbdb',decor:'#bf8776'},
  {sky:'#76bce1',fog:'#c8eeff',ground:'#77aabd',top:'#e1f5ff',accent:'#ffdb7b',decor:'#d2e9f8'}
];
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(68,1,.1,280);
const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
$('#render').appendChild(renderer.domElement);
const hemi=new THREE.HemisphereLight(0xc8f1ff,0x52638d,2.1);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff7d6,2.0);sun.position.set(-12,27,10);sun.castShadow=true;sun.shadow.mapSize.set(512,512);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;sun.shadow.bias=-.0005;scene.add(sun);
const root=new THREE.Group();scene.add(root);let geometryCache={};
function mat(hex,opts={}){return new THREE.MeshStandardMaterial({color:hex,roughness:.72,metalness:.12,...opts})}
const white=mat('#fffafa'),ink=mat('#24365e'),glow=mat('#66edff',{emissive:'#1d8ab8',emissiveIntensity:.6}),glass=mat('#4bc7ea',{metalness:.4,roughness:.13}),rim=mat('#a0f5ff'),dark=mat('#314767');
function mesh(g,m,parent=root){let o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function box(w,h,d,m,x=0,y=0,z=0,parent=root){let o=mesh(new THREE.BoxGeometry(w,h,d),m,parent);o.position.set(x,y,z);return o}
function sphere(r,m,x=0,y=0,z=0,parent=root,detail=13){let o=mesh(new THREE.SphereGeometry(r,detail,10),m,parent);o.position.set(x,y,z);return o}
function cylinder(rt,rb,h,m,x=0,y=0,z=0,parent=root){let o=mesh(new THREE.CylinderGeometry(rt,rb,h,10),m,parent);o.position.set(x,y,z);return o}
const player=new THREE.Group();scene.add(player);
const torso=box(.78,.95,.57,white,0,1.25,0,player);
const chest=box(.55,.35,.08,glow,0,1.39,-.31,player),pelvis=sphere(.38,dark,0,.82,0,player),head=new THREE.Group();head.position.y=2.08;player.add(head);
box(1.12,.78,.84,white,0,0,0,head);box(.85,.37,.09,ink,0,-.04,-.47,head);sphere(.105,glow,-.23,.01,-.55,head);sphere(.105,glow,.23,.01,-.55,head);cylinder(.08,.08,.3,white,0,.55,0,head);sphere(.16,glow,0,.73,0,head);
// Production asset: original GLB with authored Idle/Walk/Jump animation channels.
// The procedural PIX remains available if GLB loading fails (offline or network error).
let pixMixer=null,pixModel=null,pixClips={},pixCurrent='',assetLoaded=false;
const pixLoader=new GLTFLoader();
function usePixAnimation(kind){if(!pixMixer||!pixClips[kind]||pixCurrent===kind)return;
  if(pixClips[pixCurrent])pixClips[pixCurrent].fadeOut(.19);
  pixClips[kind].reset().fadeIn(.19).play();pixCurrent=kind;
}
pixLoader.load('./assets/pix.glb',gltf=>{
  pixModel=gltf.scene;pixModel.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  player.add(pixModel);
  for(const piece of [torso,chest,pelvis,head,...arms,...legs])piece.visible=false;
  pixMixer=new THREE.AnimationMixer(pixModel);
  for(const clip of gltf.animations)pixClips[clip.name]=pixMixer.clipAction(clip);
  usePixAnimation('Idle');assetLoaded=true;
  $('#model-indicator').textContent='PIX · MODEL GLB';
},undefined,err=>{console.warn('PIX asset not loaded; original animated robot is retained',err);$('#model-indicator').textContent='PIX · FALLBACK 3D'});
const arms=[],legs=[];for(let side of [-1,1]){let arm=new THREE.Group();arm.position.set(side*.55,1.6,0);player.add(arm);sphere(.22,white,0,-.02,0,arm);cylinder(.145,.15,.67,white,0,-.41,0,arm);sphere(.18,glass,0,-.76,-.03,arm);arms.push(arm);let leg=new THREE.Group();leg.position.set(side*.27,.79,0);player.add(leg);cylinder(.19,.17,.65,dark,0,-.28,0,leg);box(.35,.22,.52,white,0,-.68,-.12,leg);legs.push(leg)}
let stage=0,progress={stage:0,cores:0,checkpoints:[],collected:{},switches:{},secrets:0,failures:0,playTime:0,completions:0},running=false,paused=true,won=false;
let pos={x:0,y:2.0,z:4.2},velY=0,grounded=false,jumps=0,supportPlatform=null,health=3,checkpoint={x:0,y:2,z:3.5},time=0,dashTime=0,dashCool=0,invuln=0,walkPhase=0,landPulse=0;
let platforms=[],gems=[],enemies=[],switches=[],scenery=[],gate=null,boss=null,secret=null,particles=[];
let keys={},lastKeys={},touchVec={x:0,z:0},padAxes={x:0,z:0},lastGamepad={};let cameraOrbit=0,dragLook=false,prevPointerX=0;
const storageKey='ASTATION_WORLD_DREAMBOUND_v4';
const post=(event,data={})=>parent.postMessage({source:'astation-world-v4',event,...data},location.origin);
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(progress))}catch{}post('save',{save:progress})}
try{const old=JSON.parse(localStorage.getItem(storageKey)||'{}');if(old&&typeof old==='object')progress={...progress,...old}}catch{}
// Entirely original synthesized SFX. Plays only after user input.
let soundEngine=null;
function sfx(kind){try{const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;if(!soundEngine)soundEngine=new AudioCtx();if(soundEngine.state==='suspended')soundEngine.resume();let frequencies={jump:[610,850,.16],dash:[300,620,.15],gem:[1020,1370,.21],checkpoint:[540,990,.32],hurt:[300,140,.23],switch:[650,1040,.3],portal:[460,1220,.46],enemy:[390,240,.17]};const [f0,f1,d]=frequencies[kind]||[440,620,.15];const t=soundEngine.currentTime;const osc=soundEngine.createOscillator(),gain=soundEngine.createGain();osc.type=kind==='hurt'?'sawtooth':'sine';osc.frequency.setValueAtTime(f0,t);osc.frequency.exponentialRampToValueAtTime(f1,t+d);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.055,t+.02);gain.gain.exponentialRampToValueAtTime(.0001,t+d);osc.connect(gain).connect(soundEngine.destination);osc.start(t);osc.stop(t+d+.02)}catch{}}
function note(s){let el=document.createElement('div');el.textContent=s;$('#toast').append(el);setTimeout(()=>el.remove(),2300)}
function writeHud(){let w=worlds[stage];$('#world').textContent=worldNames[stage];$('#life').textContent='HP '+health+'/3';$('#gems').textContent='◆ '+currentGems()+'/6';$('#stage').textContent=(stage+1)+' / 5';let on=activatedSwitches();$('#objective-progress').style.width=Math.round(((currentGems()/6)*.6+(on/2)*.4)*100)+'%';$('#mission').textContent=won?'PIX — DREAMBOUND COMPLETE':on<2?'Aktywuj dwa terminale · '+on+'/2':currentGems()<6?'Zbierz 6 kryształów':'DOTRZYJ DO PORTALU'}
function currentGems(){return gems.filter(g=>g.taken).length}
function activatedSwitches(){return switches.filter(s=>s.active).length}
function variantWorld(){const w=worlds[stage];scene.background=new THREE.Color(w.sky);scene.fog=new THREE.Fog(w.fog,27,130);hemi.color.set(w.top);sun.color.set('#fff2df');}
function clearWorld(){const usedGeos=new Set(),usedMats=new Set(),shared=new Set([white,ink,glow,glass,rim,dark,waterMaterial]);for(const child of [...root.children]){root.remove(child);child.traverse(o=>{if(!o.isMesh)return;if(o.geometry&&!usedGeos.has(o.geometry)){usedGeos.add(o.geometry);o.geometry.dispose()}for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m&&!shared.has(m)&&!usedMats.has(m)){usedMats.add(m);m.dispose()}})}platforms=[];gems=[];enemies=[];switches=[];scenery=[];particles=[];waterfallMeshes=[];checkpointBeacon=null;gate=null;boss=null;secret=null}
function addIsland(x,y,z,w,d,moving=false){const wcolor=worlds[stage];let group=new THREE.Group();root.add(group);group.position.set(x,y,z);let underside=box(w,1.1,d,mat(wcolor.ground),0,-.59,0,group);let top=box(w,.24,d,mat(wcolor.top),0,.03,0,group);let plate=box(w-.45,.06,d-.45,mat('#ffffff',{transparent:true,opacity:.14}),0,.17,0,group);platforms.push({x,y,z,w,d,moving,group,phase:Math.random()*6,speed:.9+Math.random()*.25});return group}
function addTree(x,y,z){let g=new THREE.Group();root.add(g);g.position.set(x,y,z);cylinder(.16,.22,2.8,mat(stage===1?'#bd81f5':'#876648'),0,1.4,0,g);for(let j=0;j<3;j++)sphere(1.0-j*.14,mat(worlds[stage].decor),0,3.1+j*.6,0,g);scenery.push(g)}
function addDecor(x,y,z){let g=new THREE.Group();root.add(g);g.position.set(x,y,z);if(stage===0){addTree(x,y,z);root.remove(g)}if(stage===1){cylinder(.5,.8,1.7,mat('#ffbadc'),0,.83,0,g);sphere(.85,mat('#ff87af'),0,1.8,0,g);sphere(.4,mat('#a1fafa'),.1,2.35,0,g)}if(stage===2){let o=mesh(new THREE.ConeGeometry(.7,3,5),mat('#dcf7ff'),g);o.position.y=1.45;let o2=mesh(new THREE.ConeGeometry(.45,1.9,5),glass,g);o2.position.set(-.65,.95,.3)}if(stage===3){let o=mesh(new THREE.TorusGeometry(.8,.21,8,12),mat('#bba182',{metalness:.8}),g);o.rotation.x=PI/2;o.position.y=1.1;box(.2,2,.2,mat('#5b6678'),0,1,0,g)}if(stage===4){sphere(1.5,mat('#e3f7ff'),0,1.4,0,g);sphere(1.25,white,1,1.6,0,g)}if(stage!==0)scenery.push(g)}
// Dreambound scenery 5.0: sculpted islands, luminous waterfall and swaying vegetation.
const waterMaterial=mat('#4ccfff',{metalness:.22,roughness:.12,transparent:true,opacity:.78,emissive:'#0c506a',emissiveIntensity:.17});
let waterfallMeshes=[],checkpointBeacon=null;
function scenicGreenValley(){if(stage!==0)return;
  const rock=mat('#617f86',{roughness:.89}),rockLight=mat('#8db6aa',{roughness:.85}),grass=mat('#38bd7c',{roughness:.98}),flower=mat('#f9ef9d',{emissive:'#635d17',emissiveIntensity:.18});
  for(let i=0;i<11;i++){
    const z=-i*10-2,ix=Math.sin(i*1.1)*2.4;
    const p=mesh(new THREE.DodecahedronGeometry(2.15+(i%3)*.26,0),i%2?rockLight:rock);
    p.position.set(ix+(i%2?5.3:-5.5),-1.9,z);p.rotation.z=i*.37;p.scale.set(1.35,1.1,1.3);
    for(let j=0;j<3;j++){let x=ix+(i%2?5.3:-5.5)+(j-1)*.85;
      sphere(.27+j*.04,grass,x,.4,z+.2+j*.35);sphere(.065,flower,x,.67,z+.2+j*.35)}
  }
  // A lit, animated waterfall near the first floating bridge.
  for(let n=0;n<9;n++){
    let m=mesh(new THREE.CylinderGeometry(.04,.15,3.4,6),waterMaterial);
    m.position.set(-5.3+n*.13,-1.9,-21.8);m.rotation.z=.06*n;
    waterfallMeshes.push({m,phase:n*.5});
  }
  const flag=mat('#e7f9fb',{emissive:'#0b839b',emissiveIntensity:.12});
  for(let n=0;n<4;n++){
    const z=-20-n*26;
    cylinder(.075,.075,3.7,mat('#719cb8'),4,1.9,z);
    const ribbon=box(1.15,.58,.1,flag,4.66,3.08,z);
    ribbon.rotation.y=.2;
  }
  checkpointBeacon=new THREE.Group();root.add(checkpointBeacon);checkpointBeacon.position.set(0,.8,-53);
  let base=mesh(new THREE.CylinderGeometry(.75,.91,.32,18),mat('#426d89'),checkpointBeacon);base.position.y=.10;
  let pylon=mesh(new THREE.OctahedronGeometry(.65,0),mat('#95efff',{emissive:'#257e9d',emissiveIntensity:.85}),checkpointBeacon);pylon.position.y=1.45;
  let halo=mesh(new THREE.TorusGeometry(1.04,.07,8,28),mat('#d7feff',{emissive:'#76dfff',emissiveIntensity:.74}),checkpointBeacon);halo.position.y=1.40;halo.rotation.x=Math.PI/2;
}
function gemAt(x,y,z,index){let g=new THREE.Group();root.add(g);g.position.set(x,y,z);let diamond=mesh(new THREE.OctahedronGeometry(.48),mat(worlds[stage].accent,{emissive:worlds[stage].accent,emissiveIntensity:.35,metalness:.3}),g);const taken=!!progress.collected[stage+'-'+index];g.visible=!taken;gems.push({g,x,y,z,taken,index})}
function switchAt(x,y,z,index){let g=new THREE.Group();root.add(g);g.position.set(x,y,z);box(.7,1.35,.7,mat('#233a5e'),0,.66,0,g);let lamp=sphere(.32,mat('#f6b56d',{emissive:'#7b2d05',emissiveIntensity:.7}),0,1.42,0,g);let active=!!progress.switches[stage+'-'+index];if(active){lamp.material=mat('#66f6cb',{emissive:'#42e3b2',emissiveIntensity:.8})}switches.push({g,x,y,z,index,active,lamp})}
function addEnemy(x,y,z,index){let g=new THREE.Group();root.add(g);g.position.set(x,y,z);sphere(.56,mat(stage===2?'#c7a5ff':'#e46b91',{metalness:.5}),0,.9,0,g);sphere(.22,ink,-.2,.93,-.49,g);sphere(.22,ink,.2,.93,-.49,g);sphere(.10,glow,-.2,.93,-.64,g);sphere(.10,glow,.2,.93,-.64,g);let wing=mesh(new THREE.TorusGeometry(.83,.10,6,24),mat('#ffffff',{emissive:'#628bef',emissiveIntensity:.45}),g);wing.position.y=.8;wing.rotation.x=PI/2;enemies.push({g,x,y,z,index,phase:index*1.8,wing,stunned:0})}
function createWorld(index){stage=clamp(index,0,4);supportPlatform=null;variantWorld();clearWorld();let s=worlds[stage];addIsland(0,0,3,10,16);
// Seventeen floating terrain sections with increasingly intricate geometry, bridges and moving spans.
for(let i=0;i<17;i++){let z=-i*6-10, x=Math.sin(i*1.1+stage*.7)*2.3;let w=6.8+(i%3)*.35,d=5.5;let y=(i%4===2?.75:0);let moving=i%6===4;addIsland(x,y,z,w,d,moving);if(i%2===0&&i<15)gemAt(x,y+1.45,z-.7,i);if(i%3===1)addDecor(x+(i%2?5:-5),y+.2,z);if(i%4===3)addEnemy(x,y,z-.5,i)}
// These solid islands make checkpoints and the final portal reachable even if
// a legacy save resumes very near a gap between two floating sections.
addIsland(0,0,-54,7.4,7.4,false);
addIsland(0,0,-112,8.5,17,false);
scenicGreenValley();
// extra crystals, two visible objective switches and a bonus hidden crystal.
gemAt(0,1.5,-24,30);gemAt(-1,1.5,-58,31);gemAt(1.3,1.5,-83,32);switchAt(-1,0,-38,0);switchAt(2,0,-80,1);
if(stage===1 && !(progress.secrets||0)){addIsland(6.1,0,-46,3.1,4.2);secret=sphere(.64,mat('#fff3a1',{emissive:'#ffb83b',emissiveIntensity:.7}),6.1,1.4,-46);}
gate=new THREE.Group();root.add(gate);gate.position.set(0,.7,-111);let ring=mesh(new THREE.TorusGeometry(2.4,.33,13,37),mat('#d4eaff',{emissive:'#3d8dff',emissiveIntensity:.8}),gate);ring.rotation.y=Math.PI/2;let field=mesh(new THREE.CircleGeometry(2.05,32),mat('#6edcff',{transparent:true,opacity:.36,emissive:'#42cfff',emissiveIntensity:.4,side:THREE.DoubleSide}),gate);field.rotation.y=Math.PI/2;
if(stage===4){let g=new THREE.Group();root.add(g);g.position.set(0,1,-97);sphere(1.45,mat('#b84b92',{emissive:'#6a2d6a',emissiveIntensity:.5}),0,.5,0,g);sphere(.25,glow,-.48,.6,-1.2,g);sphere(.25,glow,.48,.6,-1.2,g);boss={g,hp:3,cool:0,active:true}}
const ck=progress.checkpoints[stage];checkpoint=ck?{...ck}:{x:0,y:2,z:3.5};pos={...checkpoint};velY=0;health=3;invuln=0;grounded=false;supportPlatform=null;jumps=0;writeHud();post('status',{stage:stage+1,progress:Math.round(stage/5*100),cores:progress.cores})}
function inputState(){let vx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+touchVec.x+padAxes.x;let vz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+touchVec.z+padAxes.z;return{x:clamp(vx,-1,1),z:clamp(vz,-1,1)}}
function down(...ks){return ks.some(k=>!!keys[k])}function just(k){return !!keys[k]&&!lastKeys[k]}
function respawn(){progress.failures++;health=3;pos={...checkpoint};velY=0;grounded=false;supportPlatform=null;invuln=1.6;note('PIX: powrót do checkpointu');persist()}
function hurt(){if(invuln>0)return;health--;invuln=1.4;landPulse=.6;note('Uszkodzenie! '+health+'/3 HP');sfx('hurt');if(health<=0)respawn()}
function interact(){for(let sw of switches)if(!sw.active&&Math.hypot(sw.x-pos.x,sw.z-pos.z)<3.2){sw.active=true;progress.switches[stage+'-'+sw.index]=true;sw.lamp.material=mat('#66f6cb',{emissive:'#42e3b2',emissiveIntensity:.8});note('Terminal '+(sw.index+1)+'/2 aktywowany');sfx('switch');persist();writeHud();return}}
function completeWorld(){if(stage===4){running=false;paused=true;won=true;progress.completions++;progress.stage=5;persist();post('win',{stage:5});showMenu('DREAMBOUND COMPLETE','PIX odzyskał wszystkie rdzenie energii. Światy znów są bezpieczne!',true);sfx('portal');return}progress.stage=Math.max(progress.stage,stage+1);progress.cores+=1;persist();post('worldComplete',{stage:stage+1,cores:progress.cores});sfx('portal');note('ŚWIAT UKOŃCZONY');createWorld(stage+1)}
function fx(x,y,z,color){for(let i=0;i<7;i++){let m=sphere(.1,mat(color,{emissive:color,emissiveIntensity:.4}),x,y,z);particles.push({m,ttl:.7,vx:(Math.random()-.5)*4,vy:Math.random()*5,vz:(Math.random()-.5)*4})}}
function step(dt){if(!running||paused)return;time+=dt;progress.playTime+=dt;let ax=inputState();let speed=down('ShiftLeft','ShiftRight')?8.4:5.7;if(dashTime>0){dashTime-=dt;speed=20;}dashCool=Math.max(0,dashCool-dt);invuln=Math.max(0,invuln-dt);landPulse=Math.max(0,landPulse-dt);
if(just('Space')||just('touchJump')||just('padJump')){if(jumps<2){velY=jumps?8.0:9.7;jumps++;grounded=false;supportPlatform=null;fx(pos.x,pos.y-.7,pos.z,'#b2f5ff');sfx('jump')}}
if((just('KeyQ')||just('touchDash')||just('padDash'))&&dashCool<=0){dashTime=.24;dashCool=1.7;fx(pos.x,pos.y,pos.z,'#80e6ff');sfx('dash')}
if(just('KeyE')||just('touchInteract')||just('padInteract'))interact();
// Update moving-platform transforms BEFORE calculating collision, and carry PIX with
// its supporting platform. This removes the one-frame lag that caused clipping.
for(const p of platforms)if(p.moving){let nx=p.x+Math.sin(time*p.speed+p.phase)*1.3;let delta=nx-p.group.position.x;p.group.position.x=nx;if(grounded&&supportPlatform===p)carryPlatform(pos,p,delta)}
let previous={...pos};let len=Math.hypot(ax.x,ax.z)||1,mx=ax.x/len*speed*dt,mz=ax.z/len*speed*dt;
pos.x=clamp(pos.x+mx,-7,7);pos.z=clamp(pos.z+mz,-118,7);
velY-=20*dt;pos.y+=velY*dt;
let solved=solvePlatformCollision({pos,prev:previous,velY,platforms,wasGrounded:grounded,support:supportPlatform});
if(solved.grounded){if(!grounded)landPulse=.3;jumps=0}
velY=solved.velY;grounded=solved.grounded;supportPlatform=solved.support;
if(pos.y< -9)respawn();
if(secret){secret.rotation.y+=dt*2;secret.position.y=1.4+Math.sin(time*2)*.25;if(Math.hypot(pos.x-6.1,pos.z+46)<1.2&&Math.abs(pos.y-1.4)<2){root.remove(secret);secret.geometry.dispose();secret=null;progress.secrets=(progress.secrets||0)+1;persist();post('secret',{});note('SEKRET ODKRYTY!')}}
for(const g of gems){if(g.taken)continue;if(Math.hypot(pos.x-g.x,pos.z-g.z)<1.25&&Math.abs(pos.y-g.y)<2.2){g.taken=true;g.g.visible=false;progress.collected[stage+'-'+g.index]=true;note('Kryształ znaleziony!');sfx('gem');fx(g.x,g.y,g.z,worlds[stage].accent);persist();post('collect',{stage:stage+1,total:currentGems()})}}
for(const e of enemies){if(e.stunned>0)e.stunned-=dt;e.phase+=dt;e.g.position.x=e.x+Math.sin(e.phase*1.9)*1.8;e.g.position.y=e.y+Math.sin(e.phase*2.4)*.18;let d=Math.hypot(pos.x-e.g.position.x,pos.z-e.z);if(d<1.25&&Math.abs(pos.y-(e.y+1))<2.2){if(dashTime>0){e.stunned=3;e.g.visible=false;post('enemyDodge',{})}else if(e.stunned<=0)hurt()}if(e.stunned>0)e.g.visible=false;else e.g.visible=true;e.wing.rotation.z+=dt*.8}
if(boss&&boss.active){boss.cool=Math.max(0,boss.cool-dt);boss.g.position.x=Math.sin(time*1.7)*1.8;if(Math.hypot(pos.x-boss.g.position.x,pos.z-boss.g.position.z)<2.3){if(dashTime>0&&boss.cool===0){boss.hp--;boss.cool=1.5;fx(boss.g.position.x,2,boss.g.position.z,'#f8b8ff');note('Strażnik: '+boss.hp+'/3');if(boss.hp<=0){boss.active=false;boss.g.visible=false;sfx('portal');post('bossDefeated',{})}}else hurt()}}
if(pos.z<-52&&checkpoint.z>-52){checkpoint={x:pos.x,y:2.1,z:-54};progress.checkpoints[stage]=checkpoint;persist();note('Checkpoint zapisany');sfx('checkpoint')}
if(pos.z<-107&&currentGems()>=6&&activatedSwitches()===2&&(!boss||!boss.active))completeWorld();
player.position.set(pos.x,pos.y-.95,pos.z);let dir=Math.atan2(ax.x,ax.z);if(Math.abs(ax.x)+Math.abs(ax.z)>.05)player.rotation.y=THREE.MathUtils.lerp(player.rotation.y,dir+Math.PI,Math.min(1,dt*9));walkPhase+=dt*speed*(Math.hypot(ax.x,ax.z)>.1?1:0);let swing=Math.sin(walkPhase*1.9)*(Math.hypot(ax.x,ax.z)>.1?.48:.035);arms[0].rotation.x=swing;arms[1].rotation.x=-swing;legs[0].rotation.x=-swing*.7;legs[1].rotation.x=swing*.7;head.rotation.z=Math.sin(time*1.7)*.045;torso.scale.y=1+Math.sin(time*2)*.008;if(pixModel){usePixAnimation(!grounded?'Jump':Math.abs(ax.x)+Math.abs(ax.z)>.10?'Walk':'Idle');pixModel.rotation.z=dashTime>0?-.12:0}player.scale.setScalar(invuln>0?.97:1);
for(const w of waterfallMeshes)w.m.scale.y=1+Math.sin(time*3+w.phase)*.04;if(checkpointBeacon){checkpointBeacon.rotation.y+=dt*.35;checkpointBeacon.position.y=.8+Math.sin(time*1.8)*.12;}
for(const g of gems)if(!g.taken){g.g.rotation.y+=dt*1.5;g.g.position.y=g.y+Math.sin(time*2+g.index)*.18}
for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.ttl-=dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;if(p.ttl<=0){root.remove(p.m);p.m.geometry.dispose();particles.splice(i,1)}}
cam.position.lerp(new THREE.Vector3(pos.x+5.2*Math.cos(cameraOrbit)+10.5*Math.sin(cameraOrbit),pos.y+5.9,pos.z+10.5*Math.cos(cameraOrbit)-5.2*Math.sin(cameraOrbit)),Math.min(1,dt*3.8));cam.lookAt(pos.x,pos.y+.8,pos.z-5);if(Math.floor(time*3)!==Math.floor((time-dt)*3))writeHud();if(Math.floor(progress.playTime/12)!==Math.floor((progress.playTime-dt)/12))persist();if(Math.floor(progress.playTime/3)!==Math.floor((progress.playTime-dt)/3))post('status',{stage:stage+1,progress:Math.min(99,Math.round((stage/5+(-pos.z)/115/5)*100)),cores:progress.cores,played:progress.playTime});lastKeys={...keys}}
function draw(now){requestAnimationFrame(draw);let dt=Math.min(.033,(now-(draw.last||now))/1000);draw.last=now;if(running&&!paused){step(dt);if(pixMixer)pixMixer.update(dt)}renderer.render(scene,cam)}
function resize(){let w=innerWidth,h=innerHeight,mode=localStorage.getItem('ASTATION_QUALITY')||'balanced';renderer.setPixelRatio(Math.min(devicePixelRatio,mode==='quality'?1.65:mode==='performance'?.85:1.2));renderer.shadowMap.enabled=mode!=='performance';renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
addEventListener('resize',resize);
function showMenu(title,description,complete=false){let overlay=$('#overlay');overlay.classList.remove('hidden');let markup=`<div class="menu"><div class="tag">PIX · ASTATION WORLD</div><h2>${title}</h2><p>${description}</p><div class="actions"><button data-menu="${complete?'restart':'resume'}">${complete?'Nowa gra':'Wznów'}</button><button data-menu="exit" class="alt">ASTATION OS</button></div></div>`;overlay.innerHTML=markup}
function begin(fresh=false){sfx('switch');if(fresh){progress={stage:0,cores:0,checkpoints:[],collected:{},switches:{},secrets:0,failures:0,playTime:0,completions:0};won=false;persist()}createWorld(progress.stage<5?progress.stage:0);running=true;paused=false;$('#overlay').classList.add('hidden');post('started',{stage:stage+1});}
function pause(value){if(!running)return;paused=value===undefined?!paused:value;if(paused)showMenu('PAUZA','Postęp zapisuje się automatycznie. Możesz wrócić do konsoli i kontynuować później.');else $('#overlay').classList.add('hidden');persist()}
function exit(){pause(true);post('exit',{})}
$('#overlay').addEventListener('click',e=>{let action=e.target.closest('[data-menu]')?.dataset.menu;if(!action)return;if(action==='start'||action==='restart')begin(true);else if(action==='continue')begin(false);else if(action==='resume')pause(false);else if(action==='exit')exit()});
addEventListener('keydown',e=>{if(e.repeat&&['Space','KeyE','KeyQ'].includes(e.code))return;keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'){pause()} });addEventListener('keyup',e=>{keys[e.code]=false});
addEventListener('blur',()=>{if(running&&!paused)pause(true)});
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.source!=='astation-os4')return;let d=e.data;switch(d.event){case 'start':begin(!!d.newGame);break;case 'pause':pause(true);break;case 'resume':pause(false);break;case 'exit':exit();break;case 'capture':try{post('capture',{data:renderer.domElement.toDataURL('image/webp',.85)})}catch{}break;case 'quality':localStorage.setItem('ASTATION_QUALITY',d.mode);resize();break;case 'inputs':keys={...keys,...d.keys};break;case 'restore':if(d.data){progress={...progress,...d.data};if(!running)createWorld(clamp(progress.stage,0,4));persist()}break;}});
const gameCanvas=renderer.domElement;gameCanvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.clientX<innerWidth*.44)return;dragLook=true;prevPointerX=e.clientX;gameCanvas.setPointerCapture(e.pointerId)});gameCanvas.addEventListener('pointermove',e=>{if(!dragLook)return;cameraOrbit=clamp(cameraOrbit+(e.clientX-prevPointerX)*.002,-.82,.82);prevPointerX=e.clientX});for(const ev of ['pointerup','pointercancel'])gameCanvas.addEventListener(ev,()=>dragLook=false);
const stick=$('#stick'),nub=$('#nub');let pointerId=null;
function stickUpdate(ev){let r=stick.getBoundingClientRect(),dx=ev.clientX-(r.left+r.width/2),dy=ev.clientY-(r.top+r.height/2),l=Math.max(1,Math.hypot(dx,dy)),m=Math.min(1,l/(r.width*.42));touchVec.x=dx/l*m;touchVec.z=dy/l*m;nub.style.transform=`translate(${touchVec.x*r.width*.35}px,${touchVec.z*r.width*.35}px)`}
stick.addEventListener('pointerdown',e=>{pointerId=e.pointerId;stick.setPointerCapture(pointerId);stickUpdate(e)});stick.addEventListener('pointermove',e=>{if(pointerId===e.pointerId)stickUpdate(e)});function stickEnd(){pointerId=null;touchVec={x:0,z:0};nub.style.transform=''}stick.addEventListener('pointerup',stickEnd);stick.addEventListener('pointercancel',stickEnd);
document.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();let code=k==='jump'?'touchJump':k==='dash'?'touchDash':k==='interact'?'touchInteract':'touchPause';keys[code]=true;b.setPointerCapture(e.pointerId);if(k==='pause')pause()});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{keys[k==='jump'?'touchJump':k==='dash'?'touchDash':k==='interact'?'touchInteract':'touchPause']=false})});
function pollPad(){let gp=Array.from(navigator.getGamepads?.()||[]).find(Boolean);if(!gp)return;padAxes.x=Math.abs(gp.axes[0]||0)>.15?gp.axes[0]:0;padAxes.z=Math.abs(gp.axes[1]||0)>.15?gp.axes[1]:0;cameraOrbit=clamp(cameraOrbit+(Math.abs(gp.axes[2]||0)>.18?gp.axes[2]*.02:0),-.82,.82);keys.padJump=!!gp.buttons[0]?.pressed;keys.padDash=!!gp.buttons[1]?.pressed;keys.padInteract=!!gp.buttons[2]?.pressed;if(gp.buttons[9]?.pressed&&!lastGamepad.start)pause();lastGamepad.start=!!gp.buttons[9]?.pressed}
function inputLoop(){requestAnimationFrame(inputLoop);pollPad()}requestAnimationFrame(inputLoop);
try{resize();createWorld(clamp(progress.stage,0,4));requestAnimationFrame(draw);post('ready',{stage:stage+1});}catch(e){$('#error').style.display='grid';post('error',{message:String(e)});console.error(e)}
