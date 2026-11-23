import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {join,extname,normalize} from 'node:path';
import {chromium} from 'playwright';
import {sampleROM} from './retro-unit.test.mjs';

const root=process.cwd(), mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=createServer(async(req,res)=>{
  try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path==='/')path='/index.html';const file=normalize(join(root,path));if(!file.startsWith(root))throw Error('invalid path');res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(await readFile(file))}catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:850},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
  const page=await context.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
  const origin=`http://127.0.0.1:${server.address().port}`;
  await page.route('https://cdnjs.cloudflare.com/**',route=>route.abort());
  await page.goto(origin+'/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('#power-button').click();
  await page.locator('#enter-profile').waitFor({state:'visible',timeout:12000});
  await page.locator('#enter-profile').click();
  await page.locator('#console.active').waitFor({timeout:15000});
  assert.equal(await page.locator('#retro-tile').count(),0,'old hardcoded RETRO tile must be gone');
  await page.locator('#nav-media').click();
  await page.locator('button.product[data-id=retro]').waitFor({timeout:10000});
  await page.locator('button.product[data-id=retro]').click();
  assert.match(await page.locator('#panel').innerText(),/ROM|Nintendo DS/);
  await page.locator('button[data-action=install][data-id=retro]').click();
  await page.waitForFunction(()=>{try{const v=JSON.parse(localStorage.getItem('astation_profiles_v7')||'{}');return !!v.saves?.[v.active]?.installed?.includes('retro')}catch{return false}},null,{timeout:14000});
  await page.locator('#panel [data-action=closepanel]').first().click();
  await page.locator('button[data-pick=retro]').click();
  await page.locator('#hero-copy button[data-action=launch][data-id=retro]').click();
  await page.locator('#ast-retro-shell iframe').waitFor({timeout:10000});
  const frame=page.frameLocator('#ast-retro-shell iframe');await frame.locator('#import-btn').waitFor({timeout:15000});
  await frame.locator('#settings-open').click();
  const core=await frame.locator('#core-select').inputValue();
  assert.equal(core,mobile?'desmume2015':'desmume','mobile defaults to lighter core');
  await frame.locator('#settings-close').click();
  const data=sampleROM();
  await frame.locator('#rom-input').setInputFiles({name:'homebrew.nds',mimeType:'application/octet-stream',buffer:Buffer.from(data)});
  await frame.locator('#library-grid .game-card').waitFor({timeout:15000});
  await frame.locator('#os-back').click();
  await page.locator('#ast-retro-shell').waitFor({state:'detached',timeout:12000});
  await page.reload();
  await page.locator('#power-button').click();
  await page.locator('#enter-profile').waitFor({state:'visible',timeout:12000});
  await page.locator('#enter-profile').click();
  await page.locator('#console.active').waitFor({timeout:12000});
  assert.equal(await page.locator('button[data-pick=retro]').count(),1,'install persists after refresh');
  assert.deepEqual(errors,[],'no browser JS errors');
  await context.close();
  console.log(`PASS: ASTATION OS Store -> simulated install -> RETRO -> ROM import -> OS -> persist (${mobile?'mobile':'desktop'})`);
 }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
