import { test, expect } from '@playwright/test';
const url='/astation-5-pro/games/world/index.html';
test('Green Valley loads its real 3D renderer and animated GLB, then starts gameplay',async({page})=>{
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto(url);
  await expect(page.locator('#loading')).toHaveClass(/hidden/,{timeout:45000});
  await expect(page.locator('#render canvas')).toBeVisible();
  await expect(page.getByText('WORLD', {exact:false}).first()).toBeVisible();
  await page.getByRole('button',{name:'NEW GAME'}).click();
  await expect(page.locator('#overlay')).toHaveClass(/hidden/);
  await page.keyboard.down('KeyW');await page.waitForTimeout(500);await page.keyboard.up('KeyW');
  await page.keyboard.press('Space');await page.waitForTimeout(300);
  await page.screenshot({path:'test-results/dreambound-green-valley.png'});
  await page.keyboard.press('Escape');
  await expect(page.getByText('PAUSED',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'RESUME'}).click();
  await expect(page.locator('#overlay')).toHaveClass(/hidden/);
  expect(errors).toEqual([]);
});
test('Initial v6 save is in IndexedDB and classic five-world game is still available',async({page})=>{
  await page.goto(url);
  await expect(page.locator('#loading')).toHaveClass(/hidden/,{timeout:45000});
  await page.getByRole('button',{name:'NEW GAME'}).click();
  await expect.poll(()=>page.evaluate(async()=>{
    const req=indexedDB.open('ASTATION_GAME_ENGINE_6');
    const db=await new Promise((res,rej)=>{req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)});
    const store=db.transaction('game_saves','readonly').objectStore('game_saves');
    const got=store.get('world:green-valley:v1');
    return await new Promise(res=>{got.onsuccess=()=>res(got.result?.data?.version||null)});
  }),{timeout:10000}).toBe(6);
  await page.goto(url);
  await expect(page.locator('#loading')).toHaveClass(/hidden/,{timeout:45000});
  await page.getByRole('button',{name:'CLASSIC WORLDS (1–5)'}).click();
  await expect(page).toHaveURL(/\/games\/world\/classic\.html/);
});

test('mobile touch controls are present and interactive',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await expect(page.locator('#loading')).toHaveClass(/hidden/,{timeout:45000});
  await expect(page.locator('#stick')).toBeVisible();
  await expect(page.locator('[data-input="jump"]')).toBeVisible();
  await page.getByRole('button',{name:'NEW GAME'}).click();
  await page.locator('[data-input="jump"]').tap();
  await page.locator('[data-input="pause"]').tap();
  await expect(page.getByText('PAUSED',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'RESUME'}).tap();
  await expect(page.locator('#overlay')).toHaveClass(/hidden/);
  expect(errors).toEqual([]);
  await context.close();
});
