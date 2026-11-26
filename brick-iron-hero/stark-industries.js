/* STARK INDUSTRIES: additive gameplay module for the original workshop engine. */
function createStarkIndustries(B){
 const {T,scene,player,figure,box,cylinder,brick,glow,mat,batchRigid}=B;
 const $=id=>document.getElementById(id), KEY='brick-stark-industries-090';
 const names={tony:'Tony Stark',mark1:'Iron Man Mark I',mark2:'Iron Man Mark II',mark3:'Iron Man Mark III',war:'War Machine',pepper:'Pepper Potts'};
 const prices={mark1:0,mark2:2200,mark3:0,war:4500,pepper:800};
 const skills={tony:'Budowanie i naprawa',mark1:'Silne uderzenie, kruszenie przeszkód',mark2:'Szybki lot i impuls',mark3:'Lot i repulsory',war:'Impuls obszarowy i lot',pepper:'Terminale i tajne przejścia'};
 const defaults=()=>({v:1,wallet:0,unlocked:['tony'],red:false,gold:0,mini:[],caveDone:false,workshopDone:false,detector:false,mult:1,ownedMult:[1],ach:[],workBuilt:false,workBroken:[],cave:null,last:'workshop'});
 let meta=defaults();try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d&&d.v===1)meta={...meta,...d}}catch(e){}
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(meta));return true}catch(e){return false}};
 const models={tony:B.tony,mark3:B.iron};let current='tony',area='workshop',free=false,cave=null,storyCut=null,picker=false,combo=0,attackTime=0,dodgeTime=0,damageTime=0,elapsed=0,hudClock=0;
 const workshop=new T.Group();scene.add(workshop);let caveRoot=null,yinsen=null,caveLights=[],worldLook=null,waypoint=null,spoken=new Set(),voiceUntil=0,hidden=[],extras=[],holograms=[],particles=[],beams=[];
 function getModel(id){if(!models[id]){models[id]=figure.variant(id);models[id].visible=false;player.add(models[id])}return models[id]}
 function has(id){return meta.unlocked.includes(id)}
 function unlock(id){if(!has(id)){meta.unlocked.push(id);achievement('Postać: '+names[id]);save()}}
 function achievement(name){if(!meta.ach.includes(name)){meta.ach.push(name);B.notice('OSIĄGNIĘCIE: '+name);save()}}
 function award(n){const value=n*meta.mult;meta.wallet+=value;if(area==='cave'&&cave)cave.score+=value;else B.addScore(value);if(meta.wallet>=1000)achievement('Pierwszy tysiąc');save();return value}
 function select(id,force=false){if(!names[id]||(!force&&!has(id)))return false;if(area==='cave'&&!free&&!force&&cave?.stage===0&&id!=='tony'){B.notice('Najpierw zbuduj Mark I');return false}const next=getModel(id);Object.values(models).forEach(m=>m.visible=false);B.reset(next);next.visible=true;current=id;B.setArmor(isArmor(),false);B.hud();return true}
 function isArmor(){return ['mark1','mark2','mark3','war'].includes(current)}
 function canFly(){return ['mark2','mark3','war'].includes(current)}
 function model(){return getModel(current)}
 function syncBase(v){Object.values(models).forEach(m=>m.visible=false);current=v?'mark3':'tony';models[current].visible=true;if(v)unlock('mark3')}
 function label(parent,title,x,y,z,w=2.4){const c=document.createElement('canvas');c.width=512;c.height=128;const q=c.getContext('2d');q.fillStyle='#101d2d';q.fillRect(0,0,512,128);q.fillStyle='#83d7ff';q.fillRect(0,0,9,128);q.font='bold 39px system-ui';q.fillText(title,24,77,470);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,w/4),new T.MeshBasicMaterial({map:t}));m.position.set(x,y,z);parent.add(m)}
 function group(parent,x,y,z){let g=new T.Group();g.position.set(x,y,z);parent.add(g);return g}
 function addHolo(parent,x,y,z){const g=group(parent,x,y,z);const material=new T.MeshBasicMaterial({color:0x65dfff,transparent:true,opacity:.65,wireframe:true});const m=new T.Mesh(new T.IcosahedronGeometry(.44,1),material);g.add(m);holograms.push(m);return g}
 // Armory pedestals, interactive computer and building zone. Display suits
 // are low-detail sculpted display shells, not extra live character rigs.
 for(const [i,id] of ['mark1','mark2','mark3','war'].entries()){
   const x=-7.7+i*2.25,z=-7.0,g=group(workshop,x,0,z);
   brick(0,.23,0,1.65,.45,1.48,0x26394d,g);box(0,1.55,-.62,1.5,2.35,.16,0x1e354b,g);
   for(const side of [-1,1]){box(side*.78,1.45,0,.10,2.15,1.32,0x355675,g);glow(side*.73,1.5,.56,.055,1.95,.06,0x54bde9,g)}
   const display=figure.variant(id);display.scale.setScalar(.78);display.position.set(0,.47,-.05);display.rotation.y=0;label(g,names[id].replace('Iron Man ','').toUpperCase(),0,2.75,.13,1.45);batchRigid(g);g.add(display);
   extras.push({type:'suit',id,g,x,z,range:1.65,display});
 }
 const pc=group(workshop,-7,0,0);brick(0,.55,0,1.8,1.1,1,0x364b60,pc);box(0,1.39,-.25,1.25,.54,.12,0x192d40,pc);glow(0,1.4,-.17,1.08,.43,.025,0x419fc4,pc);addHolo(pc,0,2.05,0);label(pc,'TERMINAL',0,2.68,0,1.5);extras.push({type:'terminal',g:pc,x:-7,z:0,range:2});
 const build=group(workshop,6,0,8);brick(0,.15,0,2.8,.26,2.3,0x465368,build);for(let i=0;i<9;i++)brick(Math.sin(i*2.4)*.85,.42+(i%3)*.13,Math.cos(i*2.4)*.70,.37,.19,.35,i%2?0xc4a340:0x3289bb,build);label(build,'BUDUJ',0,1.65,0,1.5);extras.push({type:'build',g:build,x:6,z:8,range:2.3});
 const buildFinished=group(workshop,6,0,8);box(0,.65,0,1.4,1.18,.85,0x35566c,buildFinished);glow(0,.85,.45,.95,.39,.06,0x57d9ef,buildFinished);addHolo(buildFinished,0,1.95,0);buildFinished.visible=meta.workBuilt;build.visible=!meta.workBuilt;
 for(let i=0;i<5;i++){let x=-8+i*3.6,z=9.5,g=group(workshop,x,0,z);brick(0,.36,0,.9,.7,.9,0x617b8e,g);brick(0,.81,0,.8,.23,.8,0xe5b34c,g);batchRigid(g);g.visible=!meta.workBroken.includes(i);extras.push({type:'break',id:i,g,x,z,range:1.5})}
 function openPicker(){picker=true;$('starkPanel').classList.remove('hidden');B.release();renderPicker()}
 function closePicker(){picker=false;$('starkPanel').classList.add('hidden')}
 function renderPicker(){
   $('starkWallet').textContent=meta.wallet+' STUDÓW · '+percent()+'%';
   $('characterList').replaceChildren();
   for(const id of Object.keys(names)){const b=document.createElement('button');b.className='starkChar';let unlocked=has(id);b.textContent=names[id]+' · '+(unlocked?'WYBIERZ':prices[id]?'KUP '+prices[id]:'ZABLOKOWANY');const small=document.createElement('small');small.textContent=skills[id];b.append(small);b.disabled=!unlocked&&(!prices[id]||meta.wallet<prices[id]);b.onclick=()=>{if(!has(id)){meta.wallet-=prices[id];unlock(id)}if(select(id))closePicker();save()};$('characterList').append(b)}
   $('bonusList').replaceChildren();for(let m of [2,4,6,8,10]){let b=document.createElement('button');b.className='starkChar';let owned=meta.ownedMult.includes(m),price=m*450;b.textContent='Study ×'+m+' · '+(owned?'AKTYWUJ':price+' STUDÓW');b.disabled=!owned&&(!meta.red||meta.wallet<price);b.onclick=()=>{if(!owned){meta.wallet-=price;meta.ownedMult.push(m)}meta.mult=meta.mult===m?1:m;save();renderPicker();B.hud()};$('bonusList').append(b)}
   $('starkDetector').textContent='Wykrywacz: '+(meta.detector?'WŁ.':'KUP 600');$('starkDetector').disabled=!meta.detector&&meta.wallet<600;
   $('starkAchievements').textContent=meta.ach.length?meta.ach.join(' · '):'Brak osiągnięć';
 }
 $('starkClose').onclick=closePicker;$('starkDetector').onclick=()=>{if(!meta.detector&&meta.wallet>=600){meta.wallet-=600;meta.detector=true;save();renderPicker()}};
 function percent(){return Math.min(100,Math.round((meta.workshopDone?20:0)+(meta.caveDone?30:0)+meta.mini.length*2+meta.unlocked.length*3+(meta.red?5:0)+(meta.workBuilt?5:0)+(meta.detector?2:0)))}
 function onWorkshopDone(){if(!meta.workshopDone){meta.workshopDone=true;meta.gold++;unlock('mark3');achievement('Narodziny Mark III');save()}}
 function useWorkshop(){const p=player.position;if(Math.hypot(p.x-7,p.z+6)<2.8&&B.stage()>=2){if(current==='tony')openPicker();else select('tony',true);return true}
   const o=extras.find(e=>e.g.visible&&Math.hypot(p.x-e.x,p.z-e.z)<e.range);if(!o)return false;
   if(o.type==='suit'){if(has(o.id)){select(o.id);B.notice(names[o.id])}else openPicker()}
   if(o.type==='terminal'){if(current==='pepper'&&!meta.ach.includes('Dostęp administracyjny')){award(100);achievement('Dostęp administracyjny')}openPicker()}
   if(o.type==='build'){meta.workBuilt=true;build.visible=false;buildFinished.visible=true;award(250);achievement('Mistrz budowania');B.sfx('success')}
   if(o.type==='break'){o.g.visible=false;meta.workBroken.push(o.id);scatter(o.x,.7,o.z,0xe9b955);for(let i=0;i<4;i++)B.stud(o.x+Math.cos(i*1.57)*.7,o.z+Math.sin(i*1.57)*.7);save()}
   return true;
 }
 // Cave: authored chamber layout, interactive gates, ten collectible kits.
 const solids=[],items=[],robots=[],switches=[],gateMap={};
 const rockGeo=new T.IcosahedronGeometry(1,1),rockMat=new T.MeshStandardMaterial({color:0xffffff,roughness:.76,flatShading:true});
 const rockData=[];let rockSeed=831,rockMesh=null;const hiddenRocks=new Set(),hiddenGates=new Set(),rockMatrices=[],collapsed=new T.Matrix4().makeScale(0,0,0);const cutLook=new T.Vector3();
 function rand(){rockSeed=(rockSeed*1664525+1013904223)>>>0;return rockSeed/4294967296}
 function rock(parent,x,z,w,h,d,color=0x665f5c,y=0){rockData.push({x,y:y+h*.46,z,w,h,d,color,rx:(rand()-.5)*.33,ry:rand()*Math.PI*2,rz:(rand()-.5)*.27})}
 function flushRocks(){const mesh=new T.InstancedMesh(rockGeo,rockMat,rockData.length),o=new T.Object3D();rockData.forEach((p,i)=>{const height=Math.min(p.z<-10.7?3.45:Math.abs(p.x)>11.2?2.0:1.55,Math.max(.22,p.h*.56));const elevated=p.y-p.h*.46>1.2;
 if(elevated){o.position.set(p.x,-5,p.z);o.scale.set(.001,.001,.001);o.rotation.set(0,0,0)}
 else{o.position.set(p.x,height*.49,p.z);o.scale.set(p.w,height*.51,p.d);o.rotation.set(p.rx*.35,p.ry,p.rz*.35)}
 o.updateMatrix();p.renderY=o.position.y;p.renderH=o.scale.y;p.elevated=elevated;rockMatrices[i]=o.matrix.clone();mesh.setMatrixAt(i,o.matrix);mesh.setColorAt(i,new T.Color(p.color))});mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();rockMesh=mesh;caveRoot.add(mesh)}
 // Camera cutaway: test each rock's conservative ellipsoid, not its triangles.
 // Only obstructing instances disappear; the original world collision stays intact.
 function blocksSight(a,b,x,y,z,rx,ry,rz){
   const ax=(a.x-x)/rx,ay=(a.y-y)/ry,az=(a.z-z)/rz;
   const dx=(b.x-a.x)/rx,dy=(b.y-a.y)/ry,dz=(b.z-a.z)/rz;
   const t=T.MathUtils.clamp(-(ax*dx+ay*dy+az*dz)/Math.max(.0001,dx*dx+dy*dy+dz*dz),0,1);
   if(t>.995)return false;
   return (ax+t*dx)**2+(ay+t*dy)**2+(az+t*dz)**2<1;
 }
 const sightTop=new T.Vector3(),sightLow=new T.Vector3(),sightMid=new T.Vector3();
 // Cutaway terrain is permanently low enough for the gameplay camera.
 // Doors are shortened visually in the same way, but remain solid to the player.
 function occlude(cam){
   if(area!=='cave'||!rockMesh)return;
   const p=storyCut?cutLook:player.position,y=storyCut?p.y:p.y+1.1;
   sightMid.set(p.x,y,p.z);sightTop.set(p.x,y+.93,p.z);sightLow.set(p.x,Math.max(.2,y-.86),p.z);
   let changed=false;
   for(let i=0;i<rockData.length;i++){const r=rockData[i];if(r.elevated)continue;
     // Use a generous horizontal envelope, with a direct near-camera test.
     const near=Math.hypot(cam.x-r.x,cam.z-r.z)<Math.max(r.w,r.d)+.65&&cam.y<r.renderY+r.renderH+.7;
     const blocks=(q)=>blocksSight(cam,q,r.x,r.renderY,r.z,r.w*1.5+.45,r.renderH*1.5+.4,r.d*1.5+.45);
     const hide=near||blocks(sightMid)||blocks(sightTop)||blocks(sightLow);
     if(hide!==hiddenRocks.has(i)){if(hide){hiddenRocks.add(i);rockMesh.setMatrixAt(i,collapsed)}else{hiddenRocks.delete(i);rockMesh.setMatrixAt(i,rockMatrices[i])}changed=true}
   }
   if(changed)rockMesh.instanceMatrix.needsUpdate=true;
   for(const gate of Object.values(gateMap)){const q=gate.collider,hide=!gate.open&&blocksSight(cam,sightMid,q.x,1.25,q.z,q.w*.55+.25,1.6,.7);gate.g.scale.y=hide?.33:1;}
 }
 function wall(x,z,w,d,h=3.6){solids.push({x,z,w,d,active:true});const n=Math.ceil(Math.max(w,d)/1.0);for(let i=0;i<n;i++){const f=(i+.5)/n-.5;const xx=x+f*w,zz=z+f*d;
    rock(caveRoot,xx,zz,.78+rand()*.34,h*(.82+rand()*.22),.72+rand()*.24,0x5c514a);
    rock(caveRoot,xx+.21*(rand()-.5),zz+.35,.64,1.10+rand()*1.15,.58,0x786454);
    rock(caveRoot,xx,zz-.15,.95,1.55,.85,0x4b4340,2.1);if(i%2===0)rock(caveRoot,xx+.22,zz+.34,.74,.45,.54,0x9b8063,1.25+rand()*.8);
 }}
 function groundSurface(){const geo=new T.PlaneGeometry(25,25,25,25);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,colors=[];
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,.10+Math.sin(x*1.9+z*.5)*.025+Math.cos(z*1.7)*.022);const v=.84+rand()*.16;colors.push(v*.43,v*.34,v*.28)}
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();let floor=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:.96,flatShading:true}));floor.receiveShadow=true;caveRoot.add(floor);
 }
 let sharedLampMap=null;
 function lampPool(x,z,color=0xeab36f){const c=document.createElement('canvas');c.width=c.height=64;let q=c.getContext('2d'),g=q.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(255,185,100,.28)');g.addColorStop(1,'rgba(255,185,100,0)');q.fillStyle=g;q.fillRect(0,0,64,64);const map=sharedLampMap||(sharedLampMap=new T.CanvasTexture(c)),m=new T.Mesh(new T.PlaneGeometry(5.8,5.8),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));m.rotation.x=-Math.PI/2;m.position.set(x,.145,z);caveRoot.add(m)}
 function caveDressing(){
  groundSurface();
  // Large molded foundation plates with a hand-placed, three-chamber palette.
  // All tiles and studs render in only two instanced draw calls.
  const tiles=new T.InstancedMesh(new T.BoxGeometry(1.14,.055,1.14),new T.MeshStandardMaterial({color:0xffffff,roughness:.67}),400);
  const studs=new T.InstancedMesh(new T.CylinderGeometry(.115,.123,.065,10),new T.MeshStandardMaterial({color:0xffffff,roughness:.58}),600);
  const pivot=new T.Object3D(),color=new T.Color();let ti=0,si=0;
  for(let i=0;i<20;i++)for(let j=0;j<20;j++){
    const x=(i-9.5)*1.18,z=(j-9.5)*1.18;const palette=z>3.5?[0x6b6256,0x74695b,0x797064]:z>-3.5?[0x625c57,0x6e655a,0x746c62]:[0x74624e,0x7b6b58,0x88745b];
    color.setHex(palette[(i*7+j*11)%3]);pivot.position.set(x,.17,z);pivot.rotation.set(0,0,0);pivot.scale.set(1,1,1);pivot.updateMatrix();tiles.setMatrixAt(ti,pivot.matrix);tiles.setColorAt(ti++,color);
    if((i+j)%3===0&&Math.abs(x)>2.2){for(const dx of [-.30,.30])for(const dz of [-.30,.30]){pivot.position.set(x+dx,.23,z+dz);pivot.updateMatrix();studs.setMatrixAt(si,pivot.matrix);studs.setColorAt(si++,color)}}
  }tiles.count=ti;studs.count=si;for(const mesh of [tiles,studs]){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.receiveShadow=true;caveRoot.add(mesh)}
  // Irregular rock formations, rubble, ceiling fragments away from camera path.
  for(let i=0;i<32;i++){let p=(i+.5)/32*24-12;for(const side of [-1,1]){rock(caveRoot,side*12,p,1.1+rand()*.8,3.1+rand()*2,.9+rand()*.45,0x65564b);rock(caveRoot,p,side*12,.9+rand()*.65,3.2+rand()*1.9,1.1+rand()*.6,0x574944)}}
  for(let i=0;i<45;i++){let x=-11+rand()*22,z=-11+rand()*22;if(Math.abs(x)>9.5){rock(caveRoot,x,z,.20+rand()*.45,.35+rand()*.55,.22+rand()*.45,0x8a735e)}}
  for(let i=0;i<13;i++){let z=11-i*1.7;box(-10.5,.15,z,.07,.10,1.4,0x363236,caveRoot);box(-10.27,.15,z,.06,.11,1.4,0x2b292c,caveRoot)}
  for(let i=0;i<4;i++){let x=-8.5+i*1.55;const g=group(caveRoot,x,0,10.85);brick(0,.25,0,1.3,.47,.72,0x62513b,g);brick(0,.64,0,1.25,.26,.69,0x91704b,g);for(let side of [-1,1])box(side*.43,.48,.39,.08,.81,.055,0x4c3d32,g)}
  const bed=group(caveRoot,-3.6,0,10.1);box(0,.35,0,1.4,.25,2.05,0x343e41,bed);box(0,.53,0,1.22,.18,1.86,0x887c68,bed);box(0,.66,-.60,1.0,.15,.53,0xc4b29b,bed);
  for(const x of [-.60,.60])for(const z of [-.85,.85])box(x,.19,z,.13,.39,.13,0x34383b,bed);
  const work=group(caveRoot,7,0,7);for(const x of [-.94,.94])for(const z of [-.62,.62])box(x,.46,z,.14,.92,.14,0x393d41,work);box(0,.96,0,2.5,.19,1.65,0x675749,work);box(0,1.36,-.72,2.36,.66,.15,0x393e41,work);
  for(let i=0;i<5;i++){let x=-.92+i*.43;box(x,1.34,-.60,.06,.38,.06,0x9b9b94,work);let bolt=cylinder(x,1.55,-.57,.085,.04,0x8f9390,work);bolt.rotation.x=Math.PI/2}
  const plans=group(work,-.65,1.09,.22);box(0,0,0,.62,.015,.42,0xaaa18c,plans);for(let i=0;i<4;i++)box(0,.012,-.14+i*.075,.42,.006,.015,0x4c5558,plans);
  for(let i=0;i<4;i++)brick(.35+i*.19,1.14,.21,.16,.15,.20,0x7c8384,work);
  label(work,'MARK I · MONTAŻ',0,1.96,0,2.25);
  for(let i=0;i<5;i++){let x=-9+i*4.5,z=-6;const g=group(caveRoot,x,0,z);brick(0,.30,0,.86,.58,.75,0x70614e,g);brick(0,.67,0,.78,.15,.68,0x867a64,g);box(0,.40,.40,.14,.18,.06,0x3b4143,g)}
  for(let i=0;i<5;i++){let z=9-i*4.5;lampPool(i%2?7:-7,z)}
  for(const [x,z] of [[-7,6],[7,7],[7,-1],[-4,-8],[0,-10]])lampPool(x,z);
  for(let i=0;i<7;i++){let x=-3+i;rock(caveRoot,x,3.35,.58,1.0+rand()*.5,.72,0x6e5b4c,2.55);rock(caveRoot,x,-3.4,.62,1.25+rand()*.6,.70,0x534841,2.45)}
  for(let i=0;i<6;i++){let x=-2.5+i;rock(caveRoot,x,-11.4,.75,1.5,.85,0xb2926b,2.15)}
  const shelf=group(caveRoot,10.4,0,1.2);for(let k=0;k<3;k++){box(0,.28+k*.64,0,.92,.12,2.4,0x65594d,shelf);for(let n=0;n<3;n++)brick(0,.51+k*.64,-.75+n*.75,.58,.28,.55,[0x6c7a77,0xa49a80,0x987452][n],shelf)}for(let z of [-1.11,1.11])for(let x of [-.4,.4])box(x,1.0,z,.09,2.1,.09,0x333c40,shelf);
  const cart=group(caveRoot,-8.8,0,-1.8);brick(0,.46,0,1.36,.27,.93,0x766452,cart);for(let s of [-1,1])for(let z of [-.33,.33]){let w=cylinder(s*.64,.22,z,.17,.16,0x383536,cart);w.rotation.z=Math.PI/2}for(let i=0;i<4;i++)brick(-.46+i*.31,.70,0,.26,.19,.47,0x8c9793,cart);batchRigid(shelf);batchRigid(cart);
  for(let i=0;i<6;i++){const x=-9.8+i*3.8;brick(x,.29,-3.65,1.02,.30,.64,0x746452,caveRoot);brick(x,.57,-3.65,.85,.25,.62,0x9a8263,caveRoot)}
  for(let i=0;i<5;i++){const z=8.8-i*3.7;box(-10.1,.40,z,.075,.72,.09,0x68625c,caveRoot);glow(-10.1,.78,z,.23,.10,.23,0xffd59b,caveRoot)}
  const exitSign=group(caveRoot,0,0,-10.8);label(exitSign,'WYJŚCIE',0,2.3,.1,2.0);glow(0,2.65,0,1.7,.08,.12,0xe7d4a8,exitSign);
 
 }
 function gate(id,x,z,w){const g=group(caveRoot,x,0,z);box(0,1.25,0,w,2.5,.32,0x5e6268,g);for(let i=0;i<5;i++)box(0,.25+i*.43,.18,w-.12,.055,.08,0x242b36,g);glow(0,1.3,.21,.19,.19,.045,0xeac447,g);const collider={x,z,w,d:.6,active:true};solids.push(collider);gateMap[id]={g,collider,open:false}}
 function openGate(id){let o=gateMap[id];if(o){o.open=true;o.collider.active=false;o.g.visible=false}}
 function pickup(type,id,x,z){const g=group(caveRoot,x,.38,z);if(type==='part'){brick(0,0,0,.34,.20,.34,0x44bdd6,g);glow(0,.15,0,.14,.06,.14,0xc5faff,g)}
   else if(type==='mini'){box(0,0,0,.46,.28,.31,0xe1d5c4,g);box(0,.14,0,.20,.09,.12,0x303b4a,g);for(const s of [-1,1]){let wheel=cylinder(s*.19,-.10,.16,.075,.075,0x21262d,g);wheel.rotation.x=Math.PI/2}}
   else if(type==='red'){brick(0,0,0,.44,.24,.34,0xe52b37,g)}else if(type==='gold'){brick(0,0,0,.44,.24,.34,0xf8c950,g)}
   else cylinder(0,0,0,.15,.09,0xfac549,g,.4);
   batchRigid(g);items.push({type,id,g,x,z,live:true})}
 function terminal(id,x,z){let g=group(caveRoot,x,0,z);box(0,.48,0,.78,.96,.6,0x4b5057,g);glow(0,1.02,.20,.53,.36,.07,0x70e6a0,g);label(g,id==='power'?'ZASILANIE':id==='secret'?'SEKRET':'BRAMA',0,1.65,0,1.15);switches.push({id,x,z,g})}
 function enemy(id,x,z){let g=group(caveRoot,x,0,z),col=0x7b6252;box(0,.79,0,.56,.67,.40,col,g);let head=new T.Mesh(new T.CylinderGeometry(.26,.26,.38,12),mat(0xa48b70));head.position.y=1.32;g.add(head);glow(0,1.35,.25,.35,.06,.035,0xfb7951,g);let arms=[],legs=[];for(let s of [-1,1]){let a=group(g,s*.35,1.02,0),l=group(g,s*.15,.47,0);box(0,-.23,0,.19,.47,.23,0x53575b,a);box(0,-.20,0,.23,.40,.30,0x53575b,l);arms.push(a);legs.push(l)}robots.push({id,g,arms,legs,hp:3,live:true,cool:0})}
 function makeCave(saved=null,mode=false){
   area='cave';free=mode;meta.last='cave';caveRoot=new T.Group();worldLook={background:scene.background,fog:scene.fog,lights:scene.children.filter(o=>o.isLight).map(o=>({o,intensity:o.intensity,color:o.color?.clone(),ground:o.groundColor?.clone()}))};
   hidden=scene.children.filter(o=>!o.isLight&&o!==player&&!B.persistent(o)).map(o=>[o,o.visible]);for(const [o] of hidden)o.visible=false;scene.add(caveRoot);
   scene.background=new T.Color(0x342c27);scene.fog=new T.Fog(0x342c27,13,40);for(const light of scene.children.filter(o=>o.isLight)){if(light.isDirectionalLight){light.intensity*=.58;light.color.setHex(0xffcda0)}else if(light.isHemisphereLight){light.intensity=1.15;light.color.setHex(0xc5b8a8);light.groundColor.setHex(0x76604f)}}const lamp=new T.PointLight(0xffc18a,9,11,2);lamp.position.set(7,3.4,7);caveRoot.add(lamp);const blue=new T.PointLight(0x89c5ff,5,10,2);blue.position.set(0,3.1,-9);caveRoot.add(blue);
   cave={stage:0,parts:[],switches:[],killed:[],collected:[],score:0,hp:5,done:false,pos:[0,0,10],mode:free};if(saved)cave={...cave,...saved,mode:free};
   caveDressing();
   for(let i=0;i<12;i++){let x=-11+i*2;rock(caveRoot,x,-11.7,1.3,4.8,.9);rock(caveRoot,x,11.7,1.3,3.8,.9)}
   for(let i=0;i<12;i++){let z=-11+i*2;rock(caveRoot,-11.7,z,.9,4.5,1.3);rock(caveRoot,11.7,z,.9,4.5,1.3)}
   wall(-6.6,3.1,9,.7);wall(6.6,3.1,9,.7);gate('power',0,3.1,4.0);
   wall(-6.8,-3.6,8.6,.7);wall(6.8,-3.6,8.6,.7);gate('exit',0,-3.6,4.2);
   wall(-6,-7.2,.65,5.4);wall(-8.7,-4.7,5.8,.65);wall(-9.65,-10,3.1,.65);gate('secret',-7.15,-10,1.8);
   for(let i=0;i<10;i++){const x=-10+(i%5)*5,z=8-Math.floor(i/5)*12;const lamp=group(caveRoot,x,0,z);box(0,1.1,0,.12,2.2,.12,0x4b4947,lamp);glow(0,2.16,0,.28,.28,.28,0xe9a34f,lamp)}
   yinsen=figure.variant('yinsen');yinsen.position.set(2.0,.10,9.2);yinsen.rotation.y=-.38;caveRoot.add(yinsen);flushRocks();
   terminal('power',-7,6);terminal('exit',7,-1);terminal('secret',-4,-8);
   waypoint=new T.Group();const halo=new T.Mesh(new T.TorusGeometry(.57,.038,6,28),new T.MeshBasicMaterial({color:0x7cecff,transparent:true,opacity:.9,depthTest:false}));halo.rotation.x=Math.PI/2;halo.renderOrder=30;waypoint.add(halo);const arrow=new T.Mesh(new T.ConeGeometry(.14,.34,4),new T.MeshBasicMaterial({color:0xffd359,depthTest:false}));arrow.rotation.z=Math.PI;arrow.position.y=.65;arrow.renderOrder=31;waypoint.add(arrow);caveRoot.add(waypoint);
   [[-8,9],[-4,5],[1,7],[4,9],[8,5],[9,10]].forEach((p,i)=>pickup('part',i,...p));
   [[-9,10],[-1,9],[9,8],[-9,5],[3,5],[-8,0],[8,0],[0,-1],[9,-9],[-9,-9]].forEach((p,i)=>pickup('mini',i,...p));
   pickup('red',0,-9,-7);pickup('gold',0,0,-10);
   [[-5,-.4],[4,0],[8,-7],[-1,-8]].forEach((p,i)=>enemy(i,...p));
   for(const o of items){if(cave.collected.includes(o.type+o.id)||o.type==='mini'&&meta.mini.includes(o.id)||o.type==='red'&&meta.red){o.live=false;o.g.visible=false}}
   for(const id of cave.switches)openGate(id);for(const r of robots)if(cave.killed.includes(r.id)){r.live=false;r.g.visible=false}
   if(free){openGate('power');openGate('exit');cave.stage=2;unlock('mark1')}
   B.enterCave();select(saved&&names[cave.character]&&has(cave.character)?cave.character:cave.stage>=1?'mark1':'tony',true);player.position.set(...cave.pos);player.position.y=0;B.hud();if(!saved&&!free)playCut('intro');saveCave();
 }
 function leaveCave(){if(area!=='cave')return;saveCave();if(caveRoot)caveRoot.removeFromParent();for(const [o,v] of hidden)o.visible=v;hidden=[];if(worldLook){scene.background=worldLook.background;scene.fog=worldLook.fog;for(const l of worldLook.lights){l.o.intensity=l.intensity;if(l.color)l.o.color.copy(l.color);if(l.ground)l.o.groundColor.copy(l.ground)}}area='workshop';meta.last='workshop';save();particles.length=0;beams.length=0;B.returnWorkshop();}
 function saveCave(){if(area!=='cave'||!cave)return save();cave.character=current;cave.pos=player.position.toArray();meta.cave=cave;meta.last='cave';return save()}
 function collide(oldX,oldZ){if(area!=='cave')return;const p=player.position;const blocked=(x,z)=>solids.some(o=>o.active&&Math.abs(x-o.x)<o.w/2+.28&&Math.abs(z-o.z)<o.d/2+.28);if(blocked(p.x,p.z)){if(!blocked(oldX,p.z))p.x=oldX;else if(!blocked(p.x,oldZ))p.z=oldZ;else{p.x=oldX;p.z=oldZ}}}
 const dialogue={
 'tony-01':['TONY STARK','Fantastycznie. Z luksusowego apartamentu do jaskini bez klimatyzacji.',5.303],
 'yinsen-01':['YINSEN','Tony, znalazłem kilka części. Może uda nam się zbudować coś, co pomoże nam stąd wyjść.',8.046],
 'tony-02':['TONY STARK','Daj mi trochę czasu. Stark Industries właśnie otwiera nowy oddział.',4.937],
 'tony-03':['TONY STARK','Nie jest elegancki, nie jest lekki i zdecydowanie nie jest gotowy do sprzedaży.',5.773],
 'yinsen-02':['YINSEN','Myślisz, że to naprawdę zadziała?',2.795],
 'tony-05':['TONY STARK','Mark I. Pierwszy prototyp. Nad wyglądem jeszcze popracujemy.',5.120],
 'tony-06':['TONY STARK','Zamknięte. Musi być gdzieś terminal.',4.154],
 'tony-07':['TONY STARK','Ciekawe, co ukryli za tą ścianą.',2.769],
 'tony-09':['TONY STARK','Koniec wycieczki. Następnym razem wybieram hotel.',4.284],
 'tony-10':['TONY STARK','Czas wrócić do warsztatu. Mam pomysł na znacznie lepszy pancerz.',5.355]};
 const sequences={intro:['tony-01','yinsen-01','tony-02'],armor:['tony-03','yinsen-02','tony-05'],outro:['tony-09','tony-10']};
 function speak(id,cinematic=false){const d=dialogue[id];if(!d)return;B.voice('cave',id,d[0],d[1]);voiceUntil=elapsed+d[2]+.5;if(cinematic){$('starkCutLine').textContent=d[0]+' — '+d[1]}else{B.notice(d[0]+': '+d[1]);$('caveDialogue').textContent=d[0]+': '+d[1];$('caveDialogue').classList.remove('hidden')}}
 function hintVoice(id){if(storyCut||spoken.has(id)||elapsed<voiceUntil)return;spoken.add(id);speak(id)}
 function playCut(which){B.stopVoice();$('caveDialogue').classList.add('hidden');storyCut={which,t:0,index:0,lineTime:0,origin:player.position.clone(),assembled:false};$('starkCut').classList.remove('hidden');document.body.classList.add('cinematic');$('starkCutTitle').textContent=which==='intro'?'01 · UCIECZKA Z JASKINI':which==='armor'?'01 · NARODZINY MARK I':'01 · POWRÓT DO DOMU';B.release();
 if(which==='armor'){player.position.set(6.4,.10,6.1);select('tony',true);if(yinsen){yinsen.position.set(8.1,.10,6.3);yinsen.rotation.y=-.45}}speak(sequences[which][0],true)}
 function finishStoryCut(){if(!storyCut)return;const c=storyCut;if(c.which==='armor'){select('mark1',true);player.position.set(6.4,.10,5.7)}else player.position.copy(c.origin);if(yinsen)yinsen.visible=c.which!=='outro';storyCut=null;$('starkCut').classList.add('hidden');document.body.classList.remove('cinematic');B.stopVoice();B.hud();saveCave();if(c.which==='outro'&&!free)leaveCave()}
 $('starkCutSkip').onclick=finishStoryCut;
 const target=new T.Vector3(),camDesired=new T.Vector3();
 function cutFrame(dt){if(!storyCut)return false;let c=storyCut;c.t+=dt;c.lineTime+=dt;const seq=sequences[c.which];if(c.lineTime>dialogue[seq[c.index]][2]+.45&&(!B.voiceBusy()||c.lineTime>dialogue[seq[c.index]][2]+7)){c.index++;c.lineTime=0;if(c.index>=seq.length){finishStoryCut();return true}speak(seq[c.index],true)}
  if(c.which==='armor'&&c.index===2&&!c.assembled){c.assembled=true;select('mark1',true);scatter(6.4,1,6.1,0x8e989e);B.sfx('power')}
  if(waypoint)waypoint.visible=false;const d=dialogue[seq[c.index]],speaker=d[0]==='YINSEN'&&yinsen?yinsen:model(),other=speaker===yinsen?model():yinsen;
  if(yinsen&&c.which==='intro'){yinsen.position.set(1.4,.10,9.7);player.position.set(0,.10,10.1);yinsen.rotation.y=-.35}
  const p=speaker===yinsen?yinsen.position:player.position,t=c.lineTime;
  const wide=c.index===0&&t<1.65,building=c.which==='armor'&&c.index===2,ending=c.which==='outro';
  const angle=wide?.52:speaker===yinsen?-.28:.34;
  const dist=wide?5.7:building?3.8:ending?4.4:2.85;
  target.set(p.x+(wide?.58:0),wide?1.28:building?1.29:1.77,p.z);
  cutLook.copy(target);camDesired.set(p.x+Math.sin(angle)*dist,wide?3.35:building?2.20:2.48+Math.sin(t*.45)*.07,p.z+Math.cos(angle)*dist);
  const shotKey=c.index+':'+wide+':'+building;
  if(c.shotKey!==shotKey){c.shotKey=shotKey;B.camera.position.copy(camDesired)}else B.camera.position.lerp(camDesired,1-Math.exp(-dt*8));
  B.camera.lookAt(target);B.camera.fov=wide?47:building?43:37;B.camera.updateProjectionMatrix();
  const u=speaker.userData,gesture=Math.sin(t*2.1),beat=Math.sin(t*3.7)*.5+.5;
  u.head.rotation.set(.045*Math.sin(t*3.2),.11*Math.sin(t*1.8),.027*gesture);
  u.arms[1].rotation.set(-.32-.20*gesture,0,.12+.05*beat);u.arms[0].rotation.x=-.10-.12*Math.sin(t*1.4);
  if(other?.userData?.head){other.userData.head.rotation.set(.045*Math.sin(c.t*2),speaker===yinsen?.28:-.28,0);other.userData.arms[1].rotation.x=-.08}
  return true;
 }
 function collect(o){o.live=false;o.g.visible=false;cave.collected.push(o.type+o.id);B.pickup();
   if(o.type==='part'){cave.parts.push(o.id);award(100);B.notice('CZĘŚCI '+cave.parts.length+'/6')}
   if(o.type==='mini'&&!meta.mini.includes(o.id)){meta.mini.push(o.id);award(250);B.notice('MINIZESTAW '+meta.mini.length+'/10');if(meta.mini.length===10)achievement('Komplet minizestawów')}
   if(o.type==='red'){meta.red=true;achievement('Czerwony klocek')}
   if(o.type==='gold'){if(!meta.caveDone&&!free){meta.gold++;meta.caveDone=true;achievement('Ucieczka z jaskini');award(1000)}cave.done=true;playCut('outro')}
   if(o.type==='stud')award(20);saveCave();B.hud()
 }
 function useCave(){const p=player.position;if(Math.hypot(p.x-7,p.z-7)<2.5&&cave.stage===0){if(cave.parts.length<6){B.notice('Zbierz wszystkie 6 części');return true}cave.stage=1;unlock('mark1');B.sfx('success');achievement('Mark I zbudowany');playCut('armor');saveCave();return true}
   const sw=switches.find(o=>Math.hypot(p.x-o.x,p.z-o.z)<1.9);if(sw){if(sw.id==='power'&&cave.stage<1){B.notice('Najpierw zbuduj Mark I');hintVoice('tony-06');return true}if(sw.id==='exit'&&!free&&cave.killed.length<2){B.notice('Pokonaj dwa roboty strażnicze');return true}if(sw.id==='secret'&&!free&&current!=='pepper'&&cave.stage<1){B.notice('Potrzebny pancerz lub Pepper');return true}if(!cave.switches.includes(sw.id)){if(sw.id==='secret')hintVoice('tony-07');cave.switches.push(sw.id);openGate(sw.id);if(sw.id==='exit')cave.stage=2;award(150);B.sfx('power');saveCave()}return true}
   return false
 }
 function scatter(x,y,z,color){for(let i=0;i<7;i++){let m=box(x,y,z,.15,.13,.17,color,caveRoot||workshop),a=i*2.4;particles.push({m,v:new T.Vector3(Math.cos(a)*2.8,2.2+(i%3)*.5,Math.sin(a)*2.8),life:.65})}}
 function hitRobot(r,amount){if(!r.live)return;r.hp-=amount;r.g.rotation.z=.16;B.sfx('metal');if(r.hp<=0){r.live=false;r.g.visible=false;cave.killed.push(r.id);scatter(r.g.position.x,.9,r.g.position.z,0x8a7866);award(180);for(let i=0;i<3;i++)pickup('stud','r'+r.id+'-'+i,r.g.position.x+Math.cos(i*2.1)*.6,r.g.position.z+Math.sin(i*2.1)*.6);saveCave()}}
 function attack(special=false){if(picker||storyCut||attackTime>0)return;combo=combo%3+1;attackTime=.27;B.hit(combo);if(area!=='cave')return;let range=special&&isArmor()?7:2.35,amount=current==='mark1'?2:1;if(special&&isArmor()){amount=current==='war'?3:2;const g=new T.Mesh(new T.SphereGeometry(.15,10,8),new T.MeshBasicMaterial({color:0x99e9ff}));g.position.copy(player.position).add(new T.Vector3(0,1.1,0));caveRoot.add(g);beams.push({g,v:new T.Vector3(Math.sin(player.rotation.y)*10,0,Math.cos(player.rotation.y)*10),life:.55});B.sfx('power')}
   const near=robots.filter(r=>r.live&&r.g.position.distanceTo(player.position)<range).sort((a,b)=>a.g.position.distanceTo(player.position)-b.g.position.distanceTo(player.position));if(near.length){hitRobot(near[0],amount);if(current==='war'&&special&&near[1])hitRobot(near[1],1)}B.hud()
 }
 function dodge(){if(dodgeTime>0||storyCut||picker)return;dodgeTime=.32;damageTime=.7;B.sfx('jump');}
 function update(dt){elapsed+=dt;if(area==='workshop')for(const e of extras)if(e.display)e.display.visible=Math.hypot(player.position.x-e.x,player.position.z-e.z)<14;if(elapsed>=voiceUntil)$('caveDialogue').classList.add('hidden');attackTime=Math.max(0,attackTime-dt);dodgeTime=Math.max(0,dodgeTime-dt);damageTime=Math.max(0,damageTime-dt);for(let h of holograms)h.rotation.y+=dt*.6;
   for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.life-=dt;p.v.y-=dt*9;p.m.position.addScaledVector(p.v,dt);p.m.rotation.x+=dt*5;if(p.life<=0){p.m.removeFromParent();particles.splice(i,1)}}
   for(let i=beams.length-1;i>=0;i--){let p=beams[i];p.life-=dt;p.g.position.addScaledVector(p.v,dt);if(p.life<=0){p.g.removeFromParent();beams.splice(i,1)}}
   if(area==='cave'&&cave){let p=player.position;if(waypoint){let dest;if(cave.stage===0){const remaining=items.filter(o=>o.live&&o.type==='part').sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));dest=remaining[0]||{x:7,z:7}}else if(cave.stage===1){dest=!cave.switches.includes('power')?{x:-7,z:6}:cave.killed.length<2?robots.filter(r=>r.live).sort((a,b)=>a.g.position.distanceTo(p)-b.g.position.distanceTo(p))[0]?.g.position:{x:7,z:-1}}else dest={x:0,z:-10};waypoint.visible=!!dest&&!cave.done;if(dest){waypoint.position.set(dest.x,.30+Math.sin(elapsed*4)*.045,dest.z);waypoint.rotation.y=elapsed*.65}}if(!gateMap.power?.open&&Math.hypot(p.x,p.z-3.1)<2.4)hintVoice('tony-06');if(Math.hypot(p.x+4,p.z+8)<2.0)hintVoice('tony-07');if(yinsen?.visible){yinsen.userData.head.rotation.y=.12*Math.sin(elapsed*.8);yinsen.userData.arms[0].rotation.x=.06*Math.sin(elapsed*1.8)}for(let o of items){if(!o.live)continue;o.g.rotation.y+=dt*1.7;o.g.position.y=.40+Math.sin(elapsed*2+o.x)*.09;if(Math.hypot(p.x-o.x,p.z-o.z)<.73&&p.y<1.2){if(o.type!=='gold'||cave.stage>=2||free)collect(o)}}
     for(let r of robots){if(!r.live)continue;r.cool=Math.max(0,r.cool-dt);let dx=p.x-r.g.position.x,dz=p.z-r.g.position.z,d=Math.hypot(dx,dz);r.g.rotation.z*=Math.exp(-dt*8);if(d<5&&d>1.15){let x=r.g.position.x,z=r.g.position.z;r.g.position.x+=dx/d*dt*1.18;r.g.position.z+=dz/d*dt*1.18;if(solids.some(o=>o.active&&Math.abs(r.g.position.x-o.x)<o.w/2+.28&&Math.abs(r.g.position.z-o.z)<o.d/2+.28)){r.g.position.x=x;r.g.position.z=z}r.g.rotation.y=Math.atan2(dx,dz);for(let i=0;i<2;i++){r.arms[i].rotation.x=Math.sin(elapsed*7+i*Math.PI)*.45;r.legs[i].rotation.x=-r.arms[i].rotation.x}}
       else if(d<1.25&&r.cool<=0&&!damageTime){r.cool=1.5;damageTime=.85;cave.hp--;B.notice('Utrata serduszka');if(cave.hp<=0){cave.hp=5;player.position.set(0,0,10);cave.score=Math.max(0,cave.score-100);B.notice('Odrodzenie')}B.hud()}}
   }
   if(dodgeTime>0){const m=model();m.rotation.z=Math.sin(dodgeTime/.32*Math.PI)*.38}
   hudClock+=dt;if(hudClock>.20){hudClock=0;B.hud()}
 }
 function hud(){if(area==='cave'&&cave){$('counter').textContent=String(cave.score).padStart(5,'0');$('obj').querySelector('small').textContent='MISJA 01 / JASKINIA';$('objective').textContent=cave.done?'ROZDZIAŁ UKOŃCZONY':cave.stage===0?'Części '+cave.parts.length+'/6 · zbuduj Mark I':cave.stage===1?(!cave.switches.includes('power')?'Uruchom zasilanie':cave.killed.length<2?'Roboty strażnicze '+cave.killed.length+'/2':'Otwórz bramę wyjściową'):'Dotrzyj do wyjścia';$('progressFill').style.width=(cave.done?100:cave.stage===0?cave.parts.length/6*45:cave.stage===1?65:85)+'%'}
   $('hero').textContent=names[current].toUpperCase();$('starkStats').textContent='MINI '+meta.mini.length+'/10 · ZŁOTE '+meta.gold+' · ×'+meta.mult+(area==='cave'?' · HP '+cave.hp:'')+' · '+percent()+'%';$('trueHeroFill').style.width=Math.min(100,(area==='cave'&&cave?cave.score:B.score())/30)+'%';
   if(meta.detector&&area==='cave'){let a=items.filter(o=>o.live&&o.type==='mini').sort((a,b)=>Math.hypot(a.x-player.position.x,a.z-player.position.z)-Math.hypot(b.x-player.position.x,b.z-player.position.z))[0];$('starkDetect').textContent=a?'MINIZESTAW: '+Math.round(Math.hypot(a.x-player.position.x,a.z-player.position.z))+' m · '+(a.z<player.position.z?'N':'S')+(a.x<player.position.x?'W':'E'):'MINIZESTAWY ZEBRANE'}else $('starkDetect').textContent='';
 }
 function chooseCave(mode,resume=false){if(mode&&!meta.caveDone){B.notice('Najpierw ukończ fabułę');return}makeCave(resume?meta.cave:null,mode)}
 $('caveStory').onclick=()=>chooseCave(false);$('caveFree').disabled=!meta.caveDone;$('caveFree').onclick=()=>chooseCave(true);$('starkChars').onclick=()=>{if(!storyCut)openPicker()};$('starkAttack').onclick=()=>attack(true);$('starkDodge').onclick=dodge;
 return {meta,select,model,syncBase,isArmor,canFly,area:()=>area,has,openPicker,closePicker,blocked:()=>picker||!!storyCut,cutFrame,update,hud,collide,award,saveCave,onWorkshopDone,action:()=>area==='cave'?(useCave()|| (attack(false),true)):useWorkshop(),attack,dodge,dodgeFactor:()=>dodgeTime>0?1.9:1,chooseCave,canResume:()=>meta.last==='cave'&&!!meta.cave,resume:()=>{if(meta.cave?.done&&!meta.cave?.mode){meta.last='workshop';save();B.returnWorkshop()}else chooseCave(!!meta.cave?.mode,true)},markWorkshop:()=>{meta.last='workshop';save()},isCut:()=>!!storyCut,finishStoryCut,occlude,replayVoice:()=>{if(storyCut){storyCut.lineTime=0;speak(sequences[storyCut.which][storyCut.index],true)}}};
}
