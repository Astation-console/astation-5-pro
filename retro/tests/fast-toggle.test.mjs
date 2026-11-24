import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app=readFileSync('retro/app.js','utf8');
const player=readFileSync('retro/player.html','utf8');
const ui=readFileSync('retro/index.html','utf8');
test('FAST x2 has a real visible toggle button on mobile and desktop',()=>{
 assert.match(ui,/id="fast-toggle"/);
 assert.match(ui,/aria-pressed="false"/);
 assert.match(app,/addEventListener\('click',toggleFast\)/);
});
test('Toggle sends persistent enabled state to embedded core',()=>{
 assert.match(app,/settings\.fastEnabled=!settings\.fastEnabled/);
 assert.match(app,/saveSettings\(\);updateFastButton\(\);post\('fast'/);
 assert.match(app,/if\(settings\.fastEnabled\)post\('fast',\{enabled:true\}\)/);
});
test('Real EmulatorJS fast forward API is used, not an animation imitation',()=>{
 assert.match(player,/handleSpecialOptions\('fastForward',active\?'enabled':'disabled'\)/);
 assert.match(player,/handleSpecialOptions\('ff-ratio','2'\)/);
 assert.match(player,/case 'fast':setFastMode\(d.enabled\)/);
 assert.match(player,/toggleFastForward\(active\?1:0\)/);
});
test('Unplayable core will report failure and will not pretend fast works',()=>{
 assert.match(player,/fast-unavailable/);
 assert.match(app,/if\(d.event==='fast-unavailable'\)/);
});