// Molded parts have their own pivots; only the surfaces facing the camera carry a print.
function buildMinifigureFactory(T, renderer, mat) {
  const loader = new T.TextureLoader();
  const mobileGPU=matchMedia('(pointer:coarse)').matches||/iPhone|iPad|Android/i.test(navigator.userAgent);
  // Individual molded ABS materials, rather than one material shared with scenery.
  const plasticCache=new Map();
  function abs(color,rough=.26,metal=0,coat=.64){
    const key=[color,rough,metal,coat].join(':');
    if(!plasticCache.has(key))plasticCache.set(key,(mobileGPU?new T.MeshStandardMaterial({color,roughness:Math.max(.23,rough),metalness:metal,envMapIntensity:.9}):new T.MeshPhysicalMaterial({color,roughness:rough,metalness:metal,clearcoat:coat,clearcoatRoughness:.23,envMapIntensity:.9})));
    return plasticCache.get(key);
  }
  const goldMask=abs(0xdcb14f,.26,.32,.73),goldEdge=abs(0xf2ce79,.25,.28,.74),darkGold=abs(0x8d642e,.39,.36,.35),maskInk=abs(0x211c24,.42,.1,.32);
  const eyeMaterial=new T.MeshStandardMaterial({color:0xe1f9ff,emissive:0x8bddff,emissiveIntensity:.92,roughness:.24});
  const helmetRows=[[-.269,.285,.28],[-.23,.349,.325],[-.09,.372,.337],[.065,.372,.345],[.215,.374,.354],[.365,.361,.35],[.48,.335,.304],[.52,.258,.23],[.535,.13,.13]];
  function helmetDepth(x,y){let i=1;while(i<helmetRows.length-1&&y>helmetRows[i][0])i++;let a=helmetRows[i-1],b=helmetRows[i],t=T.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1),rx=T.MathUtils.lerp(a[1],b[1],t),rz=T.MathUtils.lerp(a[2],b[2],t);return rz*Math.pow(Math.max(.002,1-Math.pow(Math.min(.999,Math.abs(x)/rx),2/.53)),.53/2);}
  // Subdivide and project an outlined polygon onto the actual curved helmet,
  // rather than placing a flat photograph on its front.
  function curvedPatch(parent,points,material,offset=.012,depthFn=helmetDepth,subdiv=3){
    const outline=points.map(p=>new T.Vector2(...p)),faces=T.ShapeUtils.triangulateShape(outline,[]),positions=[],normals=[];
    const mid=(a,b)=>new T.Vector2((a.x+b.x)*.5,(a.y+b.y)*.5);
    const write=p=>{const x=p.x,y=p.y,e=.0015;positions.push(x,y,depthFn(x,y)+offset);let dx=(depthFn(x+e,y)-depthFn(x-e,y))/(2*e),dy=(depthFn(x,y+e)-depthFn(x,y-e))/(2*e),n=new T.Vector3(-dx,-dy,1).normalize();normals.push(n.x,n.y,n.z)};
    function tri(a,b,c,k){if(k>0){const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);tri(a,ab,ca,k-1);tri(ab,b,bc,k-1);tri(ca,bc,c,k-1);tri(ab,bc,ca,k-1);return;}if((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)<0){const tmp=b;b=c;c=tmp}write(a);write(b);write(c)}
    for(const [a,b,c] of faces)tri(outline[a],outline[b],outline[c],subdiv);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));const m=piece(parent,g,material);m.castShadow=false;return m;
  }
  function faceplate(parent){
    const face=[[-.289,.384],[-.230,.468],[-.125,.490],[-.107,.345],[.107,.345],[.125,.490],[.230,.468],[.289,.384],[.319,.267],[.315,.115],[.289,.039],[.228,-.087],[.203,-.173],[.116,-.194],[.058,-.158],[-.058,-.158],[-.116,-.194],[-.203,-.173],[-.228,-.087],[-.289,.039],[-.315,.115],[-.319,.267]];
    curvedPatch(parent,face,maskInk,.006);
    curvedPatch(parent,face.map(([x,y])=>[x*.983,(y-.14)*.979+.14]),goldMask,.022);
    for(const side of [-1,1]){
      const mirror=p=>p.map(([x,y])=>[side*x,y]);
      curvedPatch(parent,mirror([[.116,.466],[.222,.448],[.275,.377],[.304,.276],[.291,.275],[.253,.374],[.207,.429],[.122,.447]]),goldEdge,.022);
      curvedPatch(parent,mirror([[.050,.222],[.265,.245],[.273,.209],[.254,.148],[.070,.145],[.050,.171]]),maskInk,.031);
      curvedPatch(parent,mirror([[.069,.203],[.251,.224],[.249,.185],[.229,.167],[.085,.162],[.069,.179]]),eyeMaterial,.044);
      curvedPatch(parent,mirror([[.293,.107],[.269,.033],[.218,-.058],[.196,-.134],[.162,-.143],[.185,-.056],[.239,.038],[.274,.104]]),darkGold,.024);
      curvedPatch(parent,mirror([[.098,-.153],[.159,-.164],[.193,-.149],[.203,-.115],[.184,-.106],[.162,-.135],[.105,-.135]]),goldEdge,.027);
    }
    curvedPatch(parent,[[-.093,-.092],[-.058,-.108],[.058,-.108],[.093,-.092],[.085,-.116],[.052,-.13],[-.052,-.13],[-.085,-.116]],darkGold,.026);
  }
  // Original high-resolution vector-style ink: each molded part has its own UV space.
  // The old source-photo atlases are no longer used by the playable figures.
  function makeInk(draw,baseColor){
    const c=document.createElement('canvas');c.width=c.height=512;const q=c.getContext('2d');
    q.scale(512,512);q.lineJoin='round';q.lineCap='round';
    q.fillStyle=baseColor;q.fillRect(0,0,1,1);
    const path=(p,fill,stroke,w=.013)=>{q.beginPath();for(let i=0;i<p.length;i++)i?q.lineTo(...p[i]):q.moveTo(...p[i]);if(fill){q.closePath();q.fillStyle=fill;q.fill()}if(stroke){q.strokeStyle=stroke;q.lineWidth=w;q.stroke()}};
    const oval=(x,y,rx,ry,fill,stroke,w=.012)=>{q.beginPath();q.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){q.fillStyle=fill;q.fill()}if(stroke){q.strokeStyle=stroke;q.lineWidth=w;q.stroke()}};
    const mirrored=(p,fill,stroke,w)=>{path(p,fill,stroke,w);path(p.map(([x,y])=>[1-x,y]),fill,stroke,w)};
    draw(q,path,oval,mirrored);
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    return {width:1,height:1,normalized:true,material:new T.MeshPhysicalMaterial({map,roughness:.32,metalness:.025,clearcoat:.62,clearcoatRoughness:.23})};
  }
  const red='#a52536',ink='#291d26',gold='#e2b95b',silver='#b7bbc0';
  const armorTorso=makeInk((q,p,o,m)=>{
    m([[.06,.04],[.32,.025],[.43,.14],[.33,.30],[.17,.28],[.09,.20]],'#b82d3c',ink,.026);
    m([[.08,.065],[.26,.055],[.36,.12]],null,'#ec7a71',.012);
    m([[.02,.31],[.14,.28],[.29,.38],[.32,.47],[.16,.53],[.055,.48]],gold,ink,.026);
    m([[.12,.38],[.19,.36],[.25,.40],[.24,.445],[.17,.46]],'#8a632d',ink,.016);
    m([[.06,.51],[.19,.57],[.36,.61],[.40,.73],[.20,.72],[.09,.66]],'#852233',ink,.023);
    m([[.09,.56],[.20,.62],[.33,.64]],null,'#d65f5f',.014);
    m([[.08,.72],[.20,.76],[.34,.80],[.42,.93],[.20,.92],[.07,.85]],'#bb3543',ink,.024);
    p([[.34,.32],[.66,.32],[.73,.45],[.65,.57],[.35,.57],[.27,.45]],'#611d29',ink,.021);
    for(let i=0;i<3;i++){let y=.60+i*.10;p([[.31,y],[.40,y+.04],[.60,y+.04],[.69,y],[.65,y+.06],[.35,y+.06]],i%2?'#a72c3c':'#c63a45',ink,.019)}
    o(.5,.38,.145,.15,'#201e28',silver,.018);o(.5,.38,.115,.118,'#83c8e8','#152b3f',.015);o(.5,.38,.077,.082,'#eafcff','#b6efff',.010);
    for(let i=0;i<8;i++){let a=i*Math.PI/4;p([[.5+Math.cos(a)*.105,.38+Math.sin(a)*.105],[.5+Math.cos(a)*.128,.38+Math.sin(a)*.128]],null,'#ebfaff',.009)}
    p([[.02,.96],[.98,.96]],null,'#5b1721',.021);
  },red);
  const armorHip=makeInk((q,p,o,m)=>{m([[.06,.12],[.29,.08],[.37,.24],[.30,.75],[.06,.83]],gold,ink,.038);m([[.12,.21],[.23,.18],[.28,.31],[.21,.62],[.12,.66]],'#896e38',ink,.022);p([[.31,.04],[.69,.04],[.63,.83],[.50,.95],[.37,.83]],'#751f2d',ink,.035);},red);
  const armorLeg=makeInk((q,p,o,m)=>{
    p([[.06,.05],[.94,.05],[.88,.28],[.69,.37],[.31,.37],[.12,.28]],'#8b2633',ink,.024);
    m([[.09,.25],[.24,.18],[.33,.27],[.30,.49],[.18,.56],[.08,.45]],gold,ink,.024);
    m([[.15,.30],[.23,.26],[.26,.32],[.22,.45]],null,'#fff0a5',.015);
    p([[.24,.43],[.38,.38],[.62,.38],[.76,.43],[.66,.60],[.5,.66],[.34,.60]],'#b73c46',ink,.024);
    m([[.11,.58],[.23,.62],[.41,.69],[.40,.78],[.24,.77],[.11,.70]],silver,ink,.025);
    p([[.05,.83],[.95,.83],[.95,.97],[.05,.97]],'#8b2231',ink,.024);
    p([[.17,.87],[.83,.87],[.73,.93],[.27,.93]],'#c04346',null);
  },red);
  const shirt=makeInk((q,p,o,m)=>{
    p([[.32,.015],[.5,.12],[.68,.015]],'#b8b9be', '#252731',.019);
    m([[.03,.025],[.12,.025],[.21,.25],[.19,.50],[.12,.90],[.06,.97]],'#383c46','#737982',.019);
    m([[.15,.04],[.24,.19],[.26,.39],[.20,.46]],null,'#70757f',.019);
    m([[.23,.40],[.40,.46],[.5,.44]],null,'#606673',.019);
    m([[.23,.57],[.39,.61],[.5,.60]],null,'#59606c',.017);
    m([[.28,.65],[.39,.72],[.5,.73]],null,'#505662',.015);
    m([[.31,.78],[.39,.86],[.49,.87]],null,'#555b66',.015);
    p([[.5,.55],[.5,.87]],null,'#555d69',.014);
    o(.50,.27,.104,.108,'#132e42','#6b879b',.018);o(.50,.27,.079,.083,'#3c8fb2','#151e30',.013);
    for(let i=0;i<6;i++){let a=i*Math.PI/3;p([[.50,.27],[.50+.063*Math.cos(a),.27+.066*Math.sin(a)]],null,'#b5e7fc',.009)}
    o(.50,.27,.025,.025,'#c7f5ff','#5cb9e4',.006);
  },'#181a22');
  const jeans=makeInk((q,p,o,m)=>{p([[.05,.10],[.05,.65],[.13,.77]],null,'#3d4049',.012);p([[.94,.05],[.94,.78]],null,'#383c46',.012);p([[.08,.83],[.92,.83]],null,'#4a4d55',.014);p([[.07,.95],[.93,.95]],null,'#0c0e14',.016);},'#171922');
  const face=makeInk((q,p,o,m)=>{
    // Printed expressive brow, pupils, moustache and pointed goatee; no sculpted human nose.
    m([[.15,.30],[.23,.23],[.34,.24],[.42,.30],[.40,.35],[.30,.30],[.19,.34]],'#38241f',null);
    o(.29,.43,.076,.10,'#fff5e9','#3a2523',.018);o(.71,.43,.076,.10,'#fff5e9','#3a2523',.018);
    o(.30,.435,.046,.070,'#272125',null);o(.70,.435,.046,.070,'#272125',null);
    o(.282,.405,.015,.024,'#fff',null);o(.682,.405,.015,.024,'#fff',null);
    m([[.15,.50],[.18,.58],[.24,.63]],null,'#bd805f',.011);
    p([[.46,.49],[.43,.57],[.49,.59],[.53,.56]],null,'#ae7659',.011);
    p([[.30,.66],[.38,.60],[.47,.62],[.50,.65],[.53,.62],[.62,.60],[.70,.66],[.64,.72],[.56,.67],[.50,.70],[.44,.67],[.36,.72]],'#492a21',null);
    p([[.35,.70],[.42,.76],[.58,.76],[.66,.70],[.63,.78],[.56,.81],[.44,.81],[.37,.78]],'#442922',null);
    p([[.40,.715],[.59,.715],[.55,.752],[.45,.752]],'#fff4df',null);
    p([[.37,.76],[.43,.82],[.50,.85],[.57,.82],[.63,.76],[.59,.88],[.50,.92],[.41,.88]],'#462b22',null);
    p([[.46,.82],[.54,.82],[.53,.86],[.47,.86]],'#b77a58',null);
  },'#eabe96');
  // Use the original reference image for Tony's recognizable printed expression.
  // Geometry and the skin-colored back remain separate from the front print.
  // The exact uploaded 245x400 reference is projected separately onto the
  // molded head, hair and trapezoid torso. This retains the original expression,
  // hair print and ARC shirt without stretching an entire photo over a part.
  function photoInk(fill,project){
    const canvas=document.createElement('canvas');canvas.width=245;canvas.height=400;
    const ctx=canvas.getContext('2d');ctx.fillStyle=fill;ctx.fillRect(0,0,245,400);
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
    map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    return {width:245,height:400,project,canvas,ctx,map,material:new T.MeshStandardMaterial({map,roughness:.47,metalness:0,envMapIntensity:.38})};
  }
  const headUV=(x,y)=>[(121.5+x*145)/245,1-(80-y*145)/400];
  const tonyPrint=photoInk('#eabe96',headUV);
  const tonyHair=photoInk('#38231e',headUV);tonyHair.material.roughness=.42;tonyHair.material.envMapIntensity=.28;tonyHair.material.color.setRGB(.85,.81,.79);tonyPrint.material.color.setRGB(.87,.82,.77);
  const tonyShirt=photoInk('#171722',(x,y)=>[(122+x*155)/245,1-(245-y*157)/400]);
  // Manual silhouette coordinates from the supplied front photo, in its actual pixels.
  const faceBounds=[[38,84,159],[48,84,159],[58,78,165],[69,76,166],[80,76,167],[92,77,166],[102,82,160],[110,94,151],[115,103,142]];
  const shirtBounds=[[123,90,152],[128,76,166],[143,72,170],[165,68,176],[189,63,181],[215,58,186],[242,55,190],[246,58,187]];
  const hairBounds=[[4,116,130],[8,100,147],[15,87,157],[23,76,167],[35,69,173],[49,67,176],[60,68,175],[77,71,174]];
  function boundsAt(rows,y){let i=1;while(i<rows.length-1&&y>rows[i][0])i++;const a=rows[i-1],b=rows[i],t=T.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1);return [Math.ceil(T.MathUtils.lerp(a[1],b[1],t)),Math.floor(T.MathUtils.lerp(a[2],b[2],t))]}
  loader.load('./textures/tony-print.jpg?v=076',tex=>{
    const source=document.createElement('canvas');source.width=245;source.height=400;const q=source.getContext('2d',{willReadFrequently:true});q.drawImage(tex.image,0,0,245,400);
    const raw=q.getImageData(0,0,245,400).data;
    function transfer(art,rows,top,bottom,valid,fallback){
      const out=art.ctx.getImageData(0,0,245,400),d=out.data;
      for(let y=0;y<400;y++){
        const sy=T.MathUtils.clamp(y,top,bottom),[lo,hi]=boundsAt(rows,sy),allowed=[];
        for(let x=lo;x<=hi;x++){const i=(sy*245+x)*4;if(valid(raw[i],raw[i+1],raw[i+2]))allowed.push(x)}
        for(let x=0;x<245;x++){
          const i=(y*245+x)*4;let sx=T.MathUtils.clamp(x,lo,hi),j=(sy*245+sx)*4;
          if(!valid(raw[j],raw[j+1],raw[j+2])){if(allowed.length){sx=allowed.reduce((best,v)=>Math.abs(v-x)<Math.abs(best-x)?v:best,allowed[0]);j=(sy*245+sx)*4}else{d[i]=fallback[0];d[i+1]=fallback[1];d[i+2]=fallback[2];d[i+3]=255;continue}}
          d[i]=raw[j];d[i+1]=raw[j+1];d[i+2]=raw[j+2];d[i+3]=255;
        }
      }
      art.ctx.putImageData(out,0,0);art.map.needsUpdate=true;
    }
    // Remove white photo background, extending the nearest valid print pixel
    // into the silhouette margin rather than drawing white seams on the model.
    transfer(tonyPrint,faceBounds,38,115,(r,g,b)=>!(r>242&&g>242&&b>242),[234,190,150]);
    transfer(tonyHair,hairBounds,4,77,(r,g,b)=>r<157&&g<136&&b<133,[56,35,30]);
    transfer(tonyShirt,shirtBounds,123,246,(r,g,b)=>!(r>225&&g>225&&b>225),[23,23,34]);
    tex.dispose();
  });
  const ironPrint=armorTorso;
  function group(parent,x=0,y=0,z=0) {
    const g = new T.Group(); g.position.set(x,y,z); parent.add(g); return g;
  }
  function piece(parent,geometry,material,x=0,y=0,z=0) {
    const m=new T.Mesh(geometry,material); m.position.set(x,y,z);
    m.castShadow=m.receiveShadow=true; parent.add(m); return m;
  }
  function drum(parent,x,y,z,r,h,material) {
    return piece(parent,new T.CylinderGeometry(r,r,h,32),material,x,y,z);
  }
  // A profile is horizontal cross-sections from bottom to top. Art coordinates
  // on each row follow that row's actual silhouette in the front view.
  function molded(parent, rows, power, base, art, arc=Math.PI*.47) {
    const pos=[],uv=[],normGeo=new T.BufferGeometry(),front=[],back=[];
    const sides=64;
    for (let j=0;j<rows.length;j++){
      const [y,rx,rz,py,left,right,cx=0,cz=0]=rows[j];
      for(let i=0;i<=sides;i++){
        const a=(i/sides*2-1)*Math.PI, si=Math.sin(a), co=Math.cos(a);
        const sx=Math.sign(si)*Math.pow(Math.abs(si),power);
        const sz=Math.sign(co)*Math.pow(Math.abs(co),power);
        pos.push(cx+rx*sx,y,cz+rz*sz);
        if(art?.project){uv.push(...art.project(cx+rx*sx,y,cz+rz*sz));}else uv.push(art?(art.normalized?(sx+1)*.5:(left+(sx+1)*.5*(right-left))/art.width):.5,art?(art.normalized?(y-rows[0][0])/Math.max(.001,rows[rows.length-1][0]-rows[0][0]):1-py/art.height):.5);
        if(j&&i<sides){
          const b=(j-1)*(sides+1)+i, t=b+sides+1;
          const dest=art && Math.abs(a+Math.PI/sides)<arc ? front:back;
          dest.push(b,b+1,t,b+1,t+1,t);
        }
      }
    }
    for (const j of [0,rows.length-1]) {
      const [y,,,,,,cx=0,cz=0]=rows[j],center=pos.length/3;
      pos.push(cx,y,cz);uv.push(.5,.5);
      for(let i=0;i<sides;i++){const k=j*(sides+1)+i; if(j)back.push(center,k,k+1);else back.push(center,k+1,k);}
    }
    normGeo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    normGeo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    normGeo.setIndex(back.concat(front));normGeo.addGroup(0,back.length,0);
    if(front.length)normGeo.addGroup(back.length,front.length,1);
    normGeo.computeVertexNormals();
    return piece(parent,normGeo,art?[base,art.material]:base);
  }
  function clipHand(parent,x,material) {
    const shape=new T.Shape(),a=-Math.PI*.27,b=Math.PI*1.27;
    shape.absarc(0,0,.143,a,b,false);shape.absarc(0,0,.080,b,a,true);shape.closePath();
    const depth=.14;
    const geom=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:20,bevelEnabled:true,bevelSegments:3,bevelThickness:.014,bevelSize:.012});
    geom.translate(0,0,-depth/2);
    return piece(parent,geom,material,x,-.735,.075);
  }
  function jet(parent){
    const flame=group(parent,0,-.85,.01);
    for(const [r,h,color] of [[.108,.58,0x32b7ff],[.069,.38,0xdeffff]]){
      const tip=piece(flame,new T.ConeGeometry(r,h,14),new T.MeshBasicMaterial({color}),0,-h*.48,0);
      tip.rotation.z=Math.PI;tip.castShadow=false;
    }
    flame.visible=false; return flame;
  }
  function backPrint(armor){
    const c=document.createElement('canvas');c.width=256;c.height=256;
    const q=c.getContext('2d');q.lineJoin='round';q.lineCap='round';
    const stroke=(points,color,w,fill)=>{
      q.beginPath();points.forEach(([x,y],i)=>i?q.lineTo(x,y):q.moveTo(x,y));
      if(fill){q.closePath();q.fillStyle=fill;q.fill();}
      q.lineWidth=w;q.strokeStyle=color;q.stroke();
    };
    for(const side of [-1,1]){
      q.save();q.translate(128,0);q.scale(side,1);
      if(armor){
        stroke([[8,22],[46,13],[97,31],[102,62],[82,93],[54,109],[28,85],[12,69]],'#37252a',6,'#922532');
        stroke([[25,34],[51,28],[88,40],[82,52],[59,49],[41,61]],'#d49261',4);
        stroke([[28,88],[52,107],[76,108],[90,94],[82,132],[62,146],[22,128]],'#452931',5,'#a0443f');
        stroke([[47,148],[80,135],[85,155],[71,185],[55,220],[35,231],[27,206]],'#352c34',5,'#c39b65');
        stroke([[61,147],[72,142],[67,169],[48,213]],'#78433b',4);
      }else{
        stroke([[48,3],[64,9],[81,52],[95,75],[102,129],[95,223]],'#555c67',5);
        stroke([[12,74],[44,65],[73,75],[88,102]],'#3d4852',4);
        stroke([[2,211],[53,208],[83,219]],'#47525a',3);
      }
      q.restore();
    }
    if(armor)for(let i=0;i<5;i++){let y=104+i*22;stroke([[86,y],[128,y+8],[171,y],[163,y+12],[128,y+20],[94,y+12]],'#372830',4,'#88323b');}
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:tex,transparent:true,roughness:.4,depthWrite:false});
  }
  function backSurface(torso,rows,armor){
    const xyz=[],uv=[],indices=[],n=32;
    rows.forEach(([y,rx,rz],j)=>{
      for(let i=0;i<=n;i++){
        const a=Math.PI-.97+i*1.94/n,s=Math.sin(a),c=Math.cos(a);
        const sx=Math.sign(s)*Math.abs(s)**.24;
        xyz.push(rx*sx,y,rz*Math.sign(c)*Math.abs(c)**.24-.006);uv.push((sx+1)*.5,y/.76);
        if(j&&i<n){const b=(j-1)*(n+1)+i,t=b+n+1;indices.push(b,b+1,t,b+1,t+1,t);}
      }
    });
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
    const ink=piece(torso,g,backPrint(armor));ink.castShadow=false;
  }
  function hair(head){
    // Trace the exact asymmetric fringe at the front; on the rear the
    // molded hair sweeps down over the sides as on a classic toy hairpiece.
    const fringe=[[64,76],[72,76],[79,67],[86,60],[95,52],[104,48],[113,54],[122,50],[130,54],[137,61],[145,58],[151,63],[159,56],[166,63],[176,76]];
    function hairline(x){let i=1;while(i<fringe.length-1&&x>fringe[i][0])i++;const a=fringe[i-1],b=fringe[i],t=T.MathUtils.clamp((x-a[0])/(b[0]-a[0]),0,1);return (80-T.MathUtils.lerp(a[1],b[1],t))/145;}
    const pos=[],uv=[],front=[],back=[],columns=80,levels=25;
    for(let j=0;j<=levels;j++){
      const u=j/levels,v=u*Math.PI/2;
      for(let i=0;i<=columns;i++){
        const a=(i/columns*2-1)*Math.PI,si=Math.sin(a),co=Math.cos(a);
        const frontWeight=T.MathUtils.smoothstep(co,-.12,.35);
        const edge=T.MathUtils.lerp(-.10,hairline(121.5+si*.392*145),frontWeight);
        const height=edge+(.522-edge)*Math.sin(v);
        const ridge=(.009*Math.cos(17*a+u*5.2)+.004*Math.cos(31*a+u*8))*Math.sin(v*1.7+.2);
        const radius=(.395+ridge)*Math.cos(v)**.78*(1+.085*Math.sin(u*Math.PI*1.35));
        const x=radius*si-.022*u,z=radius*co-.014+.020*Math.max(0,co);
        pos.push(x,height,z);uv.push(...headUV(x,height));
        if(j&&i<columns){const b=(j-1)*(columns+1)+i,t=b+columns+1;const target=Math.abs(a+Math.PI/columns)<Math.PI*.49?front:back;target.push(b,b+1,t,b+1,t+1,t)}
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(back.concat(front));g.addGroup(0,back.length,0);g.addGroup(back.length,front.length,1);g.computeVertexNormals();
    const dark=abs(0x38231e,.31,0,.56),cap=piece(head,g,[dark,tonyHair.material]);cap.castShadow=true;
  }
  // Tony is now a separate sculpt, not a recolor of the armored rig.
  // All root children deliberately retain the assembly cutscene's ordering.
  function tonyPart(parent,rows,material,art=null,oval=false,segments=64){
    if(mobileGPU)segments=Math.min(segments,40);
    const xyz=[],uv=[],front=[],other=[];
    for(let j=0;j<rows.length;j++){
      const [y,w,d,r,cx=0,cz=0]=rows[j];
      for(let i=0;i<=segments;i++){
        const a=(i/segments*2-1)*Math.PI,si=Math.sin(a),co=Math.cos(a);
        // Continuous rounded rectangular cross section, including closed rear seam.
        const ux=Math.abs(si),uz=Math.abs(co);
        let x,z;
        if(oval){x=cx+w*si;z=cz+d*co}
        else {const rw=Math.max(0,w-r),rd=Math.max(0,d-r);let t=Math.min(w/Math.max(ux,1e-8),d/Math.max(uz,1e-8));
          if(t*ux>rw&&t*uz>rd){const k=ux*rw+uz*rd;t=k+Math.sqrt(Math.max(0,k*k-rw*rw-rd*rd+r*r));}
          x=cx+si*t;z=cz+co*t;}
        xyz.push(x,y,z);uv.push(...(art?art.project(x,y,z):[i/segments,j/(rows.length-1)]));
        if(j&&i<segments){
          const k=(j-1)*(segments+1)+i,t=k+segments+1;
          const arr=art&&Math.abs(a+Math.PI/segments)<Math.PI*.48?front:other;
          arr.push(k,k+1,t,k+1,t+1,t);
        }
      }
    }
    for(const j of [0,rows.length-1]){
      const center=xyz.length/3,[y,,,,cx=0,cz=0]=rows[j];xyz.push(cx,y,cz);uv.push(.5,.5);
      for(let i=0;i<segments;i++){const k=j*(segments+1)+i;if(j)other.push(center,k,k+1);else other.push(center,k+1,k)}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(other.concat(front));g.addGroup(0,other.length,0);if(front.length)g.addGroup(other.length,front.length,1);g.computeVertexNormals();return piece(parent,g,art?[material,art.material]:material);
  }
  function softBox(parent,w,h,d,r,material,x=0,y=0,z=0){
    const sh=new T.Shape(),a=w/2-r,b=h/2-r;
    sh.moveTo(-a,-b);sh.lineTo(a,-b);sh.lineTo(a,b);sh.lineTo(-a,b);sh.closePath();
    const g=new T.ExtrudeGeometry(sh,{depth:Math.max(.002,d-2*r),bevelEnabled:true,bevelSegments:3,steps:1,bevelThickness:r,bevelSize:r,curveSegments:6});g.translate(0,0,-(d-2*r)/2);
    return piece(parent,g,material,x,y,z);
  }
  function hairLock(parent,points,width,thickness,material){
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),xyz=[],idx=[],steps=mobileGPU?12:20,sides=mobileGPU?7:10;
    for(let j=0;j<=steps;j++){
      const u=j/steps,p=curve.getPoint(u),dir=curve.getTangent(u).normalize();
      const normal=new T.Vector3(p.x,p.y-.05,p.z+.015).normalize();
      const lateral=new T.Vector3().crossVectors(dir,normal).normalize();
      const radial=new T.Vector3().crossVectors(lateral,dir).normalize();
      const taper=.12+.88*Math.pow(Math.sin(Math.PI*u),.42);
      for(let i=0;i<=sides;i++){
        const a=i/sides*Math.PI*2,v=p.clone().addScaledVector(lateral,Math.cos(a)*width*taper).addScaledVector(radial,Math.sin(a)*thickness*taper);
        xyz.push(v.x,v.y,v.z);
        if(j&&i<sides){const k=(j-1)*(sides+1)+i,t=k+sides+1;idx.push(k,t,k+1,k+1,t,t+1)}
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setIndex(idx);g.computeVertexNormals();return piece(parent,g,material);
  }
  function sculptTonyHair(head){
    // One molded hairpiece, not separate tubes. Broad swept fringe is shaped
    // from the reference's silhouette; grooves are shallow changes in surface radius.
    const dark=abs(0x39251e,.40,0,.23);
    dark.envMapIntensity=.38;
    const N=mobileGPU?64:96,M=mobileGPU?20:32,xyz=[],uv=[],front=[],back=[];
    const fringe=[[65,74],[72,74],[79,64],[85,59],[94,53],[104,48],[112,53],[121,47],[130,49],[139,58],[145,61],[151,60],[158,56],[166,65],[174,77],[179,78]];
    function lerpRow(rows,value){let i=1;while(i<rows.length-1&&value>rows[i][0])i++;let a=rows[i-1],b=rows[i],t=T.MathUtils.clamp((value-a[0])/(b[0]-a[0]),0,1);return a.slice(1).map((x,k)=>T.MathUtils.lerp(x,b[k+1],t))}
    const profile=[[-.10,.354,.320],[.025,.374,.338],[.12,.388,.350],[.22,.389,.353],[.28,.381,.346],[.34,.354,.321],[.40,.307,.282],[.455,.244,.222],[.49,.155,.140],[.510,.072,.070],[.522,.003,.003]];
    for(let j=0;j<=M;j++)for(let i=0;i<=N;i++){
      const u=j/M,a=(i/N*2-1)*Math.PI,si=Math.sin(a),co=Math.cos(a);
      const fy=(80-lerpRow(fringe,121.5+si*55)[0])/145;
      const y0=T.MathUtils.lerp(-.105,fy,T.MathUtils.smoothstep(co,-.09,.58));
      const y=T.MathUtils.lerp(y0,.522,u),[rx,rz]=lerpRow(profile,y);
      const twist=a+1.20*u+.18*Math.sin(a*1.7),ripple=(.0062*Math.cos(13*twist)+.0026*Math.cos(26*twist+.5))*Math.sin(Math.PI*(.18+.82*u));
      const x=(rx+ripple)*si-.018*Math.sin(Math.PI*u),z=(rz+ripple)*co-.006;
      xyz.push(x,y,z);uv.push(...headUV(x,y));
      if(j&&i<N){let k=(j-1)*(N+1)+i,t=k+N+1;let dest=Math.abs(a+Math.PI/N)<Math.PI*.46?front:back;dest.push(k,k+1,t,k+1,t+1,t)}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(back.concat(front));g.addGroup(0,back.length,0);g.addGroup(back.length,front.length,1);g.computeVertexNormals();
    // The front uses the real hair print, with subdued specular reflections.
    const m=piece(head,g,[dark,tonyHair.material]);m.castShadow=true;
  }
  function sculptTony(){
    const root=new T.Group(),skin=abs(0xe2b38a,.43,0,.28),black=abs(0x13131b,.37,0,.37),inside=abs(0x090a10,.44,0,.2),sleeve=abs(0x484950,.40,0,.35);for(const m of [skin,black,inside,sleeve])m.envMapIntensity=.48;
    const torso=group(root,0,.97),head=group(root,0,2.035);
    // Broad trapezoidal torso with beveled, not balloon-shaped, edges.
    tonyPart(torso,[[.006,.416,.234,.035],[.023,.447,.263,.035],[.050,.447,.270,.037],[.615,.369,.240,.035],[.708,.343,.230,.032],[.746,.324,.212,.028],[.759,.300,.198,.026]],black,tonyShirt);
    const collar=drum(torso,0,.764,0,.151,.036,black);
    // Plain black rear, without a floating print overlay.
    drum(root,0,1.765,0,.148,.12,skin);
    const hips=group(root,0,.87);
    softBox(hips,.872,.106,.495,.018,black,0,.045,0);
    softBox(hips,.115,.20,.40,.015,inside,0,-.048,-.018);
    // Classical cylindrical head with a broad rounded chin and printed face.
    tonyPart(head,[[-.240,.205,.212,.03],[-.228,.257,.255,.03],[-.210,.296,.280,.03],[-.173,.316,.297,.03],[-.119,.329,.307,.03],[.105,.329,.307,.03],[.168,.319,.300,.03],[.214,.292,.275,.03],[.244,.240,.233,.03]],skin,tonyPrint,true,80);
    drum(head,0,.253,0,.150,.098,skin);
    sculptTonyHair(head);
    const arms=[],legs=[],jets=[];
    for(const side of [-1,1]){
      const arm=group(root,side*.395,1.62,0);
      const shoulder=drum(arm,0,-.008,0,.12,.074,inside);shoulder.rotation.z=Math.PI/2;
      tonyPart(arm,[[-.550,.121,.127,.025,side*.151,.036],[-.530,.139,.143,.028,side*.148,.038],[-.440,.139,.147,.030,side*.14,.032],[-.285,.154,.152,.032,side*.108,.013],[-.155,.157,.157,.032,side*.072,-.003],[-.052,.148,.150,.03,side*.034,-.012],[.038,.116,.122,.028,side*.009,-.010],[.080,.075,.082,.02,side*.002,-.010]],sleeve,null,true);
      drum(arm,side*.151,-.572,.04,.090,.091,skin);
      const hand=clipHand(arm,side*.151,skin);hand.position.y=-.700;hand.position.z=.055;hand.rotation.z=side*.085;
      arms.push(arm);
      const leg=group(root,side*.227,.855,0);
      // Actual boot step and upper leg; horizontal mold seam is geometry.
      tonyPart(leg,[[-.832,.190,.263,.018,0,.058],[-.815,.208,.279,.024,0,.058],[-.695,.209,.279,.024,0,.058],[-.667,.207,.277,.024,0,.058],[-.649,.207,.227,.023,0,.005],[-.540,.205,.218,.023,0,-.002],[-.310,.205,.218,.023,0,-.003],[-.158,.205,.235,.026,0,-.015],[-.075,.193,.235,.026,0,-.018],[-.025,.157,.195,.025,0,-.018]],black);
      const ankle=softBox(leg,.412,.012,.47,.005,inside,0,-.666,.05);ankle.castShadow=false;
      for(const y of [-.28,-.57]){
        const ring=piece(leg,new T.TorusGeometry(.081,.013,8,24),black,0,y,-.225);ring.rotation.y=Math.PI;
        const hole=piece(leg,new T.CircleGeometry(.070,24),inside,0,y,-.226);hole.rotation.y=Math.PI;
      }
      legs.push(leg);
    }
    root.userData={arms,legs,jets,head,torso,hips,visor:null};return root;
  }
  function figure(armor) {
    if(!armor)return sculptTony();
    const root=new T.Group(), skin=abs(0xeabe96,.34,0,.48), maroon=abs(0x981b29,.25,.08,.74), black=abs(0x171722,.29,0,.62);
    const body=armor?maroon:black, tr=armor?ironPrint:tonyPrint;
    const torso=group(root,0,.97), head=group(root,0,2.035);
    const arms=[],legs=[],jets=[];let visor=null;
    const tx=armor?[[.006,.444,.268,323,75,234],[.045,.451,.278,316,76,234],[.70,.364,.244,188,93,216],[.76,.330,.232,178,97,211]]:[[.006,.444,.268,240,57,188],[.045,.451,.278,232,58,187],[.70,.364,.244,133,76,169],[.76,.330,.232,128,80,165]];
    molded(torso,tx,.24,body,armor?armorTorso:tonyShirt);backSurface(torso,tx,armor);if(armor){const reactor=group(torso,0,.471,.265);const rim=piece(reactor,new T.TorusGeometry(.086,.012,8,40),abs(0xbac8d0,.31,.30));rim.castShadow=false;const lens=piece(reactor,new T.CircleGeometry(.070,40),eyeMaterial,0,0,.011);lens.castShadow=false;const lensRim=piece(reactor,new T.TorusGeometry(.052,.0035,5,32),abs(0x78b5ce,.28,.15),0,0,.013);lensRim.castShadow=false;}
    drum(root,0,1.765,0,.15,.12,armor?maroon:skin);
    const hips=group(root,0,.87); molded(hips,[[0,.420,.242],[.018,.434,.254],[.075,.45,.26],[.09,.437,.251]],.26,body,armor?armorHip:null);
    if(armor){
      const shell=molded(head,[[-.269,.285,.28,166,91,216],[-.23,.349,.325,159,87,221],[-.09,.372,.337,131,86,223],[.065,.372,.345,98,85,224],[.215,.374,.354,69,85,224],[.365,.361,.35,37,88,220],[.48,.335,.304,16,94,214],[.52,.258,.23,8,113,198],[.535,.13,.13,5,136,176]],.53,maroon,armorTorso,Math.PI*.49);
      // A hinged front shell closes over the driver's head during calibration.
      const plateGeometry=shell.geometry.clone();
      const [rear,front]=shell.geometry.groups;
      shell.geometry.setDrawRange(0,rear.count);plateGeometry.setDrawRange(front.start,front.count);
      visor=group(head,0,.352,-.034);
      const maskBase=piece(visor,plateGeometry,[maroon,maroon],0,-.352,.034);const maskDetail=group(visor,0,-.352,.034);faceplate(maskDetail);
      molded(head,[[-.21,.22,.19,110,88,157],[-.15,.28,.215,101,81,161],[.18,.28,.224,58,81,161],[.24,.22,.19,53,89,156]],.90,skin,tonyPrint,Math.PI*.43);
      // Stepped rear shell, side pivots and recessed ear rings read in profile.
      for(const side of [-1,1]){
        const hinge=drum(head,side*.36,.05,-.042,.143,.042,abs(0x6b1420,.31,.15));hinge.rotation.z=Math.PI/2;
        const cap=drum(head,side*.386,.05,-.042,.092,.023,maroon);cap.rotation.z=Math.PI/2;const lip=piece(head,new T.TorusGeometry(.095,.012,8,24),abs(0xb94842,.29,.12),side*.402,.05,-.042);lip.rotation.y=Math.PI/2;
      }
    }else{
      molded(head,[[-.238,.206,.218],[-.224,.274,.267],[-.190,.318,.295],[-.144,.329,.306],[.105,.329,.306],[.175,.325,.296],[.220,.294,.272],[.251,.237,.234]],.92,skin,tonyPrint,Math.PI*.48);
      hair(head);
    }
    for(const side of [-1,1]){
      const a=group(root,side*.395,1.62,0), armMat=armor?maroon:abs(0x505158,.34,0,.53);
      // Cross-sections follow the angled shoulder and the forward bend of the elbow.
      const rows=[[-.535,.124,.137,.136,.045],[-.49,.134,.145,.141,.044],[-.30,.147,.151,.137,.018],[-.19,.151,.158,.11,-.008],[-.06,.154,.155,.064,-.017],[.052,.132,.140,.035,-.022],[.092,.086,.099,.028,-.025]].map(([y,rx,rz,dx,z])=>[y,rx,rz,0,0,0,side*dx,z]);
      molded(a,rows,.88,armMat);
      const wrist=drum(a,side*.137,-.577,.05,.092,.124,armor?maroon:skin);const hand=clipHand(a,side*.137,armor?maroon:skin);if(armor){const cuff=drum(a,side*.137,-.522,.045,.127,.036,abs(0x711b25,.30,.12));const gauntlet=group(a,side*.137,-.434,.135);const depth=()=>.040;curvedPatch(gauntlet,[[-.098,.05],[-.077,-.065],[.077,-.065],[.098,.05],[.05,.08],[-.05,.08]],maskInk,.001,depth,1);curvedPatch(gauntlet,[[-.078,.044],[-.06,-.047],[.06,-.047],[.078,.044],[.041,.064],[-.041,.064]],goldMask,.007,depth,1);}arms.push(a);
      const leg=group(root,side*.227,.855,0);
      const left=side<0, leftEdge=armor?(left?72:165):(left?57:132),rightEdge=armor?(left?146:238):(left?112:186);
      const legRows=[[-.833,.207,.278,armor?508:387,.055],[-.683,.209,.280,armor?480:360,.055],[-.642,.207,.225,armor?469:353,.002],[-.35,.203,.219,armor?417:311,0],[-.19,.209,.245,armor?388:292,-.015],[-.081,.205,.244,armor?362:271,-.018],[-.014,.162,.191,armor?353:264,-.018]].map(([y,rx,rz,py,z])=>[y,rx,rz,py,leftEdge,rightEdge,0,z]);
      molded(leg,legRows,.25,body,armor?armorLeg:null);
      // Side seams and separate rounded toe mold, without covering the front print.
      const seam=piece(leg,new T.BoxGeometry(.008,.025,.365),armor?abs(0x62141e,.34,.1):abs(0x0d1018,.35),side*.209,-.657,.025);seam.castShadow=false;
      // Two actual recessed socket rims on the back of each leg.
      for(const y of [-.285,-.606]){
        const socket=piece(leg,new T.TorusGeometry(.087,.018,7,18),body,0,y,-.231);
        piece(leg,new T.CircleGeometry(.082,18),mat(armor?0x48101b:0x0b1018),0,y,-.230).rotation.y=Math.PI;
        socket.rotation.y=Math.PI;
      }
      if(armor){const socket=drum(leg,0,-.829,.015,.108,.027,abs(0x53212a,.30,.10));const exhaust=piece(leg,new T.TorusGeometry(.068,.013,8,24),abs(0xb2a390,.30,.25),0,-.845,.015);exhaust.rotation.x=Math.PI/2;jets.push(jet(leg));}legs.push(leg);
    }
    root.userData={arms,legs,jets,head,torso,hips,visor};return root;
  }
  // Character-specific sculpted accessories on a shared animation skeleton.
  // All the pieces remain rigid and attach to the existing moving joints.
  const variantFace=makeInk((q,p,o,m)=>{
    m([[.15,.31],[.25,.27],[.40,.31]],null,'#78523c',.026);
    o(.29,.43,.053,.075,'#302528',null);o(.71,.43,.053,.075,'#302528',null);
    o(.275,.415,.014,.019,'#fff6e7',null);o(.695,.415,.014,.019,'#fff6e7',null);
    p([[.38,.69],[.50,.73],[.62,.69]],null,'#aa504b',.029);
    m([[.14,.54],[.20,.55],[.25,.57]],null,'#ce997c',.012);
  },'#edc19b');
  const pepperShirt=makeInk((q,p,o,m)=>{
    p([[.30,.01],[.50,.28],[.70,.01]],'#e6d8cb','#a8a39f',.012);
    m([[.04,0],[.28,.035],[.45,.34],[.27,.63],[.14,.82],[.06,.89]],'#304b61','#172939',.018);
    m([[.08,.76],[.27,.76],[.28,.82]],null,'#6b8492',.015);p([[.50,.32],[.50,.98]],null,'#9ba9b2',.012);
    for(let i=0;i<3;i++)o(.50,.44+i*.15,.017,.019,'#d6b49d',null);
  },'#263e52');
  function flattenMaterial(m,material){m.traverse(o=>{if(o.isMesh)o.material=material;});}
  function plate(parent,x,y,z,w,h,d,r,material){return softBox(parent,w,h,d,r,material,x,y,z)}
  function variant(name){
    if(name==='yinsen'){const root=sculptTony(),u=root.userData,skin=abs(0xd8ad86,.45),cloth=abs(0x9b9382,.48),hair=abs(0x423b34,.43);u.head.clear();tonyPart(u.head,[[-.24,.21,.22,.03],[-.22,.28,.27,.03],[-.17,.325,.30,.03],[.16,.325,.30,.03],[.23,.26,.24,.03]],skin,variantFace,true,40);const cap=piece(u.head,new T.SphereGeometry(.328,24,12,0,Math.PI*2,0,Math.PI*.32),hair,0,.105,-.014);cap.scale.set(1,.73,.94);for(const side of [-1,1]){const lens=piece(u.head,new T.TorusGeometry(.087,.014,6,22),abs(0x3b3330,.42),side*.12,.03,.300);plate(u.head,side*.24,.03,.262,.10,.026,.025,.006,hair);}plate(u.head,0,.033,.315,.088,.021,.025,.006,hair);u.torso.clear();tonyPart(u.torso,[[.01,.43,.24,.035],[.04,.445,.26,.035],[.70,.35,.23,.035],[.76,.32,.21,.03]],cloth,null);for(const side of [-1,1]){plate(u.torso,side*.19,.48,.258,.16,.14,.025,.009,abs(0x736c5e,.50));}u.arms.forEach(a=>{if(a.children[1]?.isMesh)a.children[1].material=cloth});return root;}
    if(name==='pepper'){
      const root=sculptTony(),u=root.userData,skin=abs(0xe9bc98,.42,0,.25),navy=abs(0x263e52,.41),hairMat=abs(0xc28b51,.40,0,.28);
      u.head.clear();tonyPart(u.head,[[-.24,.21,.22,.03],[-.22,.28,.27,.03],[-.17,.325,.30,.03],[.16,.325,.30,.03],[.23,.26,.24,.03]],skin,variantFace,true,40);
      const cap=piece(u.head,new T.SphereGeometry(.36,24,16,0,Math.PI*2,0,Math.PI*.62),hairMat,0,.10,-.035);cap.scale.set(1,.97,.94);
      for(const side of [-1,1]){const lock=piece(u.head,new T.CapsuleGeometry(.102,.31,4,12),hairMat,side*.265,-.08,-.10);lock.rotation.z=side*.08}
      const bun=piece(u.head,new T.SphereGeometry(.19,18,12),hairMat,0,.11,-.35);bun.scale.set(.90,1.1,.72);
      u.torso.clear();tonyPart(u.torso,[[.01,.43,.24,.035],[.04,.445,.26,.035],[.70,.35,.23,.035],[.76,.32,.21,.03]],navy,pepperShirt);
      u.arms.forEach(a=>{if(a.children[1]?.isMesh)a.children[1].material=navy});return root;
    }
    const root=figure(true),u=root.userData,steel=abs(0x77828b,.34,.35,.4),dark=abs(0x303842,.43,.22,.27),ironGray=abs(0x50555a,.48,.25,.2),silver=abs(0xa3aab0,.3,.35,.3),glowBlue=new T.MeshBasicMaterial({color:0xa4e7ff});
    if(name==='mark1'){
      // A bulky improvised suit: slotted face grille, overlapping steel plates,
      // asymmetrical shoulder shields and external rivets.
      flattenMaterial(root,ironGray);u.head.clear();u.visor=null;
      molded(u.head,[[-.27,.27,.27],[-.22,.36,.34],[.05,.39,.35],[.31,.36,.34],[.43,.29,.28],[.47,.18,.17]],.46,dark,null);const shellDepth=(x,y)=>.349-Math.abs(x)*.15-Math.max(0,y-.29)*.20;curvedPatch(u.head,[[-.31,.26],[-.23,.40],[.20,.40],[.31,.28],[.30,-.16],[.20,-.23],[-.21,-.23],[-.31,-.14]],steel,.016,shellDepth,2);
      for(let i=0;i<5;i++)plate(u.head,0,-.035+i*.052,.376,.38,.019,.02,.005,dark);
      for(let side of [-1,1]){plate(u.head,side*.16,.22,.380,.22,.075,.02,.008,dark);plate(u.head,side*.16,.22,.396,.16,.032,.012,.004,glowBlue)}
      const armorDepth=(x,y)=>.275+Math.max(0,.035-Math.abs(x)*.04);curvedPatch(u.torso,[[-.36,.11],[-.36,.53],[-.28,.69],[.28,.69],[.36,.53],[.36,.11],[.25,.04],[-.25,.04]],steel,.021,armorDepth,2);for(let i=0;i<3;i++)curvedPatch(u.torso,[[-.28,.12+i*.12],[.28,.12+i*.12],[.26,.18+i*.12],[-.26,.18+i*.12]],i%2?dark:ironGray,.036,armorDepth,1);
      const ring=piece(u.torso,new T.TorusGeometry(.10,.025,8,24),dark,0,.49,.352);piece(u.torso,new T.CircleGeometry(.076,24),glowBlue,0,.49,.365);
      for(const side of [-1,1]){const a=u.arms[side<0?0:1],l=u.legs[side<0?0:1];plate(a,side*.13,-.08,.01,.30,.28,.37,.035,steel);plate(a,side*.14,-.36,.11,.25,.30,.16,.024,dark);plate(l,0,-.35,.22,.33,.45,.13,.022,steel);for(let y of [.16,.60]){let r=drum(u.torso,side*.29,y,.344,.029,.022,dark);r.rotation.x=Math.PI/2}}
    } else if(name==='mark2'){
      flattenMaterial(root,silver);u.head.clear();u.visor=null;
      molded(u.head,helmetRows,.53,silver,null);faceplate(u.head);
      // Replace gold face paint by silver without altering shared Mark III materials.
      u.head.traverse(o=>{if(o.isMesh){if(o.material===goldMask||o.material===goldEdge)o.material=silver;else if(o.material===darkGold)o.material=steel}});
      for(const side of [-1,1]){const a=u.arms[side<0?0:1],l=u.legs[side<0?0:1];plate(a,side*.14,-.34,.13,.21,.26,.07,.022,steel);plate(l,0,-.38,.235,.26,.42,.05,.015,steel)}
      piece(u.torso,new T.TorusGeometry(.09,.018,8,32),dark,0,.47,.28);piece(u.torso,new T.CircleGeometry(.072,32),glowBlue,0,.47,.30);
    } else if(name==='war'){
      flattenMaterial(root,dark);u.head.clear();u.visor=null;
      molded(u.head,helmetRows,.53,dark,null);faceplate(u.head);
      u.head.traverse(o=>{if(o.isMesh){if(o.material===goldMask||o.material===goldEdge)o.material=steel;else if(o.material===darkGold)o.material=dark}});
      plate(u.torso,0,.40,.27,.66,.54,.08,.04,steel);piece(u.torso,new T.CircleGeometry(.085,24),glowBlue,0,.47,.325);
      for(const side of [-1,1]){let a=u.arms[side<0?0:1],l=u.legs[side<0?0:1];plate(a,side*.10,-.04,.01,.36,.29,.39,.035,steel);plate(l,0,-.46,.24,.31,.30,.10,.02,steel);}
      // Toy-style shoulder energy module, distinct silhouette without real weapon detail.
      const module=group(u.torso,-.39,.81,-.17);plate(module,0,0,0,.28,.30,.48,.045,dark);plate(module,0,0,.25,.18,.17,.08,.02,steel);piece(module,new T.CircleGeometry(.059,20),glowBlue,0,0,.30);
    }
    u.jets.forEach(j=>{j.traverse(o=>{if(o.isMesh)o.material=glowBlue});j.visible=false});return root;
  }
  figure.variant=variant;
  return figure;
}
