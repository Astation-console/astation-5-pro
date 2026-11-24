import test from 'node:test';import assert from 'node:assert/strict';import {inspectGBA} from '../../platforms/gba-format.mjs';
function header(){const b=new Uint8Array(1024);b.set(new TextEncoder().encode('ASTATION'),0xa0);b[0xb2]=0x96;let c=0;for(let i=0xa0;i<=0xbc;i++)c=(c-b[i])&255;b[0xbd]=(c-0x19)&255;return b}
test('GBA header screening accepts synthetic valid header',()=>assert.equal(inspectGBA(header()).title,'ASTATION'));
test('GBA screening rejects corrupted headers',()=>{const b=header();b[0xa0]^=1;assert.throws(()=>inspectGBA(b),/suma/);assert.throws(()=>inspectGBA(new Uint8Array(1024)),/nagłówka/)});
