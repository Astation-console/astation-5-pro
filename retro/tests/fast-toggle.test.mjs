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
test('automatic profiles never drop video frames; user can choose custom settings',()=>{
 const ctx=vm.createContext({performance:{now:()=>0},setInterval:()=>1,clearInterval(){}});
 vm.runInContext(src,ctx);
 const f=ctx.AstationSmartPerformance.chooseSkip;
 for(const fps of [15,20,30,60])for(const skip of [0,1,2,3])assert.equal(f(skip,fps,0,20),0);
 const calls=[],gm={setVariable:(...a)=>calls.push(a)};
 const sm=ctx.AstationSmartPerformance.create({getCore:()=>({gameManager:gm}),report(){},initial:2,adaptive:true});
 sm.start();sm.stop();
 assert.deepEqual(calls,[['desmume_frameskip','0'],['desmume_internal_resolution','256x192']]);
});
