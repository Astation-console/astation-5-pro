import test from 'node:test';
import assert from 'node:assert/strict';
import { InputManager } from '../src/input/InputManager.js';

test('Short Escape key tap is remembered even if released between fixed physics frames', () => {
  const previous = globalThis.window;
  const target=new EventTarget();
  globalThis.window=target;
  const canvas=new EventTarget(); canvas.setPointerCapture=()=>{};
  const input=new InputManager(canvas, null, null);
  const keyEvent=(name,code)=>{const ev=new Event(name,{cancelable:true});Object.defineProperty(ev,'code',{value:code});target.dispatchEvent(ev)};
  try {
    keyEvent('keydown','Escape');keyEvent('keyup','Escape');
    const got=input.read();assert.equal(got.just.pause,true);
    assert.equal(input.read().just.pause,false);
    keyEvent('keydown','Space');keyEvent('keyup','Space');
    assert.equal(input.read().just.jump,true);
  } finally{input.dispose();globalThis.window=previous;}
});
