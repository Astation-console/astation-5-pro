import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,join,normalize} from 'node:path';
import {chromium} from 'playwright';
import {ndsCRC16} from '../rom.js';

// Test-only synthetic NDS files with valid headers. No copyrighted ROMs are used.
function syntheticNDS(title,code){
 const rom=new Uint8Array(0x10000), v=new DataView(rom.buffer);
 rom.set(new TextEncoder().encode(title),0); rom.set(new TextEncoder().encode(code),12);
 rom.set(new TextEncoder().encode('01'),16);
 v.setUint32(0x20,0x4000,true);v.setUint32(0x2c,0x40,true);
 v.setUint32(0x30,0x4200,true);v.setUint32(0x3c,0x40,true);
 for(let i=0xc0;i<0x15c;i++)rom[i]=i&255;
 v.setUint16(0x15c,ndsCRC16(rom.subarray(0xc0,0x15c)),true);
 v.setUint16(0x15e,ndsCRC16(rom.subarray(0,0x15e)),true);
 return Buffer.from(rom);
}

const root=process.cwd(), mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
   let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file=normalize(join(root,pathname==='/'?'index.html':pathname.replace(/^\//,'')));
   if(!file.startsWith(root))throw Error('Bad path');
   res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
 for(const mobile of [false,true]){
  const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:850},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  await page.route('https://cdnjs.cloudflare.com/**',r=>r.abort());
  await page.route('https://i.ebayimg.com/**',r=>r.abort());
  await page.route('https://cdn.mobygames.com/**',r=>r.abort());
  // Stub only the external emulator runtime to test app integration and local ROM bytes.
  // A separate workflow test executes the actual WASM core against open-source homebrew.
  await page.route('https://cdn.emulatorjs.org/**',r=>r.request().url().endsWith('/loader.js')?
    r.fulfill({status:200,contentType:'application/javascript',body:`
       window.EJS_emulator={started:true,paused:false,play(){this.paused=false},pause(){this.paused=true},gameManager:{saveSaveFiles(){}}};
       fetch(window.EJS_gameUrl).then(r=>r.arrayBuffer()).then(buf=>{
          const raw=new Uint8Array(buf);
          window.__actualReceivedROM={length:raw.length,code:String.fromCharCode(...raw.slice(12,16))};
          window.EJS_ready?.();window.EJS_onGameStart?.();
       }).catch(e=>{window.__testROMError=String(e);});
    `}):r.abort());
  await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('#power-button').click();
  await page.locator('#enter-profile').waitFor({state:'visible',timeout:15000});
  await page.locator('#enter-profile').click();
  await page.locator('#console.active').waitFor({timeout:15000});
  await page.locator('#nav-media').click();
  const mario=page.locator('button.product[data-id=retro]'), cod=page.locator('button.product[data-id=retro_cod]');
  await mario.waitFor();await cod.waitFor();
  assert.equal(await mario.locator('.as-cover img').count(),1,'Cover image for Mario is present');
  assert.equal(await cod.locator('.as-cover img').count(),1,'Cover image for Black Ops is present');
  for(const [id,game,code,title] of [
    ['retro','mario','A2DE','NEW MARIO'],
    ['retro_cod','cod','BDYE','CALLOFDUTY7']
  ]){
    await page.locator(`button.product[data-id=${id}]`).click();
    await page.locator(`button[data-action=install][data-id=${id}]`).click();
    await page.waitForFunction(id=>{const profiles=JSON.parse(localStorage.getItem('astation_profiles_v7')||'{}');return profiles.saves?.[profiles.active]?.installed?.includes(id)},id,{timeout:15000});
    await page.locator('#panel [data-action=closepanel]').first().click();
    await page.locator(`button[data-pick=${id}]`).click();
    await page.locator(`#hero-copy button[data-action=launch][data-id=${id}]`).click();
    await page.locator('#ast-retro-shell iframe').waitFor({timeout:10000});
    assert.match(await page.locator('#ast-retro-shell iframe').getAttribute('src'),new RegExp('game='+game));
    const frame=page.frameLocator('#ast-retro-shell iframe');
    await frame.locator('#rom-input').waitFor({state:'attached',timeout:14000});
    await frame.locator('#rom-input').setInputFiles({name:`synthetic-${game}.nds`,mimeType:'application/octet-stream',buffer:syntheticNDS(title,code)});
    await frame.locator('#playing-title').waitFor({state:'visible',timeout:16000});
    await page.waitForFunction(code=>{const retro=document.querySelector('#ast-retro-shell iframe')?.contentWindow;const child=retro?.document.querySelector('#player-frame')?.contentWindow;return child?.__actualReceivedROM?.code===code},code,{timeout:25000});
    const received=await page.evaluate(()=>document.querySelector('#ast-retro-shell iframe').contentWindow.document.querySelector('#player-frame').contentWindow.__actualReceivedROM);
    assert.equal(received.length,0x10000);
    await frame.locator('#os-back').click();
    await page.locator('#ast-retro-shell').waitFor({state:'detached',timeout:12000});
    await page.locator('#nav-media').click();
  }
  await page.reload();
  await page.locator('#power-button').click();
  await page.locator('#enter-profile').waitFor({state:'visible',timeout:14000});
  await page.locator('#enter-profile').click();
  await page.locator('#console.active').waitFor({timeout:14000});
  for(const [id,game,code] of [['retro','mario','A2DE'],['retro_cod','cod','BDYE']]){
    await page.locator(`button[data-pick=${id}]`).click();
    await page.locator(`#hero-copy button[data-action=launch][data-id=${id}]`).click();
    const frame=page.frameLocator('#ast-retro-shell iframe');
    await frame.locator('#playing-title').waitFor({state:'visible',timeout:14000});
    await page.waitForFunction(code=>document.querySelector('#ast-retro-shell iframe')?.contentWindow?.document.querySelector('#player-frame')?.contentWindow?.__actualReceivedROM?.code===code,code,{timeout:25000});
    await frame.locator('#os-back').click();
    await page.locator('#ast-retro-shell').waitFor({state:'detached',timeout:12000});
  }
  assert.deepEqual(errors,[],`JavaScript errors: ${errors.join('; ')}`);
  console.log(`PASS: console boots, two Store titles install, local NDS bytes passed to SAME iframe, auto-launch persisted games, exit OS (${mobile?'mobile':'desktop'})`);
  await ctx.close();
 }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
