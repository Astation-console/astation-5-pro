import test from 'node:test';
import assert from 'node:assert/strict';
import { MissionManager } from '../src/systems/MissionManager.js';
import { TrophyBridge } from '../src/systems/TrophyBridge.js';
import { SaveManager } from '../src/systems/SaveManager.js';

test('Mission begins with zero collected items and zero terminals', () => {
  const m=new MissionManager();
  assert.equal(m.progress(),0);
  assert.equal(m.canComplete(),false);
});
test('Each crystal and terminal is only counted once; completion requires actual events', () => {
  const m=new MissionManager();
  for(const id of ['a','b','c','d','e','f'])assert.equal(m.crystal(id),true);
  assert.equal(m.crystal('f'),false);
  assert.equal(m.progress(),60);
  assert.equal(m.canComplete(),false);
  assert.equal(m.terminal('north'),true);
  assert.equal(m.terminal('north'),false);
  assert.equal(m.canComplete(),false);
  assert.equal(m.terminal('south'),true);
  assert.equal(m.progress(),100);
  assert.equal(m.canComplete(),true);
  assert.equal(m.finish(),true);
});
test('Progress snapshots restore checkpoints, collectibles and completions', () => {
  const m=new MissionManager();m.crystal('a');m.terminal('north');
  m.checkpoint={x:1,y:3,z:-57};m.played=27;
  const copied=new MissionManager(JSON.parse(JSON.stringify(m.snapshot())));
  assert.equal(copied.crystals.has('a'),true);
  assert.equal(copied.terminals.has('north'),true);
  assert.equal(copied.checkpoint.z,-57);
  assert.equal(copied.played,27);
});
test('ASTATION trophy bridge does not emit arbitrary events', () => {
  const bridge=new TrophyBridge();
  assert.throws(()=>bridge.send('fake_trophy_granted'),/Unsupported/);
});
test('SaveManager operates in local fallback and saves namespaced v6 data only', async () => {
  const previous=globalThis.localStorage;
  const map=new Map();
  globalThis.localStorage={getItem:key=>map.get(key)||null,setItem:(key,val)=>map.set(key,val)};
  try {
    const manager=new SaveManager();
    await manager.init();
    await manager.save({version:6,mission:{crystals:['a']}});
    const got=await manager.load();
    assert.deepEqual(got,{version:6,mission:{crystals:['a']}});
    assert.equal(map.has('ASTATION_WORLD_DREAMBOUND_v4'),false);
  } finally {globalThis.localStorage=previous;}
});
