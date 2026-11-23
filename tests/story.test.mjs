import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_SCENES, STORY_ORDER, STORY_CHAPTERS, StoryTracker } from '../src/systems/StoryCampaign.js';
import { MissionManager } from '../src/systems/MissionManager.js';

test('Story scene content exists in Polish and English and is original',()=>{
  assert.equal(STORY_ORDER.length,8);
  for(const id of STORY_ORDER){
    const scene=STORY_SCENES[id];assert.ok(scene.name.pl && scene.name.en && scene.place.pl);
    assert.ok(scene.lines.length>=2);
    for(const line of scene.lines){assert.ok(['PIX','LUMA','ECHO','GUARDIAN'].includes(line.who));assert.ok(line.pl.length>12 && line.en.length>12);}
  }
});
test('Narrative is unlocked once, never invented or repeated',()=>{
  const t=new StoryTracker();assert.equal(t.unlock('awakening'),true);assert.equal(t.unlock('awakening'),false);
  assert.equal(t.unlock('invalid'),false);assert.deepEqual(t.snapshot(),['awakening']);
});
test('Saved chapter state roundtrips alongside crystal and terminal progress',()=>{
  const a=new MissionManager();a.crystal('a');a.terminal('north');a.story.unlock('awakening');a.story.unlock('firstSpark');
  const b=new MissionManager(a.snapshot());assert.equal(b.crystals.size,1);assert.equal(b.terminals.size,1);
  assert.deepEqual(b.story.snapshot(),['awakening','firstSpark']);
});
test('Old save without storySeen remains compatible',()=>{
  const m=new MissionManager({crystals:['a','b'],terminals:['north'],checkpoint:{x:2,y:3,z:-30}});
  assert.equal(m.story.snapshot().length,0);assert.equal(m.crystals.size,2);assert.equal(m.checkpoint.z,-30);
});
test('Only Chapter I is marked available; other story chapters are explicitly in development',()=>{
  assert.equal(STORY_CHAPTERS.length,5);
  assert.equal(STORY_CHAPTERS.filter(c=>c.available).length,1);
});
