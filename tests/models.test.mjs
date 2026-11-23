import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const DIR=new URL('../public/models/',import.meta.url);
function parseGLB(name){
  const bytes=fs.readFileSync(new URL(name,DIR));
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.readUInt32LE(4),2);
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  const jsonLength=bytes.readUInt32LE(12);
  assert.equal(bytes.toString('ascii',16,20),'JSON');
  const json=JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
  assert.ok(json.buffers[0].byteLength>0);
  const binStart=20+jsonLength;
  assert.equal(bytes.toString('ascii',binStart+4,binStart+8),'BIN\0');
  assert.ok(bytes.readUInt32LE(binStart)>=json.buffers[0].byteLength);
  const meshCount=json.meshes.length;
  assert.ok(json.materials.length>=4);
  for(const node of json.nodes){if(node.mesh!==undefined)assert.ok(node.mesh<meshCount)}
  for(const mesh of json.meshes)for(const prim of mesh.primitives){
    for(const idx of Object.values(prim.attributes||{}))assert.ok(idx<json.accessors.length);
    if(prim.indices!==undefined)assert.ok(prim.indices<json.accessors.length);
    if(prim.material!==undefined)assert.ok(prim.material<json.materials.length);
  }
  return json;
}
test('PIX MK II is a detailed GLB with all three original animation clips',()=>{
  const j=parseGLB('pix_mk2.glb');
  assert.ok(j.meshes.length>=90);
  assert.deepEqual(j.animations.map(a=>a.name).sort(),['Idle','Jump','Walk']);
  const nodes=j.nodes.map(n=>n.name);
  for(const required of ['PIX_HeadPivot','PIX_ArmL','PIX_ArmR','PIX_LegL','PIX_LegR'])assert.ok(nodes.includes(required));
  for(const a of j.animations)for(const ch of a.channels)assert.ok(ch.target.node<j.nodes.length);
});
test('The guardian, trees and arches ship as real GLB models',()=>{
  for(const [name,minMeshes]of [['guardian_mk2.glb',25],['dream_tree_mk2.glb',24],['dream_arch_mk2.glb',20]]){
    const j=parseGLB(name);assert.ok(j.meshes.length>=minMeshes,`${name} must be an actual detailed mesh`);
  }
});
test('Classic PIX model remains available as a fallback',()=>{
  const original=parseGLB('pix.glb');assert.ok(original.meshes.length>=25);
});
