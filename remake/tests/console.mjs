import assert from 'node:assert/strict';

export async function testRemake(browser,origin){
 for(const viewport of [{width:1280,height:800},{width:390,height:844},{width:844,height:390}]){
  const ctx=await browser.newContext({viewport,hasTouch:viewport.width<900,serviceWorkers:'block'});
  try{
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/index.html');
   await page.getByRole('heading',{name:'ORBIT RUSH',exact:true,level:1}).waitFor();
   assert.equal(await page.locator('.game-card').count(),4);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.getByRole('button',{name:'Play now',exact:true}).click();
   await page.waitForFunction(()=>Number(document.querySelector('#session iframe')?.contentDocument?.querySelector('#score')?.textContent)>0);
   await page.getByRole('button',{name:'Exit game',exact:true}).click();
   await page.getByRole('button',{name:/Trophies 1 \/ 20/}).click();
   await page.getByText('First flight',{exact:true}).waitFor();
   await page.getByRole('button',{name:'Store',exact:true}).click();
   await page.getByPlaceholder('Search games').fill('Mario');
   assert.equal(await page.locator('.game-card').count(),1);
   await page.locator('.game-card').click();
   await page.getByRole('button',{name:'Set up game',exact:true}).click();
   await page.getByRole('button',{name:'Choose game file'}).waitFor();
   await page.getByRole('button',{name:'Close',exact:true}).click();
   await page.getByRole('button',{name:'Theme music'}).click();
   await page.locator('dialog').getByText('Overworld (Remix) — Qumu',{exact:true}).waitFor();
   await page.getByRole('button',{name:'Close',exact:true}).click();
   await page.getByRole('button',{name:'Favorite',exact:true}).click();
   await page.getByRole('button',{name:'Library',exact:true}).click();
   await page.getByRole('button',{name:'Favorites',exact:true}).click();
   await page.locator('.game-card').getByText('New Super Mario Bros.').waitFor();
   await page.getByRole('button',{name:'Settings',exact:true}).click();
   await page.getByLabel('language',{exact:true}).selectOption('pl');
   await page.getByRole('heading',{name:'Ustawienia',exact:true}).waitFor();
   await page.reload();await page.getByRole('button',{name:'Biblioteka',exact:true}).waitFor();
   assert.deepEqual(errors,[]);console.log('Remake verified',viewport);
  }finally{await ctx.close()}
 }
}
