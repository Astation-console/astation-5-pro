import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectPixLocomotion,pixLean} from '../src/core/AnimationState.js';

const file=new URL('../public/models/pix_cinematic_6_4.glb',import.meta.url);
const bytes=fs.readFileSync(file);
const jsonLength=bytes.readUInt32LE(12);
const glb=JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
const binPos=20+jsonLength;
const binary=bytes.subarray(binPos+8);
function accessor(index){
  const a=glb.accessors[index], view=glb.bufferViews[a.bufferView];
  const width=({SCALAR:1,VEC3:3,VEC4:4})[a.type];
  return new Float32Array(binary.buffer,binary.byteOffset+view.byteOffset+(a.byteOffset||0),a.count*width);
}
test('PIX cinematic model preserves real meshes and the eleven original pose clips',()=>{
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  assert.ok(glb.meshes.length>=90);
  assert.equal(glb.asset.extras.animationRevision,'6.4.0');
  assert.deepEqual(glb.animations.map(a=>a.name).sort(),['Idle','Walk','Run','Jump','DoubleJump','Fall','Land','Dash','Interact','Victory','Stumble'].sort());
  assert.ok(glb.nodes.some(n=>n.name==='PIX_HeadPivot'));
});
test('all clips use valid rig tracks, normalized rotations, and consistent durations',()=>{
  for(const clip of glb.animations){
    assert.ok(clip.channels.length>=7,`${clip.name}: six animated pivots plus breathing root`);
    for(const ch of clip.channels){
      const s=clip.samplers[ch.sampler],a=glb.accessors[s.output];
      const times=accessor(s.input),values=accessor(s.output);
      assert.equal(times.length,a.count);
      for(let i=1;i<times.length;i++) assert.ok(times[i]>times[i-1],clip.name);
      assert.ok(ch.target.node<glb.nodes.length);
      assert.ok(!('matrix' in glb.nodes[ch.target.node]),'Animated nodes must use glTF TRS');
      for(const v of values) assert.ok(Number.isFinite(v));
      if(ch.target.path==='rotation')for(let i=0;i<values.length;i+=4){
        const norm=Math.hypot(...values.subarray(i,i+4));
        assert.ok(Math.abs(norm-1)<.0001,clip.name);
      }
    }
  }
});
test('seamless Idle, Walk, Run locomotion loops have matching end poses',()=>{
  for(const name of ['Idle','Walk','Run']){
    const clip=glb.animations.find(a=>a.name===name);
    for(const ch of clip.channels){
      const a=glb.accessors[clip.samplers[ch.sampler].output],width=a.type==='VEC4'?4:3,values=accessor(clip.samplers[ch.sampler].output);
      for(let i=0;i<width;i++)assert.ok(Math.abs(values[i]-values[values.length-width+i])<.00015, name);
    }
  }
});
test('grounded, sprint, fall and jump states select different authored animations',()=>{
  assert.equal(selectPixLocomotion({grounded:true,move:0}),'Idle');
  assert.equal(selectPixLocomotion({grounded:true,move:.8}),'Walk');
  assert.equal(selectPixLocomotion({grounded:true,move:1,sprint:true}),'Run');
  assert.equal(selectPixLocomotion({grounded:false,verticalSpeed:3}),'Jump');
  assert.equal(selectPixLocomotion({grounded:false,verticalSpeed:-2}),'Fall');
  assert.equal(selectPixLocomotion({grounded:true,dashing:true}),'Dash');
  assert.ok(pixLean({dashing:true}).forward>pixLean({move:1,sprint:true}).forward);
  assert.equal(pixLean({turn:400}).bank,.14);
});
