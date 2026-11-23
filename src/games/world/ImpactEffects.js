import * as THREE from 'three';

/** Pooled, low-cost emissive 3D particles for collectibles, dash trails and landings. */
export class ImpactEffects {
  constructor(scene, quality = 'balanced') {
    this.scene = scene;
    this.count = quality === 'performance' ? 24 : 48;
    this.geo = new THREE.IcosahedronGeometry(.085, 0);
    this.mat = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: false, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending });
    this.mesh = new THREE.InstancedMesh(this.geo, this.mat, this.count);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
    this.particles = Array.from({length:this.count},()=>({life:0,max:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,color:0xffffff}));
    this.cursor = 0;
    this.dummy = new THREE.Object3D();
    this.tempColor = new THREE.Color();
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for(let i=0;i<this.count;i++){this.dummy.scale.setScalar(0);this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix);}
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  spawn(x,y,z,color=0x99ffff,count=8,power=1) {
    for(let i=0;i<count;i++){
      const p=this.particles[this.cursor];
      const angle=(i/count)*Math.PI*2+Math.random()*.4;
      const speed=(1+Math.random()*2)*power;
      Object.assign(p,{life:.42+Math.random()*.45,max:.85,x,y,z,vx:Math.cos(angle)*speed,vy:(1.1+Math.random()*2.3)*power,vz:Math.sin(angle)*speed,color});
      this.cursor=(this.cursor+1)%this.count;
    }
  }
  trail(x,y,z,baseColor=0x7deefe){this.spawn(x,y,z,baseColor,2,.42);}
  update(dt) {
    let touched=false;
    for(let i=0;i<this.count;i++){
      const p=this.particles[i];
      if(p.life>0){
        p.life=Math.max(0,p.life-dt);
        p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=3.7*dt;
      }
      const scale=p.life>0 ? (.45+p.life/p.max)*Math.min(1,p.life/.17):0;
      this.dummy.position.set(p.x,p.y,p.z);this.dummy.scale.setScalar(scale);this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i,this.dummy.matrix);
      if(p.life>0){this.tempColor.setHex(p.color);this.mesh.setColorAt(i,this.tempColor);}
      touched=true;
    }
    if(touched){this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;}
  }
  dispose(){this.scene.remove(this.mesh);this.geo.dispose();this.mat.dispose();}
}
