import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const player=readFileSync('retro/player.html','utf8');
const ui=readFileSync('retro/index.html','utf8');
const src=readFileSync('retro/smart-performance.js','utf8');
test('normal speed, no forced fast forward',()=>{
 assert.doesNotMatch(ui,/id="fast-toggle"/);
 assert.doesNotMatch(player,/enableAutomaticBoost|toggleFastForward\(1\)/);
 assert.match(player,/smart.start\(\)/);
 const calls=[],ctx=vm.createContext({performance:{now:()=>0},setInterval:()=>1,clearInterval(){}});
 vm.runInContext(src,ctx);
 const manager=ctx.AstationSmartPerformance.create({getCore:()=>({handleSpecialOptions:(...a)=>calls.push(a)}),report(){}});
 manager.start();manager.stop();
 assert.deepEqual(calls,[['fastForward','disabled']]);
});
test('adaptive skip has bounds and hysteresis',()=>{
 const ctx=vm.createContext({});vm.runInContext(src,ctx);
 const f=ctx.AstationSmartPerformance.chooseSkip;
 assert.equal(f(0,40,0,2),0);assert.equal(f(0,40,0,3),1);assert.equal(f(2,40,0,3),2);
 assert.equal(f(2,60,5,0),1);assert.equal(f(0,60,5,0),0);
});
