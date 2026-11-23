import {test} from 'node:test';
import assert from 'node:assert/strict';
import {beamHazard,orbHazard,gateHazard,canSpotPlayer} from '../src/games/world/HazardLogic.js';
test('beam is dodgeable with height or by moving away',()=>{
  assert.equal(beamHazard({x:-.65,y:2.7,z:-16},0),true);
  assert.equal(beamHazard({x:-.65,y:5,z:-16},0),false);
  assert.equal(beamHazard({x:3,y:2.7,z:-16},0),false);
});
test('moving orb and gate avoid phantom hits',()=>{
  assert.equal(orbHazard({x:0,y:2.5,z:-43.8},{x:0,y:2.5,z:-43.8}),true);
  assert.equal(orbHazard({x:0,y:6,z:-43.8},{x:0,y:2.5,z:-43.8}),false);
  assert.equal(gateHazard({x:0,y:6,z:-89},0),false);
  assert.equal(gateHazard({x:0,y:2,z:-60},0),false);
});
test('guard needs proximity and line-of-sight cone',()=>{
  const enemy={x:0,z:0};
  assert.equal(canSpotPlayer(enemy,{x:0,z:-4},0,-1),true);
  assert.equal(canSpotPlayer(enemy,{x:0,z:4},0,-1),false);
  assert.equal(canSpotPlayer(enemy,{x:0,z:-12},0,-1),false);
});
