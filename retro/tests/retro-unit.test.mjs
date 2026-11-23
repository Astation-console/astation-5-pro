import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateRawSync} from 'node:zlib';
import {inspectNDS, ndsCRC16, extractZipNDS, unpackLocalFile} from '../rom.js';
function crc32(data){let c=0xffffffff;for(let b of data){c^=b;for(let i=0;i<8;i++)c=c>>>1^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
export function sampleROM(){
 const rom=new Uint8Array(0x10000);const text=(s,off)=>[...s].forEach((v,i)=>rom[off+i]=v.charCodeAt(0));
 text('ASTATIONTEST',0);text('ATST',12);text('01',16);
 const v=new DataView(rom.buffer);v.setUint32(0x20,0x4000,true);v.setUint32(0x2c,0x40,true);v.setUint32(0x30,0x4200,true);v.setUint32(0x3c,0x40,true);
 for(let i=0xc0;i<0x15c;i++)rom[i]=i&255;
 v.setUint16(0x15c,ndsCRC16(rom.subarray(0xc0,0x15c)),true);v.setUint16(0x15e,ndsCRC16(rom.subarray(0,0x15e)),true);
 return rom;
}
function sampleZIP(rom){
 const name=new TextEncoder().encode('hello.nds'),packed=deflateRawSync(rom);const total=30+name.length+packed.length+46+name.length+22;const data=new Uint8Array(total),v=new DataView(data.buffer);let pos=0;
 const put=(d)=>{data.set(d,pos);pos+=d.length};
 v.setUint32(pos,0x04034b50,true);v.setUint16(pos+8,8,true);v.setUint32(pos+14,crc32(rom),true);v.setUint32(pos+18,packed.length,true);v.setUint32(pos+22,rom.length,true);v.setUint16(pos+26,name.length,true);pos+=30;put(name);put(packed);
 const cd=pos;v.setUint32(pos,0x02014b50,true);v.setUint16(pos+10,8,true);v.setUint32(pos+16,crc32(rom),true);v.setUint32(pos+20,packed.length,true);v.setUint32(pos+24,rom.length,true);v.setUint16(pos+28,name.length,true);pos+=46;put(name);
 const cdLen=pos-cd;v.setUint32(pos,0x06054b50,true);v.setUint16(pos+8,1,true);v.setUint16(pos+10,1,true);v.setUint32(pos+12,cdLen,true);v.setUint32(pos+16,cd,true);return data;
}
test('valid Nintendo DS header detected with both CRC16 fields',()=>{const info=inspectNDS(sampleROM());assert.equal(info.code,'ATST');assert.equal(info.title,'ASTATIONTEST');assert.equal(info.validHeader,true)});
test('reject corrupt Nintendo DS header',()=>{const data=sampleROM();data[21]^=2;assert.throws(()=>inspectNDS(data),/CRC16/)});
test('ZIP DEFLATE local extraction preserves one valid NDS',async()=>{const data=sampleZIP(sampleROM());const {bytes}=await extractZipNDS({size:data.length,arrayBuffer:async()=>data.buffer});assert.equal(inspectNDS(bytes).code,'ATST')});
test('ZIP CRC32 changes are detected',async()=>{const data=sampleZIP(sampleROM());data[100]^=4;await assert.rejects(()=>extractZipNDS({size:data.length,arrayBuffer:async()=>data.buffer}))});
test('local NDS file import produces a SHA-256 and Blob',async()=>{const data=sampleROM();const result=await unpackLocalFile({name:'test.nds',size:data.length,arrayBuffer:async()=>data.buffer});assert.equal(result.info.code,'ATST');assert.equal(result.blob.size,data.length);assert.equal(result.sha.length,64)});
