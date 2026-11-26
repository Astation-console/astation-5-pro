// Molded parts have their own pivots; only the surfaces facing the camera carry a print.
function buildMinifigureFactory(T, renderer, mat) {
  const loader = new T.TextureLoader();
  // Individual molded ABS materials, rather than one material shared with scenery.
  const plasticCache=new Map();
  function abs(color,rough=.26,metal=0,coat=.64){
    const key=[color,rough,metal,coat].join(':');
    if(!plasticCache.has(key))plasticCache.set(key,new T.MeshPhysicalMaterial({color,roughness:rough,metalness:metal,clearcoat:coat,clearcoatRoughness:.23,envMapIntensity:.9}));
    return plasticCache.get(key);
  }
  const goldMask=abs(0xd9a848,.28,.48,.65),goldEdge=abs(0xf2ce79,.25,.37,.67),darkGold=abs(0x8d642e,.39,.36,.35),maskInk=abs(0x211c24,.42,.1,.32);
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
    curvedPatch(parent,face.map(([x,y])=>[x*.976,(y-.14)*.972+.14]),goldMask,.017);
    for(const side of [-1,1]){
      const mirror=p=>p.map(([x,y])=>[side*x,y]);
      curvedPatch(parent,mirror([[.116,.466],[.222,.448],[.275,.377],[.304,.276],[.291,.275],[.253,.374],[.207,.429],[.122,.447]]),goldEdge,.022);
      curvedPatch(parent,mirror([[.050,.222],[.265,.245],[.273,.209],[.254,.148],[.070,.145],[.050,.171]]),maskInk,.031);
      curvedPatch(parent,mirror([[.069,.203],[.251,.224],[.249,.185],[.229,.167],[.085,.162],[.069,.179]]),eyeMaterial,.037);
      curvedPatch(parent,mirror([[.293,.107],[.269,.033],[.218,-.058],[.196,-.134],[.162,-.143],[.185,-.056],[.239,.038],[.274,.104]]),darkGold,.024);
      curvedPatch(parent,mirror([[.098,-.153],[.159,-.164],[.193,-.149],[.203,-.115],[.184,-.106],[.162,-.135],[.105,-.135]]),goldEdge,.027);
    }
    curvedPatch(parent,[[-.093,-.092],[-.058,-.108],[.058,-.108],[.093,-.092],[.085,-.116],[.052,-.13],[-.052,-.13],[-.085,-.116]],darkGold,.026);
  }
  function print(file, width, height) {
    const map = loader.load('./textures/' + file);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return {width, height, material:new T.MeshPhysicalMaterial({map, roughness:.36, metalness:.025,clearcoat:.48,clearcoatRoughness:.26})};
  }
  const tonyPrint = print('tony-print.jpg',245,400);
  const ironPrint = print('armor-print.jpg',383,522);
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
    const sides=48;
    for (let j=0;j<rows.length;j++){
      const [y,rx,rz,py,left,right,cx=0,cz=0]=rows[j];
      for(let i=0;i<=sides;i++){
        const a=(i/sides*2-1)*Math.PI, si=Math.sin(a), co=Math.cos(a);
        const sx=Math.sign(si)*Math.pow(Math.abs(si),power);
        const sz=Math.sign(co)*Math.pow(Math.abs(co),power);
        pos.push(cx+rx*sx,y,cz+rz*sz);
        uv.push(art?(left+(sx+1)*.5*(right-left))/art.width:.5, art?1-py/art.height:.5);
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
    // The hairline follows the molded fringe at the front and drops behind the ears.
    const pos=[],uv=[],front=[],back=[],columns=56,levels=14;
    for(let j=0;j<=levels;j++){
      const u=j/levels,v=u*Math.PI/2;
      for(let i=0;i<=columns;i++){
        const a=(i/columns*2-1)*Math.PI,si=Math.sin(a),co=Math.cos(a);
        const frontWeight=Math.max(0,co),fringe=.215+.032*Math.cos(10*si)-.039*Math.exp(-Math.pow((si-.34)/.17,2));
        const edge=-.073+.30*frontWeight**.70+(fringe-.227)*frontWeight;
        const height=edge+(.52-edge)*Math.sin(v);
        const ridge=(.010*Math.cos(15*a+u*4.7)+.005*Math.cos(29*a+u*6.3))*Math.sin(v*1.85);
        const radius=(.43+ridge)*Math.cos(v)**.86*(1+.07*Math.sin(u*Math.PI*1.5));
        const x=radius*si-.027*u, z=(radius+.004*(1-u))*co-.055+.039*frontWeight*(1-u);
        pos.push(x,height,z);
        uv.push((121.5+x*119)/tonyPrint.width,1-(78-height*135)/tonyPrint.height);
        if(j&&i<columns){
          const b=(j-1)*(columns+1)+i,t=b+columns+1;
          const target=Math.abs(a+Math.PI/columns)<1.5?front:back;
          target.push(b,b+1,t,b+1,t+1,t);
        }
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(back.concat(front));g.addGroup(0,back.length,0);g.addGroup(back.length,front.length,1);g.computeVertexNormals();
    const dark=abs(0x34201c,.28,0,.66), cap=piece(head,g,[dark,dark]);cap.castShadow=true;
  }
  function figure(armor) {
    const root=new T.Group(), skin=abs(0xeabe96,.34,0,.48), maroon=abs(0x981b29,.25,.08,.74), black=abs(0x171722,.29,0,.62);
    const body=armor?maroon:black, tr=armor?ironPrint:tonyPrint;
    const torso=group(root,0,.97), head=group(root,0,2.035);
    const arms=[],legs=[],jets=[];let visor=null;
    const tx=armor?[[.006,.444,.268,323,75,234],[.045,.451,.278,316,76,234],[.70,.364,.244,188,93,216],[.76,.330,.232,178,97,211]]:[[.006,.444,.268,240,57,188],[.045,.451,.278,232,58,187],[.70,.364,.244,133,76,169],[.76,.330,.232,128,80,165]];
    molded(torso,tx,.24,body,tr);backSurface(torso,tx,armor);if(armor){const reactorDepth=()=>.264;curvedPatch(torso,[[-.070,.565],[.070,.565],[.088,.538],[.018,.455],[-.018,.455],[-.088,.538]],maskInk,.012,reactorDepth,1);curvedPatch(torso,[[-.053,.550],[.053,.550],[.061,.533],[0,.477],[-.061,.533]],eyeMaterial,.016,reactorDepth,1);}
    drum(root,0,1.765,0,.15,.12,armor?maroon:skin);
    const hips=group(root,0,.87); molded(hips,[[0,.422,.25,armor?347:259,armor?78:58,armor?232:188],[.09,.45,.26,armor?331:245,armor?77:58,armor?233:188]],.22,body,tr);
    if(armor){
      const shell=molded(head,[[-.269,.285,.28,166,91,216],[-.23,.349,.325,159,87,221],[-.09,.372,.337,131,86,223],[.065,.372,.345,98,85,224],[.215,.374,.354,69,85,224],[.365,.361,.35,37,88,220],[.48,.335,.304,16,94,214],[.52,.258,.23,8,113,198],[.535,.13,.13,5,136,176]],.53,maroon,tr,Math.PI*.49);
      // A hinged front shell closes over the driver's head during calibration.
      const plateGeometry=shell.geometry.clone();
      const [rear,front]=shell.geometry.groups;
      shell.geometry.setDrawRange(0,rear.count);plateGeometry.setDrawRange(front.start,front.count);
      visor=group(head,0,.352,-.034);
      const maskBase=piece(visor,plateGeometry,[maroon,maroon],0,-.352,.034);const maskDetail=group(visor,0,-.352,.034);faceplate(maskDetail);
      molded(head,[[-.21,.22,.19,110,88,157],[-.15,.28,.215,101,81,161],[.18,.28,.224,58,81,161],[.24,.22,.19,53,89,156]],.90,skin,tonyPrint);
      // Stepped rear shell, side pivots and recessed ear rings read in profile.
      for(const side of [-1,1]){
        const hinge=drum(head,side*.36,.05,-.042,.143,.042,abs(0x6b1420,.31,.15));hinge.rotation.z=Math.PI/2;
        const cap=drum(head,side*.386,.05,-.042,.092,.023,maroon);cap.rotation.z=Math.PI/2;const lip=piece(head,new T.TorusGeometry(.095,.012,8,24),abs(0xb94842,.29,.12),side*.402,.05,-.042);lip.rotation.y=Math.PI/2;
      }
    }else{
      molded(head,[[-.247,.242,.24,111,84,159],[-.215,.344,.304,106,80,163],[-.148,.363,.321,100,77,165],[.156,.364,.321,59,78,166],[.213,.338,.299,52,81,163],[.246,.263,.25,49,91,155]],.92,skin,tr,Math.PI*.43);
      hair(head);
    }
    for(const side of [-1,1]){
      const a=group(root,side*.395,1.62,0), armMat=armor?maroon:abs(0x54555e,.31,0,.57);
      // Cross-sections follow the angled shoulder and the forward bend of the elbow.
      const rows=[[-.535,.124,.137,.136,.045],[-.49,.134,.145,.141,.044],[-.30,.147,.151,.137,.018],[-.19,.151,.158,.11,-.008],[-.06,.154,.155,.064,-.017],[.052,.132,.140,.035,-.022],[.092,.086,.099,.028,-.025]].map(([y,rx,rz,dx,z])=>[y,rx,rz,0,0,0,side*dx,z]);
      molded(a,rows,.88,armMat);
      const wrist=drum(a,side*.137,-.577,.05,.092,.124,armor?maroon:skin);const hand=clipHand(a,side*.137,armor?maroon:skin);if(armor){const cuff=drum(a,side*.137,-.522,.045,.127,.036,abs(0x711b25,.30,.12));const circle=piece(a,new T.CircleGeometry(.048,20),eyeMaterial,side*.137,-.734,.156);circle.castShadow=false;const trim=piece(a,new T.TorusGeometry(.057,.009,6,20),darkGold,side*.137,-.734,.157);trim.castShadow=false;}arms.push(a);
      const leg=group(root,side*.227,.855,0);
      const left=side<0, leftEdge=armor?(left?72:165):(left?57:132),rightEdge=armor?(left?146:238):(left?112:186);
      const legRows=[[-.833,.207,.278,armor?508:387,.055],[-.683,.209,.280,armor?480:360,.055],[-.642,.207,.225,armor?469:353,.002],[-.35,.203,.219,armor?417:311,0],[-.19,.209,.245,armor?388:292,-.015],[-.081,.205,.244,armor?362:271,-.018],[-.014,.162,.191,armor?353:264,-.018]].map(([y,rx,rz,py,z])=>[y,rx,rz,py,leftEdge,rightEdge,0,z]);
      molded(leg,legRows,.19,body,tr);
      // Side seams and separate rounded toe mold, without covering the front print.
      const seam=piece(leg,new T.BoxGeometry(.008,.025,.365),armor?abs(0x62141e,.34,.1):abs(0x0d1018,.35),side*.209,-.657,.025);seam.castShadow=false;
      // Two actual recessed socket rims on the back of each leg.
      for(const y of [-.285,-.606]){
        const socket=piece(leg,new T.TorusGeometry(.087,.018,7,18),body,0,y,-.231);
        piece(leg,new T.CircleGeometry(.082,18),mat(armor?0x48101b:0x0b1018),0,y,-.230).rotation.y=Math.PI;
        socket.rotation.y=Math.PI;
      }
      if(armor)jets.push(jet(leg));legs.push(leg);
    }
    root.userData={arms,legs,jets,head,torso,hips,visor};return root;
  }
  return figure;
}
