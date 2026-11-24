import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {join,extname,normalize} from 'node:path';
import {chromium} from 'playwright';
import {sampleROM} from './retro-unit.test.mjs';
const baseDir=process.cwd();
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
const server=createServer(async(req,res)=>{
  try {let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/')pathname='/index.html';const file=normalize(join(baseDir,pathname));if(!file.startsWith(baseDir))throw Error('path');const bytes=await readFile(file);res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(bytes)}
  catch {res.statusCode=404;res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port,origin=`http://127.0.0.1:${port}`;
let browser;
try {
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1300,height:850}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdnjs.cloudflare.com/**',r=>r.abort());
  await page.route('https://cdn.emulatorjs.org/stable/data/loader.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:"window.EJS_emulator={pause(){},play(){},setVolume(){},handleSpecialOptions(k,v){window.__boostOptions??={};window.__boostOptions[k]=v},gameManager:{setVariable(){},saveSaveFiles(){},restart(){},getState(){return new Uint8Array([1,2,3,4])},loadState(bytes){window.__loadedState=Array.from(bytes)}}};window.EJS_ready();setTimeout(()=>window.EJS_onGameStart(),1200);"}));
  await page.goto(origin+'/retro/index.html?profile=qa',{waitUntil:'domcontentloaded'});
  await page.locator('#library-grid .empty-card').waitFor();
  assert.equal(await page.locator('#import-btn').isVisible(),true);
  const data=sampleROM();
  await page.locator('#rom-input').setInputFiles({name:'hello.nds',mimeType:'application/octet-stream',buffer:Buffer.from(data)});
  await page.locator('#library-grid .game-card').first().waitFor({timeout:20000});
  assert.match(await page.locator('.game-card h3').first().innerText(),/ASTATIONTEST/);
  await page.getByRole('button',{name:'Graj'}).click();
  await page.waitForFunction(()=>document.querySelector('#player-frame').contentWindow?.EJS_core==='desmume',{timeout:12000});
  assert.equal(await page.frameLocator('#player-frame').locator('body').evaluate(()=>window.EJS_gameUrl.startsWith('blob:')),true);
  await page.waitForFunction(()=>document.querySelector('#playing-status')?.textContent?.includes('Gra uruchomiona'),null,{timeout:10000});
  assert.equal(await page.locator('#player-recovery').isVisible(),false,'no premature error overlay');
  await page.waitForFunction(()=>document.querySelector('#player-frame').contentWindow.__boostOptions?.fastForward==='enabled');
  assert.equal(await page.locator('#fast-toggle').count(),0);

  await page.locator('#play-menu').click();assert.equal(await page.locator('#pause-overlay').isVisible(),true);
  await page.locator('[data-pause=save]').click();
  await page.locator('[data-pause=snapshot]').click();
  await page.waitForFunction(()=>document.querySelector('#toast')?.textContent?.includes('Zapisano stan'));
  page.once('dialog',d=>d.accept());await page.locator('[data-pause=restore]').click();
  await page.waitForFunction(()=>document.querySelector('#player-frame')?.contentWindow?.__loadedState?.join(',')==='1,2,3,4');
  await page.locator('[data-pause=layout]').click();await page.locator('[data-pause=resume]').click();
  await page.locator('#play-exit').click();await page.locator('#library-view').waitFor({state:'visible',timeout:10000});
  await page.reload();await page.locator('#library-grid .game-card').first().waitFor({timeout:10000});
  assert.match(await page.locator('.game-card').first().innerText(),/Sesje: 1/);
  await page.getByRole('button',{name:'Graj'}).click();
  await page.waitForFunction(()=>document.querySelector('#playing-status')?.textContent?.includes('Gra uruchomiona')||document.querySelector('#playing-status')?.textContent?.includes('Normalne tempo'));
  await page.locator('#play-menu').click();page.once('dialog',d=>d.accept());await page.locator('[data-pause=restore]').click();
  await page.waitForFunction(()=>document.querySelector('#player-frame')?.contentWindow?.__loadedState?.join(',')==='1,2,3,4');
  assert.equal(errors.length,0,'browser errors: '+errors.join(';'));
  console.log('PASS: real browser DOM, ROM import, local blob handoff, pause, layouts, save API, IndexedDB persistence');
  // Verify OS bridge without touching existing system internals.
  await page.goto(origin+'/legacy.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.AstationRetro?.open);
  assert.equal(await page.locator('#retro-nav').count(),0,'no uninstalled RETRO shortcut');
  await page.evaluate(()=>window.AstationRetro.open());
  await page.locator('#ast-retro-shell iframe').waitFor();
  assert.equal(await page.locator('#ast-retro-shell').count(),1);
  console.log('PASS: ASTATION OS 7 on-demand system-app overlay (not an auto-inserted shortcut)');
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve))}
