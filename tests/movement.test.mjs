import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cameraRelativeMovement, JumpAssist } from '../src/games/world/Movement.js';

test('camera-relative motion follows orbit on full 360 degrees', () => {
  const eps=1e-7;
  const forward0=cameraRelativeMovement(0,-1,0);
  assert.ok(Math.abs(forward0.x)<eps && Math.abs(forward0.z+1)<eps);
  const f90=cameraRelativeMovement(0,-1,Math.PI/2);
  assert.ok(Math.abs(f90.x+1)<eps && Math.abs(f90.z)<eps);
  const right90=cameraRelativeMovement(1,0,Math.PI/2);
  assert.ok(Math.abs(right90.x)<eps && Math.abs(right90.z+1)<eps);
  const m=cameraRelativeMovement(.5,-.7,2.3);
  assert.ok(Math.abs(Math.hypot(m.x,m.z)-Math.hypot(.5,-.7)) < eps);
});

test('coyote time, buffer and double-jump have predictable windows', () => {
  let a = new JumpAssist();
  a.update(.02,true,false);
  a.update(.03,false,true);
  assert.equal(a.canGroundJump(), true);
  a.consume();
  assert.equal(a.canGroundJump(), false);
  a.update(.02,false,true);
  assert.equal(a.canAirJump(1),true);
  assert.equal(a.canAirJump(2),false);
  a.consume();
  a.update(.2,false,false);
  assert.equal(a.canAirJump(1),false);
  a.update(.01,false,true);
  a.update(.05,true,false);
  assert.equal(a.canGroundJump(),true);
  a.reset();
  assert.equal(a.canGroundJump(),false);
});
