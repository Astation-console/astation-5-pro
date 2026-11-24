import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync('retro/app.js','utf8');
const player=readFileSync('retro/player.html','utf8');
const ui=readFileSync('retro/index.html','utf8');
test('Auto Boost runs at game start without user input or old profile preference',()=>{
 assert.doesNotMatch(ui,/id="fast-toggle"/);
 assert.doesNotMatch(app,/toggleFast\(/);
 assert.match(player,/window\.EJS_onGameStart=\(\)=>\{[\s\S]*?enableAutomaticBoost\(\)/);
 assert.match(app,/delete current\.fastEnabled/);
 assert.match(player,/case 'resume':[\s\S]*?enableAutomaticBoost\(\)/);
});
function runBoost(em){
 const events=[];
 const context=vm.createContext({window:{EJS_emulator:em},gameStarted:true,boostTimer:0,clearTimeout(){},setTimeout(){return 1},post:(...args)=>events.push(args),Error,String});
 const start=player.indexOf('function enableAutomaticBoost(');
 const end=player.indexOf('\nconst isIOS',start);
 vm.runInContext(player.slice(start,end)+'\nenableAutomaticBoost();',context);
 return events;
}
test('Auto Boost calls real special options API with 2x enabled',()=>{
 const calls=[];
 const events=runBoost({handleSpecialOptions:(...a)=>calls.push(a)});
 assert.deepEqual(calls,[['ff-ratio','2'],['fastForward','enabled']]);
 assert.equal(events[0][0],'fast-state');
 assert.equal(events[0][1].enabled,true);
});
test('Auto Boost uses direct manager API fallback',()=>{
 const calls=[];
 const em={gameManager:{setFastForwardRatio:n=>calls.push(n),toggleFastForward:n=>calls.push(n)}};
 const events=runBoost(em);
 assert.deepEqual(calls,[2,1]);
 assert.equal(em.isFastForward,true);
 assert.equal(events[0][1].enabled,true);
});
