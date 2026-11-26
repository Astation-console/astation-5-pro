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
 const workshop=new T.Group();scene.add(workshop);let caveRoot=null,hidden=[],extras=[],holograms=[],particles=[],beams=[];
 function getModel(id){if(!models[id]){models[id]=figure.variant(id);models[id].visible=false;player.add(models[id])}return models[id]}
 function has(id){return meta.unlocked.includes(id)}
 function unlock(id){if(!has(id)){meta.unlocked.push(id);achievement('Postać: '+names[id]);save()}}
 function achievement(name){if(!meta.ach.includes(name)){meta.ach.push(name);B.notice('OSIĄGNIĘCIE: '+name);save()}}
 function award(n){const value=n*meta.mult;meta.wallet+=value;if(area==='cave'&&cave)cave.score+=value;else B.addScore(value);if(meta.wallet>=1000)achievement('Pierwszy tysiąc');save();return value}
 function select(id,force=false){if(!names[id]||(!force&&!has(id)))return false;const next=getModel(id);Object.values(models).forEach(m=>m.visible=false);B.reset(next);next.visible=true;current=id;B.setArmor(isArmor(),false);B.hud();return true}
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
   const colors=[0x686b6b,0xa7b1bc,0xb42232,0x39424b],color=colors[i],visor=i===2?0xd6a847:0x9eafb8;
   const bust=group(g,0,.50,0);
   const torso=new T.Mesh(new T.CylinderGeometry(.35,.46,.74,4),mat(color,.25));torso.rotation.y=Math.PI/4;torso.position.y=1.0;bust.add(torso);
   const helmet=new T.Mesh(new T.SphereGeometry(.37,16,12),mat(color,.25));helmet.scale.set(1,1.06,.86);helmet.position.y=1.72;bust.add(helmet);
   box(0,1.72,.29,.47,.38,.11,visor,bust,.3);glow(0,1.78,.36,.36,.05,.02,0x94eaff,bust);
   for(const side of [-1,1]){const arm=cylinder(side*.49,1.03,0,.13,.57,color,bust,.2);arm.rotation.z=side*.16;box(side*.22,.35,0,.36,.60,.40,color,bust,.2)}
   label(g,names[id].replace('Iron Man ','').toUpperCase(),0,2.75,.13,1.45);batchRigid(g);
   extras.push({type:'suit',id,g,x,z,range:1.65});
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
   for(const id of Object.keys(names)){const b=document.createElement('button');b.className='starkChar';let unlocked=has(id);b.textContent=names[id]+' · '+(unlocked?'WYBIERZ':prices[id]?'KUP '+prices[id]:'ZABLOKOWANY');const small=document.createElement('small');small.textContent=skills[id];b.append(small);b.disabled=!unlocked&&(!prices[id]||meta.wallet<prices[id]);b.onclick=()=>{if(!has(id)){meta.wallet-=prices[id];unlock(id)}select(id);closePicker();save()};$('characterList').append(b)}
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
   if(o.type==='terminal'){if(current==='pepper'){award(100);achievement('Dostęp administracyjny')}openPicker()}
   if(o.type==='build'){meta.workBuilt=true;build.visible=false;buildFinished.visible=true;award(250);achievement('Mistrz budowania');B.sfx('success')}
   if(o.type==='break'){o.g.visible=false;meta.workBroken.push(o.id);scatter(o.x,.7,o.z,0xe9b955);for(let i=0;i<4;i++)B.stud(o.x+Math.cos(i*1.57)*.7,o.z+Math.sin(i*1.57)*.7);save()}
   return true;
 }
 // Cave: authored chamber layout, interactive gates, ten collectible kits.
 const solids=[],items=[],robots=[],switches=[],gateMap={};
 function rock(parent,x,z,w,h,d,color=0x665f5c){const m=new T.Mesh(new T.DodecahedronGeometry(1,0),mat(color));m.position.set(x,h*.46,z);m.scale.set(w,h*.56,d);m.rotation.y=(x+z)*.71;parent.add(m);return m}
 function wall(x,z,w,d,h=2.9){box(x,h/2,z,w,h,d,0x4b4446,caveRoot);solids.push({x,z,w,d,active:true});for(let i=0;i<Math.ceil(Math.max(w,d)/2);i++){let f=(i+.5)/Math.ceil(Math.max(w,d)/2)-.5;rock(caveRoot,x+f*w,z+f*d,.85,1.4,.75,0x62585a)}}
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
   area='cave';free=mode;meta.last='cave';caveRoot=new T.Group();
   hidden=scene.children.filter(o=>!o.isLight&&o!==player&&!B.persistent(o)).map(o=>[o,o.visible]);for(const [o] of hidden)o.visible=false;scene.add(caveRoot);
   scene.background=new T.Color(0x282531);scene.fog=new T.Fog(0x282531,16,43);
   cave={stage:0,parts:[],switches:[],killed:[],collected:[],score:0,hp:5,done:false,pos:[0,0,10],mode:free};if(saved)cave={...cave,...saved,mode:free};
   box(0,-.27,0,25,.72,25,0x655b56,caveRoot);
   for(let i=0;i<12;i++){let x=-11+i*2;rock(caveRoot,x,-11.7,1.3,4.8,.9);rock(caveRoot,x,11.7,1.3,3.8,.9)}
   for(let i=0;i<12;i++){let z=-11+i*2;rock(caveRoot,-11.7,z,.9,4.5,1.3);rock(caveRoot,11.7,z,.9,4.5,1.3)}
   wall(-6.6,3.1,9,.7);wall(6.6,3.1,9,.7);gate('power',0,3.1,4.0);
   wall(-6.8,-3.6,8.6,.7);wall(6.8,-3.6,8.6,.7);gate('exit',0,-3.6,4.2);
   wall(-6,-7.2,.65,5.4);wall(-8.7,-4.7,5.8,.65);gate('secret',-6,-10,1.6);
   for(let i=0;i<10;i++){const x=-10+(i%5)*5,z=8-Math.floor(i/5)*12;const lamp=group(caveRoot,x,0,z);box(0,1.1,0,.12,2.2,.12,0x4b4947,lamp);glow(0,2.16,0,.28,.28,.28,0xe9a34f,lamp)}
   const table=group(caveRoot,7,0,7);brick(0,.44,0,2.2,.86,1.5,0x525660,table);label(table,'MARK I · MONTAŻ',0,1.75,0,2.25);addHolo(table,0,2.1,0);
   terminal('power',-7,6);terminal('exit',7,-1);terminal('secret',-4,-8);
   [[-8,9],[-4,5],[1,7],[4,9],[8,5],[9,10]].forEach((p,i)=>pickup('part',i,...p));
   [[-9,10],[-1,9],[9,8],[-9,5],[3,5],[-8,0],[8,0],[0,-1],[9,-9],[-9,-9]].forEach((p,i)=>pickup('mini',i,...p));
   pickup('red',0,-9,-7);pickup('gold',0,0,-10);
   [[-5,-.4],[4,0],[8,-7],[-1,-8]].forEach((p,i)=>enemy(i,...p));
   for(const o of items){if(cave.collected.includes(o.type+o.id)||o.type==='mini'&&meta.mini.includes(o.id)||o.type==='red'&&meta.red){o.live=false;o.g.visible=false}}
   for(const id of cave.switches)openGate(id);for(const r of robots)if(cave.killed.includes(r.id)){r.live=false;r.g.visible=false}
   if(free){openGate('power');openGate('exit');cave.stage=2;unlock('mark1')}
   B.enterCave();select(cave.stage>=1?'mark1':'tony',true);player.position.set(...cave.pos);player.position.y=0;B.hud();if(!saved&&!free)playCut('intro');saveCave();
 }
 function saveCave(){if(area!=='cave'||!cave)return save();cave.pos=player.position.toArray();meta.cave=cave;meta.last='cave';return save()}
 function collide(oldX,oldZ){if(area!=='cave')return;const p=player.position;for(const o of solids)if(o.active&&Math.abs(p.x-o.x)<o.w/2+.36&&Math.abs(p.z-o.z)<o.d/2+.36){p.x=oldX;p.z=oldZ;break}}
 function playCut(which){storyCut={which,t:0};$('starkCut').classList.remove('hidden');$('starkCutTitle').textContent=which==='intro'?'02 · UCIECZKA Z JASKINI':'02 · WOLNOŚĆ';$('starkCutLine').textContent=which==='intro'?'Tony: Muszę zbudować pancerz i znaleźć wyjście.':'Tony: Udało się. To dopiero początek.';B.release();if(which==='intro')B.voice('intro',1,'TONY STARK','Świetnie. Tylko gdzie podziały się moje części?');else B.voice('outro',1,'TONY STARK','Nieźle. Następnym razem ustawmy poprzeczkę wyżej.')}
 function finishStoryCut(){storyCut=null;$('starkCut').classList.add('hidden');B.stopVoice();B.hud();saveCave()}
 $('starkCutSkip').onclick=finishStoryCut;
 function cutFrame(dt){if(!storyCut)return false;storyCut.t+=dt;let t=storyCut.t,p=player.position;const a=.45+Math.sin(t*.45)*.25;B.camera.position.set(p.x+Math.sin(a)*4.4,2.5+Math.sin(t*.5)*.25,p.z+Math.cos(a)*4.4);B.camera.lookAt(p.x,1.1,p.z);if(t>7)finishStoryCut();return true}
 function collect(o){o.live=false;o.g.visible=false;cave.collected.push(o.type+o.id);B.pickup();
   if(o.type==='part'){cave.parts.push(o.id);award(100);B.notice('CZĘŚCI '+cave.parts.length+'/6')}
   if(o.type==='mini'&&!meta.mini.includes(o.id)){meta.mini.push(o.id);award(250);B.notice('MINIZESTAW '+meta.mini.length+'/10');if(meta.mini.length===10)achievement('Komplet minizestawów')}
   if(o.type==='red'){meta.red=true;achievement('Czerwony klocek')}
   if(o.type==='gold'){if(!meta.caveDone&&!free){meta.gold++;meta.caveDone=true;achievement('Ucieczka z jaskini');award(1000)}cave.done=true;playCut('outro')}
   if(o.type==='stud')award(20);saveCave();B.hud()
 }
 function useCave(){const p=player.position;if(Math.hypot(p.x-7,p.z-7)<2.5&&cave.stage===0){if(cave.parts.length<6){B.notice('Zbierz wszystkie 6 części');return true}cave.stage=1;unlock('mark1');select('mark1',true);scatter(7,1,7,0xaab1b4);B.sfx('success');achievement('Mark I zbudowany');saveCave();return true}
   const sw=switches.find(o=>Math.hypot(p.x-o.x,p.z-o.z)<1.9);if(sw){if(sw.id==='power'&&cave.stage<1){B.notice('Najpierw zbuduj Mark I');return true}if(sw.id==='exit'&&!free&&cave.killed.length<2){B.notice('Pokonaj dwa roboty strażnicze');return true}if(sw.id==='secret'&&!free&&current!=='pepper'&&cave.stage<1){B.notice('Potrzebny pancerz lub Pepper');return true}if(!cave.switches.includes(sw.id)){cave.switches.push(sw.id);openGate(sw.id);if(sw.id==='exit')cave.stage=2;award(150);B.sfx('power');saveCave()}return true}
   return false
 }
 function scatter(x,y,z,color){for(let i=0;i<7;i++){let m=box(x,y,z,.15,.13,.17,color,caveRoot||workshop),a=i*2.4;particles.push({m,v:new T.Vector3(Math.cos(a)*2.8,2.2+(i%3)*.5,Math.sin(a)*2.8),life:.65})}}
 function hitRobot(r,amount){if(!r.live)return;r.hp-=amount;r.g.rotation.z=.16;B.sfx('metal');if(r.hp<=0){r.live=false;r.g.visible=false;cave.killed.push(r.id);scatter(r.g.position.x,.9,r.g.position.z,0x8a7866);award(180);for(let i=0;i<3;i++)pickup('stud','r'+r.id+'-'+i,r.g.position.x+Math.cos(i*2.1)*.6,r.g.position.z+Math.sin(i*2.1)*.6);saveCave()}}
 function attack(special=false){if(picker||storyCut||attackTime>0)return;combo=combo%3+1;attackTime=.27;B.hit(combo);if(area!=='cave')return;let range=special&&isArmor()?7:2.35,amount=current==='mark1'?2:1;if(special&&isArmor()){amount=current==='war'?3:2;const g=new T.Mesh(new T.SphereGeometry(.15,10,8),new T.MeshBasicMaterial({color:0x99e9ff}));g.position.copy(player.position).add(new T.Vector3(0,1.1,0));caveRoot.add(g);beams.push({g,v:new T.Vector3(Math.sin(player.rotation.y)*10,0,Math.cos(player.rotation.y)*10),life:.55});B.sfx('power')}
   const near=robots.filter(r=>r.live&&r.g.position.distanceTo(player.position)<range).sort((a,b)=>a.g.position.distanceTo(player.position)-b.g.position.distanceTo(player.position));if(near.length){hitRobot(near[0],amount);if(current==='war'&&special&&near[1])hitRobot(near[1],1)}B.hud()
 }
 function dodge(){if(dodgeTime>0||storyCut||picker)return;dodgeTime=.32;damageTime=.7;B.sfx('jump');}
 function update(dt){elapsed+=dt;attackTime=Math.max(0,attackTime-dt);dodgeTime=Math.max(0,dodgeTime-dt);damageTime=Math.max(0,damageTime-dt);for(let h of holograms)h.rotation.y+=dt*.6;
   for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.life-=dt;p.v.y-=dt*9;p.m.position.addScaledVector(p.v,dt);p.m.rotation.x+=dt*5;if(p.life<=0){p.m.removeFromParent();particles.splice(i,1)}}
   for(let i=beams.length-1;i>=0;i--){let p=beams[i];p.life-=dt;p.g.position.addScaledVector(p.v,dt);if(p.life<=0){p.g.removeFromParent();beams.splice(i,1)}}
   if(area==='cave'&&cave){let p=player.position;for(let o of items){if(!o.live)continue;o.g.rotation.y+=dt*1.7;o.g.position.y=.40+Math.sin(elapsed*2+o.x)*.09;if(Math.hypot(p.x-o.x,p.z-o.z)<.73&&p.y<1.2){if(o.type!=='gold'||cave.stage>=2||free)collect(o)}}
     for(let r of robots){if(!r.live)continue;r.cool=Math.max(0,r.cool-dt);let dx=p.x-r.g.position.x,dz=p.z-r.g.position.z,d=Math.hypot(dx,dz);r.g.rotation.z*=Math.exp(-dt*8);if(d<5&&d>1.15){let x=r.g.position.x,z=r.g.position.z;r.g.position.x+=dx/d*dt*1.18;r.g.position.z+=dz/d*dt*1.18;if(solids.some(o=>o.active&&Math.abs(r.g.position.x-o.x)<o.w/2+.28&&Math.abs(r.g.position.z-o.z)<o.d/2+.28)){r.g.position.x=x;r.g.position.z=z}r.g.rotation.y=Math.atan2(dx,dz);for(let i=0;i<2;i++){r.arms[i].rotation.x=Math.sin(elapsed*7+i*Math.PI)*.45;r.legs[i].rotation.x=-r.arms[i].rotation.x}}
       else if(d<1.25&&r.cool<=0&&!damageTime){r.cool=1.5;damageTime=.85;cave.hp--;B.notice('Utrata serduszka');if(cave.hp<=0){cave.hp=5;player.position.set(0,0,10);cave.score=Math.max(0,cave.score-100);B.notice('Odrodzenie')}B.hud()}}
   }
   if(dodgeTime>0){const m=model();m.rotation.z=Math.sin(dodgeTime/.32*Math.PI)*.38}
   hudClock+=dt;if(hudClock>.20){hudClock=0;B.hud()}
 }
 function hud(){if(area==='cave'&&cave){$('counter').textContent=String(cave.score).padStart(5,'0');$('obj').querySelector('small').textContent='MISJA 02 / JASKINIA';$('objective').textContent=cave.done?'ROZDZIAŁ UKOŃCZONY':cave.stage===0?'Części '+cave.parts.length+'/6 · zbuduj Mark I':cave.stage===1?'Uruchom terminale · roboty '+Math.min(2,cave.killed.length)+'/2':'Dotrzyj do złotego klocka';$('progressFill').style.width=(cave.done?100:cave.stage===0?cave.parts.length/6*45:cave.stage===1?65:85)+'%'}
   $('hero').textContent=names[current].toUpperCase();$('starkStats').textContent='MINI '+meta.mini.length+'/10 · ZŁOTE '+meta.gold+' · ×'+meta.mult+(area==='cave'?' · HP '+cave.hp:'')+' · '+percent()+'%';$('trueHeroFill').style.width=Math.min(100,(area==='cave'&&cave?cave.score:B.score())/30)+'%';
   if(meta.detector&&area==='cave'){let a=items.filter(o=>o.live&&o.type==='mini').sort((a,b)=>Math.hypot(a.x-player.position.x,a.z-player.position.z)-Math.hypot(b.x-player.position.x,b.z-player.position.z))[0];$('starkDetect').textContent=a?'MINIZESTAW: '+Math.round(Math.hypot(a.x-player.position.x,a.z-player.position.z))+' m · '+(a.z<player.position.z?'N':'S')+(a.x<player.position.x?'W':'E'):'MINIZESTAWY ZEBRANE'}else $('starkDetect').textContent='';
 }
 function chooseCave(mode,resume=false){if(mode&&!meta.caveDone){B.notice('Najpierw ukończ fabułę');return}makeCave(resume?meta.cave:null,mode)}
 $('caveStory').onclick=()=>chooseCave(false);$('caveFree').disabled=!meta.caveDone;$('caveFree').onclick=()=>chooseCave(true);$('starkChars').onclick=()=>{if(!storyCut)openPicker()};$('starkAttack').onclick=()=>attack(true);$('starkDodge').onclick=dodge;
 return {meta,select,model,syncBase,isArmor,canFly,area:()=>area,has,openPicker,closePicker,blocked:()=>picker||!!storyCut,cutFrame,update,hud,collide,award,saveCave,onWorkshopDone,action:()=>area==='cave'?(useCave()|| (attack(false),true)):useWorkshop(),attack,dodge,dodgeFactor:()=>dodgeTime>0?1.9:1,chooseCave,canResume:()=>meta.last==='cave'&&!!meta.cave,resume:()=>chooseCave(!!meta.cave?.mode,true),markWorkshop:()=>{meta.last='workshop';save()},isCut:()=>!!storyCut,finishStoryCut};
}
