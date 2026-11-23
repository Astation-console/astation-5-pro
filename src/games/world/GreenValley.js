import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { beamHazard, orbHazard, gateHazard, canSpotPlayer } from './HazardLogic.js';

const mat = (hex, extra = {}) => new THREE.MeshStandardMaterial({color:hex, roughness:.82, metalness:0, ...extra});
const sq = n => n*n;
const makeRand = (seed=5031) => () => {seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
export const ISLANDS = Object.freeze([
  {x:0,z:0,w:12,d:16,y:1.2},
  {x:-.65,z:-15.5,w:10.6,d:11.5,y:1.4},
  {x:.9,z:-29.7,w:11.1,d:11.7,y:1.65},
  {x:-.8,z:-44.3,w:11.3,d:12,y:1.55},
  {x:.65,z:-59.3,w:11.5,d:12,y:1.7},
  {x:-.5,z:-74.2,w:11.7,d:12.2,y:1.75},
  {x:0,z:-90.3,w:12.6,d:19,y:1.8},
]);
const CRYSTALS = Object.freeze([
 {id:'a',x:-2,z:3},{id:'b',x:2,z:-4},{id:'c',x:-2,z:-17},
 {id:'d',x:2,z:-27},{id:'e',x:-1,z:-33},{id:'f',x:2,z:-43},
 {id:'g',x:-2,z:-58},{id:'h',x:2,z:-63},{id:'i',x:-1,z:-72},{id:'j',x:2,z:-88}
]);
export function canReachGoal(mission, playerZ) { return playerZ < -96 && mission.canComplete(); }

export class GreenValley {
  constructor(scene, physics, onEvent = () => {}) {
    this.scene = scene; this.physics = physics; this.onEvent = onEvent;
    this.group = new THREE.Group(); scene.add(this.group);
    this.obstacles = [];
    this.crystals = []; this.terminals = [];
    this.scenery = []; this.enemy = null;
    this.moving = []; this.hazards = []; this.time = 0;this.springPads=[];this.clouds=[];this.lastSpring=-100;this.spotlight=null;
    this.materials = {
      grass:mat('#69bf85'), meadow:mat('#90d2a0'), lavender:mat('#86b9a9'), bluegrass:mat('#61b9a4'), rim:mat('#aaf0b3'), rock:mat('#657e86'), side:mat('#5b7c78'),
      water:mat('#2b94bb',{metalness:.23,roughness:.15,transparent:true,opacity:.86}),
      bark:mat('#87684e'), canopy:mat('#2d8d78'), lilac:mat('#9ba8ec'),
      crystal:mat('#9efff2',{emissive:'#49bde6',emissiveIntensity:1.3,metalness:.3,roughness:.15}),
      enemy:mat('#8e75c3',{emissive:'#494394',emissiveIntensity:.25}),
      gold:mat('#ffe8a6',{emissive:'#e3a64b',emissiveIntensity:.5}),
      hazard:mat('#eb8290',{emissive:'#a52c53',emissiveIntensity:.5}),
      spring:mat('#ffcc7b',{emissive:'#ff922e',emissiveIntensity:1.2,metalness:.35,roughness:.3}),
      ruin:mat('#d5e2dc',{metalness:.04,roughness:.9}),
      glass:mat('#8ff4ef',{transparent:true,opacity:.43,emissive:'#59daed',emissiveIntensity:.7})
    };
    this.initialized = false;
  }
  mesh(geometry, material, parent=this.group) {
    const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  initialize(mission) {
    if(this.initialized)return;this.initialized=true;
    const scene=this.scene;scene.background=new THREE.Color('#70bfe4');scene.fog=new THREE.FogExp2('#b9e6e8',.012);
    const hemi=new THREE.HemisphereLight('#c5f6ff','#527379',2.4);this.group.add(hemi);
    const sun=new THREE.DirectionalLight('#fff3d1',2.3);sun.position.set(-18,36,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-105;sun.shadow.camera.far=220;sun.shadow.bias=-.001;this.group.add(sun);
    const water=this.mesh(new THREE.PlaneGeometry(310,310),this.materials.water);water.rotation.x=-Math.PI/2;water.position.y=-10;water.receiveShadow=false;this.water=water;
    // Rendered rounded floating islands have their own real Rapier colliders.
    for(const [i,p] of ISLANDS.entries()){
      const rock=this.mesh(new RoundedBoxGeometry(p.w,.95,p.d,4,.62),this.materials.rock);rock.position.set(p.x,p.y-.59,p.z);
      const top=this.mesh(new RoundedBoxGeometry(p.w,.38,p.d,4,.35),[this.materials.grass,this.materials.meadow,this.materials.bluegrass,this.materials.rim,this.materials.lavender,this.materials.meadow,this.materials.bluegrass][i]);top.position.set(p.x,p.y,p.z);
      this.physics.staticCollider({x:p.x,y:p.y-.03,z:p.z,w:p.w-.10,h:.45,d:p.d-.10});
      this.obstacles.push(top,rock);
      if(i!==6){const edge=this.mesh(new THREE.TorusGeometry(Math.min(p.w,p.d)*.29,.035,4,48),this.materials.rim);edge.rotation.x=-Math.PI/2;edge.position.set(p.x,p.y+.20,p.z);edge.castShadow=false;}
    }
    // Two physically tracked moving islands spanning traversal gaps.
    for(const p of [{x:0,z:-10.7,y:1.18,w:3.5,d:2.5,range:1.25,speed:.9},{x:0,z:-52,y:1.5,w:3.8,d:2.6,range:1.45,speed:1.15}]){
      const visual=this.mesh(new RoundedBoxGeometry(p.w,.6,p.d,4,.25),this.materials.lilac);visual.position.set(p.x,p.y,p.z);
      const body=this.physics.movingPlatform({...p,h:.62});this.moving.push({visual,body});this.obstacles.push(visual);
    }
    this.buildScenery();
    this.buildCrystals(mission);
    this.buildTerminals(mission);
    this.buildHazards();
    this.buildSpringPads();
    this.buildLandmarks();
    this.buildEnemy();
    this.checkpoint=this.makeBeacon(1,-.7,-57.1);
    this.gateway=this.makeGateway(0,1.9,-97);
  }
  buildScenery(){
    const rand=makeRand();const treeG=new THREE.ConeGeometry(.72,3.1,7),trunkG=new THREE.CylinderGeometry(.12,.17,1.25,6);
    // Shared, GPU-instanced tree meshes: no temporary duplicate geometry.
    const foliage=new THREE.InstancedMesh(new THREE.ConeGeometry(.82,2.85,7),this.materials.canopy,80);
    const trunks=new THREE.InstancedMesh(trunkG,this.materials.bark,80);
    foliage.castShadow=false;trunks.castShadow=false;
    const object=new THREE.Object3D(); let n=0;
    for(const p of ISLANDS){for(let j=0;j<14 && n<80;j++){
      const x=p.x+(rand()-.5)*(p.w-1.1),z=p.z+(rand()-.5)*(p.d-1.1);
      // Keep the center of the path free for PIX and the camera.
      if(Math.abs(x)<2.9 && (j%3!==0))continue;
      const height=.7+rand()*.85;
      object.position.set(x,p.y+1.7*height,z);object.scale.setScalar(height);object.updateMatrix();foliage.setMatrixAt(n,object.matrix);
      object.position.set(x,p.y+.54*height,z);object.scale.setScalar(height);object.updateMatrix();trunks.setMatrixAt(n,object.matrix);n++;
    }}
    foliage.count=trunks.count=n;foliage.instanceMatrix.needsUpdate=trunks.instanceMatrix.needsUpdate=true;
    this.group.add(foliage,trunks);this.scenery.push(foliage,trunks);
    // Far mountains and clouds: atmospheric geometry, not image billboards.
    const mountain=new THREE.ConeGeometry(26,42,5),cloud=new THREE.IcosahedronGeometry(1,1);
    for(let i=0;i<13;i++){const m=this.mesh(mountain,mat(i%2?'#a7bac3':'#92b6c0'));m.position.set((i-6)*32,-4,-135-i*7);m.rotation.y=i*.6;m.castShadow=false;}
    for(let i=0;i<18;i++){const o=this.mesh(cloud,mat('#e2f7f7',{transparent:true,opacity:.66}));o.position.set((i-9)*15,22+(i%4)*4,-35-i*12);o.scale.set(5,1.2,2.8);o.castShadow=false;this.clouds.push(o);}
    // Flower clusters are instanced and intentionally inexpensive on phones.
    const flowerG=new THREE.IcosahedronGeometry(.11,0);
    const flowerM=mat('#e6c7f5',{emissive:'#977ad1',emissiveIntensity:.18});
    const flowers=new THREE.InstancedMesh(flowerG,flowerM,180);let k=0;
    for(const p of ISLANDS)for(let j=0;j<29 && k<180;j++){
      const x=p.x+(rand()-.5)*(p.w-1),z=p.z+(rand()-.5)*(p.d-1);
      if(Math.abs(x)<1.8)continue;
      object.position.set(x,p.y+.28,z);object.scale.setScalar(.6+rand());object.updateMatrix();flowers.setMatrixAt(k++,object.matrix);
    }
    flowers.count=k;flowers.instanceMatrix.needsUpdate=true;flowers.castShadow=false;this.group.add(flowers);this.scenery.push(flowers);
  }
  buildCrystals(mission){
    const positions=ISLANDS;
    for(const item of CRYSTALS){const island=positions.reduce((best,p)=>Math.abs(p.z-item.z)<Math.abs(best.z-item.z)?p:best,positions[0]);
      const cluster=new THREE.Group();this.group.add(cluster);cluster.position.set(item.x,island.y+1.55,item.z);
      const gem=this.mesh(new THREE.OctahedronGeometry(.5,0),this.materials.crystal,cluster);
      gem.rotation.z=.35;const halo=this.mesh(new THREE.TorusGeometry(.72,.025,5,22),this.materials.crystal,cluster);halo.rotation.x=.8;
      const taken=mission.crystals.has(item.id);cluster.visible=!taken;
      this.crystals.push({...item,y:island.y+1.55,visual:cluster,taken});
    }
  }
  buildTerminals(mission){
    for(const p of [{id:'north',x:3.8,z:-31.2,island:2},{id:'south',x:-4,z:-74,island:5}]){
      const surface=ISLANDS[p.island].y;
      const terminal=new THREE.Group();this.group.add(terminal);terminal.position.set(p.x,surface+.58,p.z);
      this.mesh(new THREE.CylinderGeometry(.63,.78,1.1,8),this.materials.rock,terminal);
      const screen=this.mesh(new THREE.BoxGeometry(.9,.65,.1),this.materials.crystal,terminal);screen.position.y=.5;
      terminal.rotation.y=.5;
      this.terminals.push({...p,y:surface,visual:terminal,screen,active:mission.terminals.has(p.id)});
      if(mission.terminals.has(p.id))screen.material=this.materials.gold;
    }
  }
  buildHazards(){
    // Three obstacle types: rotating beams, oscillating energy orbs and moving islands.
    const rotator=this.mesh(new THREE.CylinderGeometry(.14,.14,4.4,10),this.materials.hazard);
    rotator.position.set(-.65,2.4,-16);rotator.rotation.z=Math.PI/2;
    this.hazards.push({type:'rotator',visual:rotator,z:-16,x:-.65});
    const orb=this.mesh(new THREE.IcosahedronGeometry(.6,1),this.materials.hazard);
    orb.position.set(0,2.7,-43.8);this.hazards.push({type:'sweeper',visual:orb,z:-43.8,x:0});
    const pillars=[];
    for(let j=-1;j<=1;j++){
      const p=this.mesh(new THREE.CylinderGeometry(.30,.44,2.5,8),this.materials.hazard);
      p.position.set(j*3.0,2.45,-89);pillars.push(p);
    }
    this.hazards.push({type:'timed-gate',visual:pillars,z:-89});
  }
  buildEnemy(){
    const group=new THREE.Group();this.group.add(group);group.position.set(0,3,-62.4);
    const shell=this.mesh(new THREE.IcosahedronGeometry(.88,1),this.materials.enemy,group);
    const eye=this.mesh(new THREE.SphereGeometry(.24,10,8),this.materials.crystal,group);eye.position.set(0,.06,-.75);
    this.enemy={visual:group,x:0,y:3,z:-62.4,originX:0,angle:0,aware:0,stunned:0,dir:1,
      lookingX:1,lookingZ:0,targetX:0,targetZ:-62.4,search:0,state:'patrol'};
  }
  buildSpringPads(){
    for(const p of [{x:3.3,z:-18.5,island:1},{x:-3.1,z:-60,island:4}]){
      const y=ISLANDS[p.island].y+.37;
      const ring=this.mesh(new THREE.TorusGeometry(.86,.12,8,34),this.materials.spring);
      ring.rotation.x=-Math.PI/2;ring.position.set(p.x,y,p.z);
      const pad=this.mesh(new THREE.CylinderGeometry(.64,.73,.18,24),this.materials.gold);
      pad.position.set(p.x,y-.09,p.z);
      const core=this.mesh(new THREE.IcosahedronGeometry(.20,1),this.materials.crystal);core.position.set(p.x,y+.26,p.z);
      this.springPads.push({...p,y,ring,core,at:-10});
    }
  }
  buildLandmarks(){
    // Arched ruins, glowing pillars and falling translucent water give every island a recognizable silhouette.
    for(const [i,p] of ISLANDS.entries()){
      if(i===0||i===6)continue;
      const sign=this.mesh(new THREE.TorusGeometry(1.3,.14,9,36,Math.PI),this.materials.ruin);
      sign.position.set(p.x+(i%2?2.8:-2.8),p.y+.28,p.z+1);
      sign.rotation.z=Math.PI;sign.rotation.y=.2*i;
      for(const offset of [-1.3,1.3]){
        const pillar=this.mesh(new THREE.CylinderGeometry(.17,.22,1.45,8),this.materials.ruin);
        pillar.position.set(sign.position.x+offset,p.y+.68,p.z+1);
      }
    }
    for(const [i,p] of [ISLANDS[1],ISLANDS[3],ISLANDS[5]].entries()){
      const falls=this.mesh(new THREE.CylinderGeometry(.39,.63,9.7,16,1,true),this.materials.glass);
      falls.position.set(p.x+p.w/2-.1,p.y-4.7,p.z+1.1);falls.castShadow=false;
      const spray=this.mesh(new THREE.TorusGeometry(1.55,.07,6,36),this.materials.glass);
      spray.rotation.x=-Math.PI/2;spray.position.set(falls.position.x,p.y-9.5,falls.position.z);
    }
    const markers=[{x:0,z:-5},{x:-.65,z:-20},{x:.9,z:-36},{x:-.8,z:-49},{x:.65,z:-65.5},{x:-.5,z:-81}];
    for(const mark of markers){const glow=this.mesh(new THREE.OctahedronGeometry(.20),this.materials.gold);glow.position.set(mark.x,3.35,mark.z);glow.castShadow=false;}
  }
  makeBeacon(x,y,z){
    const group=new THREE.Group();this.group.add(group);group.position.set(x,1.85,z);
    const ring=this.mesh(new THREE.TorusGeometry(.8,.08,8,32),this.materials.crystal,group);ring.rotation.x=.2;
    const gem=this.mesh(new THREE.OctahedronGeometry(.28),this.materials.gold,group);gem.position.y=1.05;
    return group;
  }
  makeGateway(x,y,z){
    const group=new THREE.Group();this.group.add(group);group.position.set(x,y,z);
    const ring=this.mesh(new THREE.TorusGeometry(2.0,.17,8,64),this.materials.crystal,group);
    ring.rotation.z=.17;
    for(let i=0;i<6;i++){
      const orbit=this.mesh(new THREE.OctahedronGeometry(.23),this.materials.gold,group);
      orbit.position.set(Math.cos(i*Math.PI/3)*2.3,Math.sin(i*Math.PI/3)*2.2,.3);
    }return group;
  }
  interact(player,mission){
    for(const t of this.terminals){
      if(!t.active && Math.hypot(player.x-t.x,player.z-t.z)<2.45){
        t.active=true;t.screen.material=this.materials.gold;mission.terminal(t.id);this.onEvent('terminal',{id:t.id});return true;
      }
    }return false;
  }
  update(dt, now, player, mission, dashing = false) {
    this.time=now;
    for(const {visual,body} of this.moving)visual.position.x=body.previousX;
    this.gateway.rotation.y=now*.22;this.checkpoint.rotation.y=now*.6;
    for(const gem of this.crystals){
      if(gem.taken)continue;
      gem.visual.rotation.y+=dt*1.5;gem.visual.position.y=gem.y+Math.sin(now*2.7+gem.z)*.14;
      if(Math.hypot(player.x-gem.x,player.z-gem.z)<1.1 && Math.abs(player.y-(gem.y-.3))<2.4){
        gem.taken=true;gem.visual.visible=false;mission.crystal(gem.id);this.onEvent('crystal',{id:gem.id});
      }
    }
    if(player.z < -54 && mission.checkpoint.z > -54){
      mission.checkpoint={x:0,y:3.25,z:-57};this.onEvent('checkpoint',{checkpoint:mission.checkpoint});
    }
    const [rotator,sweeper,gate]=this.hazards;
    rotator.visual.rotation.y=now*1.9;
    sweeper.visual.position.x=Math.sin(now*2)*3.4;
    sweeper.visual.position.y=2.55+Math.sin(now*2.1)*.35;
    for(const [i,p] of gate.visual.entries())p.scale.y=(Math.sin(now*3+i*2)>-.1?1:.42);
    let danger=beamHazard(player,now) || orbHazard(player,{x:sweeper.visual.position.x,y:sweeper.visual.position.y,z:-43.8}) || gateHazard(player,now);
    let bounce=false;
    for(const pad of this.springPads){
      pad.ring.rotation.z=now*.8;
      pad.core.position.y=pad.y+.26+Math.sin(now*3)*.09;
      if(now-pad.at>.7 && player.y<pad.y+1.6 && player.y>pad.y+.35 && Math.hypot(player.x-pad.x,player.z-pad.z)<.85){
        pad.at=now;bounce=true;this.onEvent('spring',{x:pad.x,z:pad.z});
      }
    }
    for(const [i,cloud] of this.clouds.entries()){cloud.position.x+=(i%2?1:-1)*dt*.38;if(Math.abs(cloud.position.x)>150)cloud.position.x*=-.92;}
    const enemy=this.enemy;
    if(enemy.stunned>0){enemy.stunned=Math.max(0,enemy.stunned-dt);enemy.visual.visible=enemy.stunned===0;enemy.state='stunned';}
    else {
      const dx=player.x-enemy.x,dz=player.z-enemy.z;
      const distance=Math.hypot(dx,dz);
      if(canSpotPlayer(enemy,player,enemy.lookingX,enemy.lookingZ)){
        enemy.aware=2.4;enemy.targetX=player.x;enemy.targetZ=player.z;enemy.state='chase';
      }else {const hadFocus=enemy.aware>0;enemy.aware=Math.max(0,enemy.aware-dt);if(hadFocus&&enemy.aware===0)enemy.search=1.6;}
      if(enemy.aware>0 || enemy.search>0){
        if(enemy.aware<=0)enemy.state='search';
        const vx=enemy.targetX-enemy.x,vz=enemy.targetZ-enemy.z,r=Math.hypot(vx,vz);
        if(r>.25){
          const speed=enemy.state==='chase'?1.9:1.1;
          const step=Math.min(r,dt*speed);enemy.x+=vx/r*step;enemy.z+=vz/r*step;
          enemy.lookingX=vx/r;enemy.lookingZ=vz/r;
        } else if(enemy.aware===0){enemy.search=Math.max(0,enemy.search-dt);}
        if(enemy.aware===0&&enemy.search===0){enemy.state='patrol';enemy.search=0;}
      } else {
        enemy.state='patrol';enemy.angle+=dt*.75;
        let xx=enemy.originX+Math.sin(enemy.angle)*2.2,zz=-62.4+Math.cos(enemy.angle)*1.4;
        const vx=xx-enemy.x,vz=zz-enemy.z,len=Math.hypot(vx,vz);
        if(len>.005){enemy.lookingX=vx/len;enemy.lookingZ=vz/len;}
        enemy.x=xx;enemy.z=zz;
      }
      // Keep the guardian inside its island (it cannot float through the ocean).
      enemy.x=Math.max(-4.35,Math.min(4.35,enemy.x));enemy.z=Math.max(-64.5,Math.min(-56,enemy.z));
      enemy.visual.position.set(enemy.x,enemy.y+Math.sin(now*2)*.15,enemy.z);
      enemy.visual.rotation.y=Math.atan2(-enemy.lookingX,-enemy.lookingZ);
      if(distance<1.3&&Math.abs(player.y-enemy.y)<2.0){
        if(dashing){enemy.stunned=3;enemy.aware=0;this.onEvent('enemyDodged',{});}else danger=true;
      }
    }
    return {danger,bounce};
  }
  dispose(){
    this.scene.remove(this.group);
    const geo=new Set(),mts=new Set();this.group.traverse(o=>{
      if(o.geometry)geo.add(o.geometry);
      const materials=Array.isArray(o.material)?o.material:[o.material];for(const mat of materials)if(mat)mts.add(mat);
    });for(const g of geo)g.dispose();for(const m of mts)m.dispose();
  }
}
