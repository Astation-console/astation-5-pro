import {test,expect} from '@playwright/test';
const path='/astation-5-pro/';

test('OS 7 stores local accounts, preserves legacy saves, and keeps profile libraries separate',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const legacy={name:'OriginalPlayer',installed:['world'],selected:'world',downloads:[],seen:['world'],trophies:{world:[0]},history:[{id:'world',index:0,time:1}],stats:{world:{played:120,level:1}},worldSave:{stage:1,nextgen:{mission:{}}},libraryMigrationV11:true,ultimateMigration2:true,gameRevolutionMigration4:true};
  if(!localStorage.getItem('astation_profiles_v7'))localStorage.setItem('astation_pro_v2',JSON.stringify(legacy));
 });
 await page.goto(path);
 await page.locator('#power-button').click();
 await expect(page.locator('#choose')).toHaveClass(/active/,{timeout:12000});
 await expect(page.locator('#choose-name')).toHaveText('OriginalPlayer');
 await page.locator('#profile-new-name').fill('DrugiGracz');
 await page.locator('#profile-create-button').click();
 await expect(page.locator('#choose-name')).toHaveText('DrugiGracz');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('astation_pro_v2')).installed)).toEqual([]);
 await page.locator('#enter-profile').click();
 await expect(page.locator('#console')).toHaveClass(/active/);
 await page.locator('[data-action="profile"]').first().click();
 await expect(page.locator('#panel [data-action="switchprofile"]')).toBeVisible();
 await page.locator('#panel [data-action="switchprofile"]').click();
 await page.locator('[data-pid="legacy"]').click();
 await expect(page.locator('#choose-name')).toHaveText('OriginalPlayer');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('astation_pro_v2')).installed)).toEqual(['world']);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('astation_pro_v2')).history.length)).toBe(1);
 await page.reload();
 await page.locator('#power-button').click();
 await expect(page.locator('#profile-select-list [data-pid]')).toHaveCount(2);
 await expect(page.locator('#choose-name')).toHaveText('OriginalPlayer');
 expect(errors).toEqual([]);
});

test('Dreambound uses per-profile IndexedDB save slots',async({page})=>{
 await page.goto('/astation-5-pro/games/world/index.html?profile=p-test-two');
 await expect(page.locator('#loading')).toHaveClass(/hidden/,{timeout:45000});
 await page.getByRole('button',{name:'NEW GAME'}).click();
 await page.getByRole('button',{name:'Pomiń scenę'}).click();
 await expect.poll(()=>page.evaluate(async()=>{
   const req=indexedDB.open('ASTATION_GAME_ENGINE_6');
   const db=await new Promise((res,rej)=>{req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)});
   const store=db.transaction('game_saves').objectStore('game_saves');
   const scoped=store.get('world:green-valley:v1:profile:p-test-two');
   return await new Promise(res=>{scoped.onsuccess=()=>res(scoped.result?.data?.version||null)});
 }),{timeout:14000}).toBe(6);
});
