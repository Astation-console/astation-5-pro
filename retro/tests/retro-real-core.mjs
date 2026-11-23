import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,normalize,join} from 'node:path';
import {chromium} from 'playwright';
import {inspectNDS} from '../rom.js';

// An MIT-licensed homebrew program downloaded during CI, never a commercial ROM.
const testROM=process.env.ASTATION_TEST_NDS;
if (!testROM) throw new Error('Set ASTATION_TEST_NDS to MIT-licensed homebrew test ROM path');
const root=process.cwd();
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=createServer(async(req,res)=>{
  try{const path=new URL(req.url,'http://localhost').pathname;const file=normalize(join(root,decodeURIComponent(path==='/'?'/index.html':path)));
    if(!file.startsWith(root))throw Error('Invalid path');const data=await readFile(file);
    res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(data);
  }catch{res.statusCode=404;res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
  const page=await browser.newPage({viewport:{width:1280,height:820}});
  const errors=[];
  page.on('pageerror',err=>errors.push(String(err.message).slice(0,400)));
  const url=`http://127.0.0.1:${server.address().port}/retro/index.html?profile=homebrew-qa`;
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#library-grid .empty-card').waitFor({timeout:20000});
  const file=await readFile(testROM);
  try{console.log('HOME BREW HEADER',inspectNDS(new Uint8Array(file)))}catch(e){console.log('HOME BREW FORMAT CHECK',e.message,'head',Buffer.from(file).subarray(0,32).toString('hex'))}
  await page.locator('#rom-input').setInputFiles({name:'hash-bench-nds.nds',mimeType:'application/octet-stream',buffer:file});
  try{await page.locator('.game-card').waitFor({timeout:12000})}catch(e){const report=await page.evaluate(()=>({toast:document.querySelector('#toast')?.textContent,library:document.querySelector('#library-grid')?.innerText}));throw new Error('Homebrew import failed: '+JSON.stringify(report),{cause:e})}
  await page.getByRole('button',{name:'Graj'}).click();
  const iframe=page.frameLocator('#player-frame');
  await iframe.locator('#game').waitFor({timeout:15000});
  const timer=Date.now();
  await page.waitForFunction(()=>{
    const frame=document.querySelector('#player-frame');
    return !!(frame?.contentWindow?.EJS_emulator?.started);
  },null,{timeout:150000,polling:500});
  const info=await iframe.locator('body').evaluate(()=>({
    core:window.EJS_core,started:window.EJS_emulator?.started,
    canvasCount:document.querySelectorAll('canvas').length,
    emulator:window.EJS_emulator?.constructor?.name
  }));
  assert.equal(info.core,'desmume');
  assert.equal(info.started,true);
  assert.ok(info.canvasCount>=1,'Actual DS game renderer must create canvas');
  await page.screenshot({path:'/tmp/astation-retro8-homebrew.png'}).catch(()=>{});
  console.log('PASS: actual DeSmuME WASM core booted permissively-licensed DS program',JSON.stringify({...info,seconds:Math.round((Date.now()-timer)/1000),pageerrors:errors.slice(0,3)}));
} finally {await browser?.close();await new Promise(res=>server.close(res))}
