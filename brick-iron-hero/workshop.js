function dressWorkshop(T, scene, renderer, parts) {
  const {box,cylinder,mat,glow,brick,geo}=parts;
  function group(x,y,z){const g=new T.Group();g.position.set(x,y,z);scene.add(g);return g;}
  function panel(label,sub,w,h,x,y,z,parent=scene){
    const canvas=document.createElement('canvas'); canvas.width=1024;canvas.height=256;
    const q=canvas.getContext('2d');
    q.fillStyle='#182b3d';q.fillRect(0,0,1024,256);q.fillStyle='#fab640';q.fillRect(0,0,16,256);
    q.fillStyle='#ecf3f2';q.font='italic 900 112px system-ui';q.fillText(label,50,131,922);
    q.fillStyle='#79cddd';q.font='700 47px monospace';q.fillText(sub,54,210,900);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:texture,roughness:.44,emissive:0xffffff,emissiveMap:texture,emissiveIntensity:.19}));
    m.position.set(x,y,z);parent.add(m);return m;
  }
  const steel=0x334856,yellow=0xe8ad3b,blue=0x193c51,orange=0xda5c24;
  for(const x of [-8.8,8.8])for(let j=0;j<7;j++){let z=-8+j*2.55;box(x,.15,z,.52,.045,2.22,0x476173);box(x,.178,z,.40,.018,1.88,0x718e9d);for(let k=0;k<3;k++)cylinder(x,.21,z-.64+k*.64,.10,.055,0x90a8b2);}
  for(let j=0;j<5;j++){const z=-7+j*3.3;box(-11.1,1.36,z,.18,1.12,1.85,0x335668);glow(-10.99,1.63,z,.035,.095,1.32,0x76cae9,scene);}
  // Workshop gantry with bolted frames, a glazed clerestory and light bars.
  box(0,5.72,-11.45,25,.36,.72,steel);box(0,3.57,-11.12,24.8,.15,.38,0xb87626);
  for(const x of [-11.5,-7.7,-3.85,0,3.85,7.7,11.5]){
    box(x,3.1,-11.04,.27,5.45,.38,steel);
    box(x,5.28,-10.94,.58,.22,.5,orange);
    for(const y of [1.38,3.58,5.12]){const rivet=cylinder(x,y,-10.79,.065,.04,0x899bab);rivet.rotation.x=Math.PI/2;}
    if(x<11){box(x+1.83,4.65,-11.32,3.42,1.55,.11,0x4b879e);box(x+1.83,4.72,-11.22,3.4,.08,.11,steel);box(x+1.83,4.62,-11.15,.065,1.46,.08,steel);}
  }
  box(0,4.42,-10.95,5.4,1.33,.32,0x162938);panel('STARK','I N D U S T R I E S',5.15,1.17,0,4.43,-10.77);
  for(const x of [-7.8,7.8]){
    box(x,5.9,-7.8,.40,.4,7.75,steel);
    for(const z of [-9.35,-6.4]){box(x,5.5,z,2.2,.17,.63,0x344c5b);glow(x,5.39,z,1.98,.055,.44,0xffde92,scene);}
  }
  // Printed hazard tiles mark the assembly bay and line the hangar floor.
  for(let i=0;i<14;i++){
    const marker=box(4.11+i*.43,.122,-3.38,.23,.035,.45,i%2?0xe4a534:0x263849);marker.rotation.y=-.40;
  }
  for(const x of [-8.48,8.48]){
    box(x,.122,2,.075,.023,17,0xe0b04d);
    for(const z of [-5,-1,3,7]){box(x,.133,z,.35,.032,1.0,0x273b4b);glow(x,.154,z,.13,.019,.76,0x94d5df,scene);}
  }
  // Rolling drawer units and red tool walls.
  const toolBay=group(-5,0,-9.05);
  box(0,2.48,0,3.55,1.51,.22,0x923b2d,toolBay);box(0,1.52,.48,3.67,.19,1.15,0xabb6be,toolBay);
  for(let i=0;i<3;i++){box(-.91,.56+i*.30,.42,1.49,.26,.97,0xa5382d,toolBay);box(-.91,.60+i*.30,.93,.82,.055,.07,0x374955,toolBay);}
  for(let i=0;i<5;i++){const x=-1.23+i*.57;
    box(x,2.35,.175,.08,.55,.08,0x96a4ad,toolBay);const wrench=cylinder(x,2.67,.18,.105,.08,0xa5b3ba,toolBay);wrench.rotation.x=Math.PI/2;
  }
  panel('01','MONTAŻ • MARK III',2.42,.68,7.10,2.42,-10.54);
  for(const x of [4,10]){
    box(x,.55,-7.98,.83,.91,.80,0x293c4c);brick(x,1.05,-7.98,.82,.13,.8,yellow);
  }
  // A brick-built roadster on the lift in the side bay.
  const lift=group(-9.02,.15,-2.95);
  box(0,.32,0,1.88,.15,3.74,0x3b515c,lift);
  for(const z of [-1.04,1.04]){const beam=box(0,.13,z,.15,.46,.20,yellow,lift);beam.rotation.z=-.37;}
  const car=new T.Group();car.position.y=.42;lift.add(car);
  const lacquer=0xbe302b;
  box(0,.38,0,1.17,.22,2.83,0x242d38,car);
  for(const z of [-.95,.97])for(const side of [-1,1]){
    const tire=cylinder(side*.70,.32,z,.31,.225,0x20232a,car);tire.rotation.z=Math.PI/2;
    const cap=cylinder(side*.82,.32,z,.165,.030,0xb9c3c6,car,.35);cap.rotation.z=Math.PI/2;
  }
  brick(0,.52,0,1.34,.21,2.78,lacquer,car);
  for(const s of [-1,1]){box(s*.61,.74,0,.18,.26,1.82,lacquer,car);box(s*.48,.74,1.38,.26,.15,.10,0xffe2a7,car);}
  const hood=box(0,.745,.96,1.18,.17,.81,lacquer,car);hood.rotation.x=.10;
  box(0,.71,-1.08,1.23,.16,.57,lacquer,car);box(0,.48,1.44,.81,.11,.075,0x202d38,car);
  const glass=box(0,.91,.43,1.01,.36,.10,0x62a8bf,car,.23);glass.rotation.x=-.40;
  for(const s of [-1,1]){const seat=box(s*.27,.85,-.32,.38,.38,.16,0x342a2e,car);seat.rotation.x=-.16;}
  function rig(x,side){
    const base=group(x,.26,-7.43);
    cylinder(0,.1,0,.51,.25,steel,base);cylinder(0,.34,0,.34,.24,yellow,base);
    const shoulder=new T.Group();shoulder.position.y=.48;base.add(shoulder);
    const elbow=new T.Group();elbow.position.y=1.12;shoulder.add(elbow);
    function link(parent,len,w){
      box(0,len*.5,0,w,len,.25,yellow,parent);
      box(0,len*.5,.145,w*.46,len*.74,.048,0x293a46,parent);
      for(const s of [-1,1]){const hub=cylinder(0,0,s*.15,w*.79,.11,steel,parent);hub.rotation.x=Math.PI/2;}
    }
    link(shoulder,1.12,.26);link(elbow,.84,.21);
    const tool=new T.Group();tool.position.y=.85;elbow.add(tool);box(0,.12,0,.25,.28,.23,steel,tool);
    for(const s of [-1,1]){const claw=box(s*.115,.31,0,.06,.25,.12,0xc6c6af,tool);claw.rotation.z=s*.19;}
    const tip=glow(0,.29,.03,.075,.12,.095,0x94e4ff,tool);
    return {side,shoulder,elbow,tool,tip};
  }
  const rigs=[rig(5.59,-1),rig(8.41,1)];
  function poseRigs(progress=0,active=false){
    for(const {side,shoulder,elbow,tool,tip} of rigs){
      const reach=active?Math.sin(progress*Math.PI):0;
      shoulder.rotation.z=side*(.46+.56*reach);shoulder.rotation.x=.10+.24*reach;
      elbow.rotation.z=side*(.89-.28*reach);
      tool.rotation.z=-side*(1.15+.30*reach);tip.visible=active;
    }
  }
  poseRigs();
  // Batch rigid scenery by geometry and material. Articulated arms stay separate.
  const movable=new Set(rigs.map(r=>r.shoulder.parent));
  const staticMeshes=[];
  for(const child of scene.children){
    if(movable.has(child)||child.isLight||child.isInstancedMesh)continue;
    child.updateWorldMatrix(true,true);
    child.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&!Array.isArray(o.material))staticMeshes.push(o);});
  }
  const buckets=new Map();
  for(const m of staticMeshes){
    const key=m.geometry.uuid+'|'+m.material.uuid;
    if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(m);
  }
  for(const src of buckets.values()){
    if(src.length<3)continue;
    const inst=new T.InstancedMesh(src[0].geometry,src[0].material,src.length);
    inst.castShadow=src[0].castShadow;inst.receiveShadow=true;
    src.forEach((m,i)=>{inst.setMatrixAt(i,m.matrixWorld);m.removeFromParent();});
    inst.computeBoundingSphere();scene.add(inst);
  }
  return poseRigs;
}

function workshopLighting(T,scene,renderer){
  // A small studio reflection map gives glossy ABS and printed tiles visible highlights.
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
  const q=canvas.getContext('2d'),gr=q.createLinearGradient(0,0,0,128);
  gr.addColorStop(0,'#8aa5b9');gr.addColorStop(.42,'#a6b7ba');gr.addColorStop(.52,'#52677b');gr.addColorStop(.80,'#304353');gr.addColorStop(1,'#445064');q.fillStyle=gr;q.fillRect(0,0,256,128);
  q.fillStyle='#fff2d9';q.fillRect(17,29,38,19);q.fillStyle='#e1f6ff';q.fillRect(137,33,12,38);q.fillRect(183,25,34,8);
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.mapping=T.EquirectangularReflectionMapping;
  const gen=new T.PMREMGenerator(renderer);const env=gen.fromEquirectangular(tex);scene.environment=env.texture;tex.dispose();gen.dispose();
  const rim=new T.DirectionalLight(0xc0efff,1.46);rim.position.set(6,7,-9);scene.add(rim);
}
