import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const os=readFileSync('index.html','utf8');
const bridge=readFileSync('retro/bridge.js','utf8');
const player=readFileSync('retro/player.html','utf8');
const app=readFileSync('retro/app.js','utf8');
test('ASTATION Store offers both standalone DS game launcher cards',()=>{
 assert.match(os,/games\.push\(\{id:'retro'/);
 assert.match(os,/games\.push\(\{id:'retro_cod'/);
 assert.match(os,/if\(id==='retro'\|\|id==='retro_cod'\)/);
 assert.match(os,/Ta instalacja dodaje launcher gry/);
});
test('launcher remains a system-integrated iframe, not a second fake console',()=>{
 assert.match(bridge,/window\.AstationRetro=Object\.freeze/);
 assert.match(bridge,/options\.game==='cod'/);
 assert.doesNotMatch(bridge,/retro-nav|retro-tile/);
});
test('mobile performance settings use real DeSmuME options',()=>{
 assert.match(app,/desmume2015/);
 assert.match(app,/performance-select/);
 assert.match(player,/desmume_frameskip/);
 assert.match(player,/desmume_internal_resolution/);
});
test('local ROM Blob moves into the emulator iframe, no parent-frame blob URL',()=>{
 assert.match(app,/romBlob:activeBlob\(state\.playing\)/);
 assert.match(player,/cfg\.romBlob instanceof Blob/);
 assert.match(player,/URL\.createObjectURL\(localRom\)/);
});
test('commercial ROM data is never shipped in public files',()=>{
 assert.doesNotMatch(os,/New Super Mario Bros\.\.zip/);
 assert.doesNotMatch(os,/Call of Duty - Black Ops \(USA\)\.zip/);
 assert.doesNotMatch(bridge,/https?:\/\/.*\.nds/i);
});
